"use client"

import React, { useState, useEffect,useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import { Undo, Redo } from 'lucide-react'; // Import icons
import { Button } from '@/components/ui/button'; // Assuming you have a Button component

import { cn } from "@/lib/utils";
import { EditorBlock } from './EditorBlock';
import { useEditorHistory } from '@/hooks/useEditorHistory';
import { useEditorColors } from '@/hooks/useEditorColors';
import { parseClipboardData } from '@/app/utils/papercut-clipboard';
import type { ContentItem, Block, CursorPosition, PapercutEditorRef, EditorState } from '@/app/types/papercut';
import { handleClipboardCopy } from '@/app/utils/papercut-clipboard';
import { usePaperCut } from '@/app/contexts/PaperCutContext';
import { useActiveEditor } from '@/app/components/RightPanel/ActiveEditorContext';


interface PapercutEditorProps {
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

  const PapercutEditor = forwardRef<PapercutEditorRef, PapercutEditorProps>(({ tabId }, ref) => {
    const { updateTabContent, getTabContent } = usePaperCut();
    const content = getTabContent(tabId) || [];
    
    const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
    const [speakerColorIndices, setSpeakerColorIndices] = useState<Record<string, number>>({});
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingBelow, setIsDraggingBelow] = useState(false);
    const [dropTarget, setDropTarget] = useState<{ blockId: string, position: 'above' | 'below' } | null>(null);
    
    const editorRef = useRef<HTMLDivElement>(null);

    // Use useMemo to derive blocks from content
    const blocks = useMemo(() => {
      if (content.length === 0) return [];
  
      const newBlocks: Block[] = [];
      let currentSpeaker = content[0].speaker;
      let currentItems: ContentItem[] = [];
  
      content.forEach((item, index) => {
        if (item.speaker !== currentSpeaker) {
          newBlocks.push({
            id: `block-${newBlocks.length}`,
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
          id: `block-${newBlocks.length}`,
          items: currentItems,
          speaker: currentSpeaker
        });
      }
  
      return newBlocks;
    }, [content]);

    
  const { generateColorForSpeaker } = useEditorColors();
  const { pushState, undo, redo, canUndo, canRedo } = useEditorHistory(
    { blocks, content, cursorPosition, speakerColorIndices },
    (state) => {
      // Instead of setting blocks directly, update the content
      const flatContent = state.blocks.reduce<ContentItem[]>((acc, block) => {
        return [...acc, ...block.items];
      }, []);
      updateTabContent(tabId, flatContent);
      setCursorPosition(state.cursorPosition);
      setSpeakerColorIndices(state.speakerColorIndices);
    }
  );

  const deriveBlocksFromContent = (content: ContentItem[]): Block[] => {
    const newBlocks: Block[] = [];
    let currentSpeaker = content[0]?.speaker;
    let currentItems: ContentItem[] = [];
  
    content.forEach((item, index) => {
      if (item.speaker !== currentSpeaker) {
        if (currentItems.length > 0) {
          newBlocks.push({
            id: `block-${Date.now()}-${newBlocks.length}`,
            items: currentItems,
            speaker: currentSpeaker
          });
        }
        currentItems = [];
        currentSpeaker = item.speaker;
      }
      currentItems.push(item);
    });
  
    if (currentItems.length > 0) {
      newBlocks.push({
        id: `block-${Date.now()}-${newBlocks.length}`,
        items: currentItems,
        speaker: currentSpeaker
      });
    }
  
    return newBlocks;
  };

  const handleContentChange = useCallback((newContent: ContentItem[]) => {
    // Derive new blocks from newContent (this is for local use only)
    const newBlocks: Block[] = [];
    let currentSpeaker = newContent[0]?.speaker;
    let currentItems: ContentItem[] = [];
  
    newContent.forEach((item, index) => {
      if (item.speaker !== currentSpeaker || (index > 0 && item.startTime < newContent[index - 1].startTime)) {
        if (currentItems.length > 0) {
          newBlocks.push({
            id: `block-${Date.now()}-${newBlocks.length}`,
            items: currentItems,
            speaker: currentSpeaker
          });
        }
        currentItems = [];
        currentSpeaker = item.speaker;
      }
      currentItems.push(item);
    });
  
    // Push the last block if there are remaining items
    if (currentItems.length > 0) {
      newBlocks.push({
        id: `block-${Date.now()}-${newBlocks.length}`,
        items: currentItems,
        speaker: currentSpeaker
      });
    }
  
    // Update the content in the tab
    updateTabContent(tabId, newContent);
  
    // Push the new state to the history
    pushState({ 
      blocks: newBlocks, 
      content: newContent, 
      cursorPosition, 
      speakerColorIndices 
    });
  }, [updateTabContent, tabId, pushState, cursorPosition, speakerColorIndices]);
  
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
  
      let updatedContent: ContentItem[];
  
      if (!cursorPosition || blocks.length === 0) {
        updatedContent = [...content, ...newItems];
      } else {
        const blockIndex = blocks.findIndex(b => b.id === cursorPosition.blockId);
        if (blockIndex === -1) return;
  
        const currentBlock = blocks[blockIndex];
        const wordIndex = cursorPosition.wordIndex;
  
        updatedContent = [
          ...content.slice(0, blocks.slice(0, blockIndex).reduce((sum, b) => sum + b.items.length, 0) + wordIndex),
          ...newItems,
          ...content.slice(blocks.slice(0, blockIndex).reduce((sum, b) => sum + b.items.length, 0) + wordIndex)
        ];
      }
  
      updateTabContent(tabId, updatedContent);
    } catch (error) {
      console.error('Error handling paste:', error);
    }
  }, [cursorPosition, blocks, content, updateTabContent, tabId]);


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
    
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      
      const selection = window.getSelection();
      if (!selection) return;
  
      let startBlock: Block | undefined;
      let startIndex: number = 0;
      let endBlock: Block | undefined;
      let endIndex: number = 0;
  
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const startElement = findParentBlock(range.startContainer);
        const endElement = findParentBlock(range.endContainer);
  
        if (startElement && endElement) {
          startBlock = blocks.find(b => b.id === startElement.getAttribute('data-block'));
          endBlock = blocks.find(b => b.id === endElement.getAttribute('data-block'));
  
          if (startBlock && endBlock) {
            startIndex = Array.from(startElement.querySelectorAll('[data-word-index]')).findIndex(
              el => el.contains(range.startContainer)
            );
            endIndex = Array.from(endElement.querySelectorAll('[data-word-index]')).findIndex(
              el => el.contains(range.endContainer)
            );
  
            if (startIndex === -1) startIndex = 0;
            if (endIndex === -1) endIndex = endBlock.items.length - 1;
          }
        }
      } else if (cursorPosition) {
        startBlock = endBlock = blocks.find(b => b.id === cursorPosition.blockId);
        startIndex = endIndex = cursorPosition.wordIndex;
        if (event.key === 'Backspace' && startIndex > 0) {
          startIndex--;
        }
      }
  
      if (startBlock && endBlock) {
        const updatedContent = content.filter((_, index) => {
          const blockIndex = blocks.findIndex(b => b.items.includes(content[index]));
          const wordIndex = blocks[blockIndex].items.findIndex(item => item === content[index]);
          
          if (blocks[blockIndex] === startBlock && wordIndex < startIndex) return true;
          if (blocks[blockIndex] === endBlock && wordIndex > endIndex) return true;
          if (blocks[blockIndex] !== startBlock && blocks[blockIndex] !== endBlock) return true;
          
          return false;
        });
  
        updateTabContent(tabId, updatedContent);
        
        // Set cursor position to start of deletion
        const newCursorPosition = {
          blockId: startBlock.id,
          wordIndex: startIndex
        };
        setCursorPosition(newCursorPosition);
      }
    }else   if (event.key === 'Enter' && cursorPosition) {
      event.preventDefault();
      
      const blockIndex = blocks.findIndex(b => b.id === cursorPosition.blockId);
      if (blockIndex === -1) return;
  
      const currentBlock = blocks[blockIndex];
      const wordIndex = cursorPosition.wordIndex;
  
      // Split the block at the word level
      const firstHalfItems = currentBlock.items.slice(0, wordIndex);
      const secondHalfItems = currentBlock.items.slice(wordIndex);
  
      // Create two new blocks
      const newBlocks = [
        ...blocks.slice(0, blockIndex),
        {
          id: `block-${Date.now()}-1`,
          items: firstHalfItems,
          speaker: currentBlock.speaker
        },
        {
          id: `block-${Date.now()}-2`,
          items: secondHalfItems,
          speaker: currentBlock.speaker
        },
        ...blocks.slice(blockIndex + 1)
      ];
  
      // Update the content
      const newContent = newBlocks.flatMap(block => block.items);
  
      // Update the content in the tab
      updateTabContent(tabId, newContent);
  
      // Set cursor position to the start of the second new block
      const newCursorPosition = {
        blockId: newBlocks[blockIndex + 1].id,
        wordIndex: 0
      };
      setCursorPosition(newCursorPosition);
  
      // Push the new state to the history
      pushState({ 
        blocks: newBlocks, 
        content: newContent, 
        cursorPosition: newCursorPosition, 
        speakerColorIndices 
      });
    } else if (!(event.ctrlKey || event.metaKey)) {
      event.preventDefault();
    }
  }, [blocks, cursorPosition, updateTabContent, tabId, pushState, speakerColorIndices, undo, redo]);
    

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

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    addContentAtEnd: (clipboardData: string) => {
      const newItems = parseClipboardData(clipboardData);
      if (!newItems?.length) return;

      const updatedContent = [...content, ...newItems];
      updateTabContent(tabId, updatedContent);
    },
    addContentAtCursor: (clipboardData: string) => {
      const newItems = parseClipboardData(clipboardData);
      if (!newItems?.length) return;

      if (!cursorPosition || content.length === 0) {
        const updatedContent = [...content, ...newItems];
        updateTabContent(tabId, updatedContent);
      } else {
        const updatedContent = [
          ...content.slice(0, cursorPosition.wordIndex),
          ...newItems,
          ...content.slice(cursorPosition.wordIndex)
        ];
        updateTabContent(tabId, updatedContent);
      }
    },
    getCurrentState: () => ({
      blocks,
      cursorPosition,
      speakerColorIndices
    }),
    restoreState: (state: EditorState) => {
      const flatContent = state.blocks.reduce<ContentItem[]>((acc, block) => {
        return [...acc, ...block.items];
      }, []);
      updateTabContent(tabId, flatContent);
      setCursorPosition(state.cursorPosition);
      setSpeakerColorIndices(state.speakerColorIndices);
    }
  }), [blocks, cursorPosition, speakerColorIndices, content, tabId, updateTabContent]);



  const handleDragStart = useCallback((blockId: string) => {
    setDraggedBlockId(blockId);
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const editorRect = editorRef.current?.getBoundingClientRect();
    if (editorRect) {
      const mouseY = e.clientY;
      if (mouseY > editorRect.bottom - 20) { // 20px threshold for bottom area
        setIsDraggingBelow(true);
        setDropTarget(null);
      } else {
        setIsDraggingBelow(false);
      }
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedBlockId) {
      const updatedContent = blocks.reduce<ContentItem[]>((acc, block) => {
        if (block.id === draggedBlockId) {
          // Skip the dragged block for now
          return acc;
        }
        return [...acc, ...block.items];
      }, []);
  
      const draggedBlock = blocks.find(block => block.id === draggedBlockId);
      if (!draggedBlock) return;
  
      if (isDraggingBelow) {
        // If dragging below all blocks, append to the end
        updatedContent.push(...draggedBlock.items);
      } else if (dropTarget) {
        const targetBlockIndex = blocks.findIndex(b => b.id === dropTarget.blockId);
        if (targetBlockIndex !== -1) {
          const insertIndex = dropTarget.position === 'below' 
            ? blocks.slice(0, targetBlockIndex + 1).reduce((sum, b) => sum + b.items.length, 0)
            : blocks.slice(0, targetBlockIndex).reduce((sum, b) => sum + b.items.length, 0);
          updatedContent.splice(insertIndex, 0, ...draggedBlock.items);
        }
      }
  
      updateTabContent(tabId, updatedContent);
    }
    setDraggedBlockId(null);
    setDropTarget(null);
    setIsDragging(false);
    setIsDraggingBelow(false);
  }, [draggedBlockId, dropTarget, isDraggingBelow, blocks, updateTabContent, tabId]);
  
  const handleDeleteBlock = useCallback((blockId: string) => {
    const updatedContent = content.filter(item => {
      const block = blocks.find(b => b.items.includes(item));
      return block?.id !== blockId;
    });
    handleContentChange(updatedContent);
  }, [blocks, content, handleContentChange]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2 mb-2">
        <Button 
          onClick={undo} 
          disabled={!canUndo}
          variant="outline"
          size="sm"
        >
          <Undo className="w-4 h-4 mr-1" />
          Undo
        </Button>
        <Button 
          onClick={redo} 
          disabled={!canRedo}
          variant="outline"
          size="sm"
        >
          <Redo className="w-4 h-4 mr-1" />
          Redo
        </Button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        className={cn(
          "min-h-[300px] border-border rounded-lg p-4 overflow-y-auto focus:outline-none",
          "bg-background text-foreground",
          "hide-text-cursor" 
        )}
        suppressContentEditableWarning
        spellCheck={false}
      >
    {blocks.map((block) => (
        <EditorBlock
          key={block.id}
          block={block}
          colors={getColorForSpeaker(block.speaker)}
          cursorPosition={cursorPosition}
          onWordClick={handleWordClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={(blockId, position) => {
            if (blockId !== draggedBlockId) {
              setDropTarget({ blockId, position });
              setIsDraggingBelow(false);
            }
          }}
          isDragging={draggedBlockId === block.id}
          isDropTarget={dropTarget?.blockId === block.id}
          dropPosition={dropTarget?.blockId === block.id ? dropTarget.position : null}
          onDeleteBlock={handleDeleteBlock}
        />
      ))}
      {/* Drop zone below all blocks */}
      {isDraggingBelow && (
        <div className="h-1 bg-blue-500 mt-2" />
      )}
     </div>
    </div>
  );
});


PapercutEditor.displayName = 'PapercutEditor';

export default PapercutEditor;