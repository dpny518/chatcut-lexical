// src/app/plugins/SegmentHoverPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, $isElementNode } from 'lexical';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { SegmentHoverCard, SegmentHoverCardProps } from '@/app/components/SegmentHoverCard';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { useFileSystem } from '@/app/contexts/FileSystemContext';

export function SegmentHoverPlugin() {
  const [editor] = useLexicalComposerContext();
  const [hoverData, setHoverData] = useState<SegmentHoverCardProps | null>(null);
  const { files } = useFileSystem();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSegmentRef = useRef<string | null>(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const segmentElement = target.closest('.papercut-segment');

    if (segmentElement) {
      const key = segmentElement.getAttribute('data-lexical-node-key');
      if (key && key !== lastSegmentRef.current) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        lastSegmentRef.current = key;

        timerRef.current = setTimeout(() => {
          editor.getEditorState().read(() => {
            const node = $getNodeByKey(key);
            if ($isPaperCutSegmentNode(node)) {
              const fileId = node.getFileId();
              const fileItem = files[fileId];

              let fileName = 'Unknown';
              let fileInfo = null;

              if (fileItem) {
                fileName = fileItem.name;
                try {
                  fileInfo = JSON.parse(fileItem.content);
                } catch (error) {
                  console.error('Error parsing file content:', error);
                }
              }

              const hoverData = {
                text: node.getTextContent(),
                startTime: node.getStartTime(),
                endTime: node.getEndTime(),
                segmentId: node.getSegmentId(),
                speaker: node.getSpeaker(),
                fileId: fileId,
                fileName: fileName,
                rect: segmentElement.getBoundingClientRect(),
              };

              setHoverData(hoverData);
            }
          });
        }, 500); // 500ms delay before showing hover card
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setHoverData(null);
      lastSegmentRef.current = null;
    }
  }, [editor, files]);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('mousemove', handleMouseMove);

      return () => {
        rootElement.removeEventListener('mousemove', handleMouseMove);
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [editor, handleMouseMove]);

  return hoverData
    ? createPortal(
        <SegmentHoverCard {...hoverData} />,
        document.body
      )
    : null;
}