// src/components/WordHoverCard.tsx
import React, { ReactNode } from 'react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface WordHoverCardProps {
  word: string;
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  wordIndex: number;
  children: ReactNode;
}

export function WordHoverCard({
    word,
    startTime,
    endTime,
    segmentId,
    speaker,
    fileId,
    wordIndex,
    children
  }: WordHoverCardProps) {
    console.log('Rendering WordHoverCard for:', word);
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-64" style={{ background: 'white', border: '1px solid black', padding: '10px' }}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold">{word}</h4>
          <p className="text-xs">Speaker: {speaker}</p>
          <p className="text-xs">File: {fileId}</p>
          <p className="text-xs">Segment: {segmentId}</p>
          <p className="text-xs">Word Index: {wordIndex}</p>
          <p className="text-xs">Start Time: {startTime.toFixed(2)}s</p>
          <p className="text-xs">End Time: {endTime.toFixed(2)}s</p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}