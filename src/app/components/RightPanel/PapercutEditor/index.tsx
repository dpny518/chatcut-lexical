"use client"

import React, { useState, useEffect,useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';


import { cn } from "@/lib/utils";
import { EditorBlock } from './EditorBlock';
import { useEditorColors, useEditorHistory } from '@/hooks/useEditorHistory';
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
  const { pushState, undo, redo } = useEditorHistory(
    { blocks, cursorPosition, speakerColorIndices },
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
    
    if (event.key === 'Enter' && cursorPosition) {
      event.preventDefault();
      
      const blockIndex = blocks.findIndex(b => b.id === cursorPosition.blockId);
      if (blockIndex === -1) return;
  
      const currentBlock = blocks[blockIndex];
      const wordIndex = cursorPosition.wordIndex;
  
      const updatedContent = [
        ...content.slice(0, blocks.slice(0, blockIndex).reduce((sum, b) => sum + b.items.length, 0) + wordIndex),
        { ...content[blocks.slice(0, blockIndex).reduce((sum, b) => sum + b.items.length, 0) + wordIndex], word: '\n' },
        ...content.slice(blocks.slice(0, blockIndex).reduce((sum, b) => sum + b.items.length, 0) + wordIndex)
      ];
  
      updateTabContent(tabId, updatedContent);
      
      setCursorPosition({
        blockId: blocks[blockIndex + 1]?.id || currentBlock.id,
        wordIndex: 0
      });
    } else if (!(event.ctrlKey || event.metaKey)) {
      event.preventDefault();
    }
  }, [cursorPosition, blocks, content, undo, redo, updateTabContent, tabId]);

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

  return (
    <div 
      ref={editorRef}
      contentEditable
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      className={cn(
        "min-h-[300px] border-border rounded-lg p-4 overflow-y-auto focus:outline-none",
        "bg-background text-foreground"
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
        />
      ))}
      {/* Drop zone below all blocks */}
      {isDraggingBelow && (
        <div className="h-1 bg-blue-500 mt-2" />
      )}
    </div>
  );
});


PapercutEditor.displayName = 'PapercutEditor';

export default PapercutEditor;