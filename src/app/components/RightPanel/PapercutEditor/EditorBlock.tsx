"use client"

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Block, SpeakerColor, CursorPosition, ContentItem } from '@/app/types/papercut';
import { formatWordMetadata } from '@/app/utils/papercut-clipboard';
import '@/styles/papercutEditor.css';

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
    dropPosition
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
        "relative",
        isDragging && "opacity-50",
        isDropTarget && "z-10"
      )}
      draggable
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
      )}
      <div 
        data-block={block.id}
        className="block speaker"
        style={cssProperties}
        suppressContentEditableWarning
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripHorizontal className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="px-3 py-2">
          <h3 className="speaker-text mb-2 select-none font-medium text-sm">
            Speaker {block.speaker}
          </h3>
          <div className="leading-relaxed text-sm font-mono">
            {block.items.map((item, index) => (
              <span
                key={`${item.word}-${index}`}
                data-word-metadata={formatWordMetadata(item)}
                data-word-index={index}
                data-speaker={item.speaker}
                data-segment-id={item.segmentId}
                onClick={() => onWordClick(block.id, index)}
                onMouseEnter={(e) => handleWordMouseEnter(e, item)}
                onMouseLeave={handleWordMouseLeave}
                className={cn(
                  "word",
                  "relative inline-flex items-center px-2 py-1 m-0.5 rounded select-text"
                )}
              >
                {item.word}
                {cursorPosition?.blockId === block.id && 
                cursorPosition?.wordIndex === index && (
                  <span className="inline-block w-0.5 h-4 bg-sky-500 animate-pulse ml-0.5" />
                )}
              </span>
            ))}
            {cursorPosition?.blockId === block.id && 
            cursorPosition?.wordIndex === block.items.length && (
              <span className="inline-block w-0.5 h-4 bg-sky-500 animate-pulse ml-0.5" />
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