// src/app/components/SegmentHoverCard.tsx
import React from 'react';

export interface SegmentHoverCardProps {
  text: string;
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  fileName: string;
  rect: DOMRect;
}

export function SegmentHoverCard({
  text,
  startTime,
  endTime,
  segmentId,
  speaker,
  fileId,
  fileName,
  rect,
}: SegmentHoverCardProps) {
  const style: React.CSSProperties = {
    position: 'absolute',
    top: `${rect.bottom}px`,
    left: `${rect.left}px`,
    backgroundColor: 'white',
    border: '1px solid black',
    padding: '5px',
    borderRadius: '3px',
    zIndex: 1000,
  };

  return (
    <div style={style}>
      <p>Text: {text}</p>
      <p>Start Time: {startTime}</p>
      <p>End Time: {endTime}</p>
      <p>Segment ID: {segmentId}</p>
      <p>Speaker: {speaker}</p>
      <p>File ID: {fileId}</p>
      <p>File Name: {fileName}</p>
    </div>
  );
}