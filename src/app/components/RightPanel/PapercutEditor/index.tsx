"use client"

import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { EditorBlock } from './EditorBlock';
import { useEditorColors, useEditorHistory } from '@/hooks/useEditorHistory';
import { parseClipboardData } from '@/app/utils/papercut-clipboard';
import type { ContentItem, Block, CursorPosition, PapercutEditorRef, EditorState } from '@/app/types/papercut';
import { handleClipboardCopy } from '@/app/utils/papercut-clipboard';
interface PapercutEditorProps {
  content: ContentItem[];
  onChange: (newContent: ContentItem[]) => void;
  tabId: string;
}

const findParentBlock = (node: Node): HTMLElement | null => {
    let current: Node | null = node;
    while (current && !(current instanceof HTMLElement && current.hasAttribute('data-block'))) {
      current = current.parentNode;
      // Stop if we reach the editor root or document body
      if (!current || current === document.body) {
        return null;
      }
    }
    return current as HTMLElement;
  };
  
  // Helper to find selected word elements within blocks
  const findSelectedWordElements = (range: Range): Element[] => {
    const allWordElements = document.querySelectorAll('[data-word-metadata]');
    const selectedElements: Element[] = [];
  
    // If selection is collapsed (just a cursor), find the closest word
    if (range.collapsed) {
      const cursorPosition = range.getBoundingClientRect();
      let closestElement = allWordElements[0];
      let closestDistance = Infinity;
  
      allWordElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.left - cursorPosition.left) + 
                        Math.abs(rect.top - cursorPosition.top);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestElement = element;
        }
      });
  
      if (closestElement) {
        selectedElements.push(closestElement);
      }
      return selectedElements;
    }
  
    // For actual selections, get all word elements that intersect with the range
    allWordElements.forEach(element => {
      if (range.intersectsNode(element)) {
        selectedElements.push(element);
      }
    });
  
    return selectedElements;
  };

const PapercutEditor = forwardRef<PapercutEditorRef, PapercutEditorProps>(({ content, onChange, tabId }, ref) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const [speakerColorIndices, setSpeakerColorIndices] = useState<Record<string, number>>({});
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { generateColorForSpeaker } = useEditorColors();
  const { pushState, undo, redo } = useEditorHistory(
    { blocks, cursorPosition, speakerColorIndices },
    (state) => {
      setBlocks(state.blocks);
      setCursorPosition(state.cursorPosition);
      setSpeakerColorIndices(state.speakerColorIndices);
      
      // Convert blocks back to ContentItem[] for onChange
      const flatContent = state.blocks.reduce<ContentItem[]>((acc, block) => {
        return [...acc, ...block.items];
      }, []);
      
      onChange(flatContent);
    }
  );

  const getColorForSpeaker = useCallback((speaker: string) => {
    if (!(speaker in speakerColorIndices)) {
      setSpeakerColorIndices(prev => ({
        ...prev,
        [speaker]: Object.keys(prev).length
      }));
    }
    return generateColorForSpeaker(speakerColorIndices[speaker] || 0);
  }, [speakerColorIndices, generateColorForSpeaker]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    
    try {
      const newItems = parseClipboardData(pastedText);
      if (!newItems?.length) return;

      setBlocks(prevBlocks => {
        // If no cursor position or no blocks, just append as new block
        if (!cursorPosition || prevBlocks.length === 0) {
          const newBlock = {
            id: `block-${Date.now()}`,
            items: newItems,
            speaker: newItems[0].speaker
          };
          return [...prevBlocks, newBlock];
        }

        // Handle paste at cursor position
        const blockIndex = prevBlocks.findIndex(b => b.id === cursorPosition.blockId);
        if (blockIndex === -1) return prevBlocks;

        const currentBlock = prevBlocks[blockIndex];
        const wordIndex = cursorPosition.wordIndex;
        const newBlocks = [...prevBlocks];

        // Split current block items
        const beforeItems = currentBlock.items.slice(0, wordIndex);
        const afterItems = currentBlock.items.slice(wordIndex);

        // Group new items by speaker
        const pastedBlocks: Block[] = [];
        let currentSpeaker = newItems[0].speaker;
        let currentItems: ContentItem[] = [];

        newItems.forEach(item => {
          if (item.speaker !== currentSpeaker) {
            pastedBlocks.push({
              id: `block-${Date.now()}-${currentSpeaker}`,
              items: currentItems,
              speaker: currentSpeaker
            });
            currentItems = [];
            currentSpeaker = item.speaker;
          }
          currentItems.push(item);
        });

        if (currentItems.length > 0) {
          pastedBlocks.push({
            id: `block-${Date.now()}-${currentSpeaker}`,
            items: currentItems,
            speaker: currentSpeaker
          });
        }

        // Handle splitting and merging of blocks
        const finalBlocks: Block[] = [];
        
        if (beforeItems.length > 0) {
          finalBlocks.push({
            id: `block-${Date.now()}-before`,
            items: beforeItems,
            speaker: currentBlock.speaker
          });
        }
        
        finalBlocks.push(...pastedBlocks);
        
        if (afterItems.length > 0) {
          finalBlocks.push({
            id: `block-${Date.now()}-after`,
            items: afterItems,
            speaker: currentBlock.speaker
          });
        }

        // Replace the current block with the new blocks
        newBlocks.splice(blockIndex, 1, ...finalBlocks);

        return newBlocks;
      });
    } catch (error) {
      console.error('Error handling paste:', error);
    }
  }, [cursorPosition]);


const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
      return;
    }
    
    if (event.key === 'Enter' && cursorPosition) {
      event.preventDefault();
      
      setBlocks(prevBlocks => {
        const blockIndex = prevBlocks.findIndex(b => b.id === cursorPosition.blockId);
        if (blockIndex === -1) return prevBlocks;

        const currentBlock = prevBlocks[blockIndex];
        const wordIndex = cursorPosition.wordIndex;

        const firstHalf = {
          ...currentBlock,
          id: `block-${Date.now()}-1`,
          items: currentBlock.items.slice(0, wordIndex)
        };

        const secondHalf = {
          ...currentBlock,
          id: `block-${Date.now()}-2`,
          items: currentBlock.items.slice(wordIndex)
        };

        const newBlocks = [...prevBlocks];
        newBlocks.splice(blockIndex, 1, firstHalf, secondHalf);
        
        setCursorPosition({
          blockId: secondHalf.id,
          wordIndex: 0
        });

        return newBlocks;
      });
    } else if (!(event.ctrlKey || event.metaKey)) {
      event.preventDefault();
    }
  }, [cursorPosition, undo, redo]);

  const handleWordClick = useCallback((blockId: string, wordIndex: number) => {
    setCursorPosition({ blockId, wordIndex });
  }, []);

  // Handle copy functionality
  const handleCopy = useCallback((event: ClipboardEvent) => {
    const selection = window.getSelection();
    if (selection) {
      handleClipboardCopy(event, selection);
    }
  }, []);

  // Handle copy functionality
  useEffect(() => {
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [handleCopy]);

  // Initialize blocks from content prop
  useEffect(() => {
    if (content.length > 0) {
      const newBlocks: Block[] = [];
      let currentSpeaker = content[0].speaker;
      let currentItems: ContentItem[] = [];

      content.forEach((item, index) => {
        if (item.speaker !== currentSpeaker) {
          newBlocks.push({
            id: `block-${Date.now()}-${index}`,
            items: currentItems,
            speaker: currentSpeaker
          });
          currentItems = [];
          currentSpeaker = item.speaker;
        }
        currentItems.push(item);
      });

      if (currentItems.length > 0) {
        newBlocks.push({
          id: `block-${Date.now()}-${content.length}`,
          items: currentItems,
          speaker: currentSpeaker
        });
      }

      setBlocks(newBlocks);
    }
  }, [content]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    addContentAtEnd: (clipboardData: string) => {
      const newItems = parseClipboardData(clipboardData);
      if (!newItems?.length) return;

      setBlocks(prevBlocks => {
        const newBlock = {
          id: `block-${Date.now()}`,
          items: newItems,
          speaker: newItems[0].speaker
        };
        return [...prevBlocks, newBlock];
      });
    },
    addContentAtCursor: (clipboardData: string) => {
      const newItems = parseClipboardData(clipboardData);
      if (!newItems?.length) return;

      setBlocks(prevBlocks => {
        if (!cursorPosition || prevBlocks.length === 0) {
          const newBlock = {
            id: `block-${Date.now()}`,
            items: newItems,
            speaker: newItems[0].speaker
          };
          return [...prevBlocks, newBlock];
        }

        const blockIndex = prevBlocks.findIndex(b => b.id === cursorPosition.blockId);
        if (blockIndex === -1) return prevBlocks;

        const currentBlock = prevBlocks[blockIndex];
        const wordIndex = cursorPosition.wordIndex;
        const newBlocks = [...prevBlocks];

        const updatedBlock = {
          ...currentBlock,
          items: [
            ...currentBlock.items.slice(0, wordIndex),
            ...newItems,
            ...currentBlock.items.slice(wordIndex)
          ]
        };

        newBlocks[blockIndex] = updatedBlock;
        return newBlocks;
      });
    },
    getCurrentState: () => ({
      blocks,
      cursorPosition,
      speakerColorIndices
    }),
    restoreState: (state: EditorState) => {
      setBlocks(state.blocks);
      setCursorPosition(state.cursorPosition);
      setSpeakerColorIndices(state.speakerColorIndices);
    }
  }), [blocks, cursorPosition, speakerColorIndices]);

  return (
    <div 
      ref={editorRef}
      contentEditable
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      className={cn(
        "min-h-[300px] border-border rounded-lg p-4 overflow-y-auto focus:outline-none",
        "bg-background text-foreground",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      suppressContentEditableWarning
      spellCheck={false}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {blocks.length === 0 && (
        <div className="text-muted-foreground pointer-events-none">
          Paste transcript data here...
        </div>
      )}
      {blocks.map((block) => (
        <EditorBlock
          key={block.id}
          block={block}
          colors={getColorForSpeaker(block.speaker)}
          cursorPosition={cursorPosition}
          onWordClick={handleWordClick}
        />
      ))}
    </div>
  );
});

PapercutEditor.displayName = 'PapercutEditor';

export default PapercutEditor;