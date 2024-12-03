import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { ContentItem } from '@/app/contexts/PaperCutContext';
import { parseClipboardData } from '@/app/utils/clipboard-utils';
import { GripHorizontal } from "lucide-react";

interface PapercutEditorProps {
  content: ContentItem[];
  onChange: (newContent: ContentItem[]) => void;
  tabId: string;
}

export interface PapercutEditorRef {
  addContentAtEnd: (clipboardData: string) => void;
  addContentAtCursor: (clipboardData: string) => void;
}

interface Block {
  id: string;
  items: ContentItem[];
  speaker: string;
}

interface SpeakerColor {
  bg: string;
  border: string;
  text: string;
  wordBg: string;
}

const generateColorForSpeaker = (index: number): SpeakerColor => {
  const hue = (index * 137.508) % 360;
  return {
    bg: `hsl(${hue}, 25%, 95%)`,
    border: `hsl(${hue}, 40%, 85%)`,
    text: `hsl(${hue}, 60%, 25%)`,
    wordBg: `hsl(${hue}, 40%, 90%)`
  };
};

const PapercutEditor = forwardRef<PapercutEditorRef, PapercutEditorProps>(({ content, onChange, tabId }, ref) => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [speakerColorIndices, setSpeakerColorIndices] = useState<Record<string, number>>({});
  const [cursorPosition, setCursorPosition] = useState<{ blockId: string; wordIndex: number } | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  
  const getColorForSpeaker = useCallback((speaker: string): SpeakerColor => {
    if (!(speaker in speakerColorIndices)) {
      setSpeakerColorIndices(prev => ({
        ...prev,
        [speaker]: Object.keys(prev).length
      }));
    }
    return generateColorForSpeaker(speakerColorIndices[speaker] || 0);
  }, [speakerColorIndices]);

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

        // Add the last group
        if (currentItems.length > 0) {
          pastedBlocks.push({
            id: `block-${Date.now()}-${currentSpeaker}`,
            items: currentItems,
            speaker: currentSpeaker
          });
        }

        // Create blocks for the split content
        if (beforeItems.length > 0) {
          pastedBlocks.unshift({
            id: `block-${Date.now()}-before`,
            items: beforeItems,
            speaker: currentBlock.speaker
          });
        }

        if (afterItems.length > 0) {
          pastedBlocks.push({
            id: `block-${Date.now()}-after`,
            items: afterItems,
            speaker: currentBlock.speaker
          });
        }

        // Replace the current block with the new blocks
        newBlocks.splice(blockIndex, 1, ...pastedBlocks);

        // Update cursor position to end of pasted content
        const lastPastedBlock = pastedBlocks[pastedBlocks.length - 1];
        setCursorPosition({
          blockId: lastPastedBlock.id,
          wordIndex: lastPastedBlock.items.length
        });

        return newBlocks;
      });
    } catch (error) {
      console.error('Error handling paste:', error);
    }
  }, [cursorPosition]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
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
  }, [cursorPosition]);

  const handleWordClick = useCallback((blockId: string, wordIndex: number) => {
    setCursorPosition({ blockId, wordIndex });
  }, []);



  const findParentBlock = (node: Node): HTMLElement | null => {
    let current: Node | null = node;
    
    while (current && !(current instanceof HTMLElement && current.hasAttribute('data-block'))) {
      current = current.parentNode;
      if (!current || current === document.body) {
        return null;
      }
    }
    
    return current as HTMLElement;
  };
  
  const handleCopy = useCallback((event: ClipboardEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
  
    const range = selection.getRangeAt(0);
    const blockElement = findParentBlock(range.commonAncestorContainer);
    
    if (blockElement) {
      const wordElements = blockElement.querySelectorAll('[data-word-metadata]');
      if (wordElements.length > 0) {
        const metadata = Array.from(wordElements)
          .map(element => element.getAttribute('data-word-metadata'))
          .filter((meta): meta is string => meta !== null)
          .join(' ');
  
        event.clipboardData?.setData('text/plain', metadata);
        event.preventDefault();
      }
    }
  }, []);

  const formatWordMetadata = (item: ContentItem): string => {
    return `${item.word},${item.startTime},${item.endTime},${item.wordIndex}|${item.segmentId},${item.segmentStartTime},${item.segmentEndTime},${item.speaker}|${item.fileName},${item.fileId}`;
  };
  const addContentAtEnd = useCallback((clipboardData: string) => {
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
  }, []);

  const addContentAtCursor = useCallback((clipboardData: string) => {
    const newItems = parseClipboardData(clipboardData);
    if (!newItems?.length) return;

    setBlocks(prevBlocks => {
      if (!cursorPosition || prevBlocks.length === 0) {
        // If no cursor position, just append as new block
        const newBlock = {
          id: `block-${Date.now()}`,
          items: newItems,
          speaker: newItems[0].speaker
        };
        return [...prevBlocks, newBlock];
      }

      // Insert at cursor position
      const blockIndex = prevBlocks.findIndex(b => b.id === cursorPosition.blockId);
      if (blockIndex === -1) return prevBlocks;

      const currentBlock = prevBlocks[blockIndex];
      const wordIndex = cursorPosition.wordIndex;
      const newBlocks = [...prevBlocks];

      // Split current block items and insert new items
      const beforeItems = currentBlock.items.slice(0, wordIndex);
      const afterItems = currentBlock.items.slice(wordIndex);

      const updatedBlock = {
        ...currentBlock,
        items: [...beforeItems, ...newItems, ...afterItems]
      };

      newBlocks[blockIndex] = updatedBlock;

      return newBlocks;
    });
  }, [cursorPosition]);

  useImperativeHandle(ref, () => ({
    addContentAtEnd,
    addContentAtCursor
  }));

  return (
    <div 
      ref={editorRef}
      contentEditable
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      className={`min-h-[300px] border rounded p-4 overflow-y-auto focus:outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      suppressContentEditableWarning
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {blocks.length === 0 && (
        <div className="text-gray-400 pointer-events-none">Paste transcript data here...</div>
      )}
      {blocks.map((block) => {
        const color = getColorForSpeaker(block.speaker);
        return (
          <div 
            key={block.id}
            data-block={block.id}
            className="mb-4 relative group rounded-lg p-3"
            style={{ 
              backgroundColor: color.bg,
              borderLeft: `4px solid ${color.border}`
            }}
            suppressContentEditableWarning
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripHorizontal className="w-4 h-4" style={{ color: color.text }} />
            </div>
            <h3 
              className="mb-2 select-none font-medium" 
              style={{ color: color.text }}
              suppressContentEditableWarning
            >
              Speaker {block.speaker}
            </h3>
            <div className="leading-relaxed" suppressContentEditableWarning>
              {block.items.map((item, index) => (
                <span
                  key={`${item.word}-${index}`}
                  data-word-metadata={formatWordMetadata(item)}
                  className="inline-block px-2 py-1 m-0.5 rounded select-text transition-colors"
                  style={{ 
                    backgroundColor: color.wordBg,
                    color: color.text
                  }}
                  onClick={() => handleWordClick(block.id, index)}
                  suppressContentEditableWarning
                >
                  {item.word}
                  {cursorPosition?.blockId === block.id && cursorPosition?.wordIndex === index && (
                    <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5" />
                  )}
                </span>
              ))}
              {cursorPosition?.blockId === block.id && cursorPosition?.wordIndex === block.items.length && (
                <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default PapercutEditor;