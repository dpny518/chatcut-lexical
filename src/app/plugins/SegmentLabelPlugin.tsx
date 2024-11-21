// src/app/plugins/SegmentLabelPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getRoot, LexicalNode } from 'lexical';
import { $isElementNode, ElementNode } from 'lexical';
import { $isSegmentNode, SegmentNode } from '@/app/nodes/SegmentNode';

interface SegmentInfo {
  id: string;
  startTime: number;
  speaker: string;
}

export function SegmentLabelPlugin() {
  const [editor] = useLexicalComposerContext();
  const [segments, setSegments] = useState<SegmentInfo[]>([]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const newSegments: SegmentInfo[] = [];

        root.getChildren().forEach((node: LexicalNode) => {
          if ($isElementNode(node)) {
            node.getChildren().forEach((childNode: LexicalNode) => {
              if ($isSegmentNode(childNode)) {
                newSegments.push({
                  id: childNode.__segmentId,
                  startTime: childNode.__startTime,
                  speaker: childNode.__speaker,
                });
              }
            });
          }
        });

        setSegments(newSegments);
      });
    });
  }, [editor]);

  console.log('SegmentLabelPlugin: Rendering with segments:', segments);

  return (
    <div className="w-24 pr-2 text-xs text-gray-400 select-none opacity-50 hover:opacity-100 transition-opacity duration-300">
      {segments.map((segment) => (
        <div key={segment.id} className="py-0.5 flex justify-end items-center">
          <span className="mr-1">{formatTime(segment.startTime)}</span>
          <span className="font-bold">{segment.speaker}</span>
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}