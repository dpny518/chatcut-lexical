// src/components/WordHoverCard.tsx
import React from 'react';

export interface WordHoverCardProps {
  word: string;
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  fileName: string | undefined;
  wordIndex: number;
  rect: DOMRect;
}

export function WordHoverCard({
    word,
    startTime,
    endTime,
    segmentId,
    speaker,
    fileId,
    fileName,
    wordIndex,
    rect
  }: WordHoverCardProps) {
    console.log('Rendering WordHoverCard for:', word, {
      startTime, endTime, segmentId, speaker, fileId, fileName, wordIndex, rect
    });

  return (
    <div style={{
      position: 'fixed',
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      zIndex: 1000,
      backgroundColor: 'white',
      border: '1px solid black',
      borderRadius: '4px',
      padding: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    }}>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{word}</h4>
        <p className="text-sm">Speaker: {speaker}</p>
        <p className="text-sm">File: {fileName || 'Unknown'} ({fileId})</p>
        <p className="text-sm">Segment: {segmentId}</p>
        <p className="text-sm">Word Index: {wordIndex}</p>
        <p className="text-sm">Start Time: {startTime !== -1 ? `${startTime.toFixed(2)}s` : 'N/A'}</p>
        <p className="text-sm">End Time: {endTime !== -1 ? `${endTime.toFixed(2)}s` : 'N/A'}</p>
      </div>
    </div>
  );
}