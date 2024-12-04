"use client"

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Block, SpeakerColor, CursorPosition, ContentItem } from '@/app/types/papercut';
import { formatWordMetadata } from '@/app/utils/papercut-clipboard';
import '@/styles/papercutEditor.css';
import { GripHorizontal, Trash2 } from "lucide-react";

interface EditorBlockProps {
  block: Block;
  colors: SpeakerColor;
  cursorPosition: CursorPosition | null;
  onWordClick: (blockId: string, wordIndex: number) => void;
  onDragStart: (blockId: string) => void;
  onDragEnd: () => void;
  onDragOver: (blockId: string, position: 'above' | 'below') => void;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: 'above' | 'below' | null;
  onDeleteBlock: (blockId: string) => void;
}


export const EditorBlock = memo(({ 
    block, 
    colors, 
    cursorPosition, 
    onWordClick, 
    onDragStart, 
    onDragEnd, 
    onDragOver,
    isDragging,
    isDropTarget,
    dropPosition,
    onDeleteBlock
  }: EditorBlockProps) => {
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const blockRef = useRef<HTMLDivElement>(null);
  
  const handleWordMouseEnter = useCallback((event: React.MouseEvent<HTMLSpanElement>, item: ContentItem) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }

    const element = event.currentTarget;
    
    hoverTimerRef.current = setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const metadata = formatWordMetadata(item);
      const formattedMetadata = `Word: ${item.word}\nStart: ${item.startTime}\nEnd: ${item.endTime}\nSpeaker: ${item.speaker}\nSegment: ${item.segmentId}`;
      
      setTooltipContent(formattedMetadata);
      setTooltipPosition({
        x: window.scrollX + rect.left,
        y: window.scrollY + rect.bottom
      });
    }, 1000);
  }, []);

  const handleWordMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setTooltipContent(null);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const cssProperties = {
    '--bg': colors.bg,
    '--block-hover-bg': colors.blockHover,
    '--word-hover-bg': colors.wordHover,
    '--text-light': colors.textLight,
    '--text-dark': colors.textDark,
    '--edge-line-color': colors.edgeLine,
  } as React.CSSProperties;

  return (
    <div 
      ref={blockRef} 
      className={cn(
        "relative group",
        isDragging && "opacity-50",
        isDropTarget && "z-10"
      )}
      draggable="true"
      aria-roledescription="draggable item"
      aria-selected={isDragging}
      onDragStart={() => onDragStart(block.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault();
        const rect = blockRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseY = e.clientY;
          const blockMiddle = rect.top + rect.height / 2;
          onDragOver(block.id, mouseY < blockMiddle ? 'above' : 'below');
        }
      }}
    >
      {isDropTarget && dropPosition === 'above' && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" aria-hidden="true" />
      )}
      <div 
        data-block={block.id}
        className="block speaker relative"
        style={cssProperties}
        suppressContentEditableWarning
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripHorizontal className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDeleteBlock(block.id)}
            className="p-1 rounded-full hover:bg-red-500 hover:text-white transition-colors"
            aria-label={`Delete block for Speaker ${block.speaker}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="px-3 py-2">
          <h3 className="speaker-text mb-2 select-none font-medium text-sm">
            Speaker {block.speaker}
          </h3>
          <div className="leading-relaxed text-sm font-mono" role="list">
          {block.items.map((item, index) => (
                    <span
                        key={`${item.word}-${index}`}
                        data-word-metadata={formatWordMetadata(item)}
                        data-word-index={index}
                        data-speaker={item.speaker}
                        data-segment-id={item.segmentId}
                        onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const newWordIndex = clickX > rect.width / 2 ? index + 1 : index;
                        onWordClick(block.id, newWordIndex);
                        }}
                        onMouseEnter={(e) => handleWordMouseEnter(e, item)}
                        onMouseLeave={handleWordMouseLeave}
                        className={cn(
                        "word",
                        "relative inline-flex items-center px-2 py-1 m-0.5 rounded select-text"
                        )}
                        role="listitem"
                        tabIndex={0}
                        aria-label={`${item.word} (Speaker ${item.speaker})`}
                    >
                        {item.word}
                        {(cursorPosition?.blockId === block.id && 
                        cursorPosition?.wordIndex === index) && (
                        <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-sky-500 animate-pulse" aria-hidden="true" />
                        )}
                        {(cursorPosition?.blockId === block.id && 
                        cursorPosition?.wordIndex === index + 1) && (
                        <span className="absolute right-0 top-0 bottom-0 w-0.5 bg-sky-500 animate-pulse" aria-hidden="true" />
                        )}
                    </span>
                    ))}
                    {cursorPosition?.blockId === block.id && 
                    cursorPosition?.wordIndex === block.items.length && (
                    <span className="inline-block w-0.5 h-full bg-sky-500 animate-pulse ml-0.5" aria-hidden="true" />
                    )}
            {cursorPosition?.blockId === block.id && 
            cursorPosition?.wordIndex === block.items.length && (
            <span className="inline-block w-0.5 h-4 bg-sky-500 animate-pulse ml-0.5" aria-hidden="true" />
            )}
            {cursorPosition?.blockId === block.id && 
            cursorPosition?.wordIndex === block.items.length && (
              <span className="inline-block w-0.5 h-4 bg-sky-500 animate-pulse ml-0.5" aria-hidden="true" />
            )}
          </div>
        </div>
      </div>

      {tooltipContent && (
        <div
          className={cn(
            "fixed py-2 px-3 text-xs rounded shadow-lg",
            "bg-zinc-900/95 text-zinc-100 border border-zinc-700",
            "z-[9999] pointer-events-none"
          )}
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translate(-50%, 8px)',
            maxWidth: '300px'
          }}
          role="tooltip"
        >
          <pre className="font-mono whitespace-pre-wrap">
            {tooltipContent}
          </pre>
        </div>
      )}
    </div>
  );
});

EditorBlock.displayName = 'EditorBlock';