// src/app/plugins/WordHoverPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WordHoverCard, WordHoverCardProps } from '@/app/components/WordHoverCard';
import { PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { useFileSystem } from '@/app/contexts/FileSystemContext';

export function WordHoverPlugin() {
  const [editor] = useLexicalComposerContext();
  const [hoverData, setHoverData] = useState<WordHoverCardProps | null>(null);
  const { files } = useFileSystem();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastWordRef = useRef<string | null>(null);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('papercut-word')) {
      const key = target.getAttribute('data-lexical-node-key');
      if (key) {
        // Clear existing timer if the word has changed
        if (lastWordRef.current !== key) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }
          lastWordRef.current = key;

          // Set new timer
          timerRef.current = setTimeout(() => {
            editor.getEditorState().read(() => {
              const lexicalNode = $getNodeByKey(key);
              if (lexicalNode instanceof PaperCutWordNode) {
                const fileId = lexicalNode.getFileId();
                const fileItem = files[fileId];
                console.log('File item:', fileItem); // Debug log

                let fileName = 'Unknown';
                let fileInfo = null;

                if (fileItem) {
                  fileName = fileItem.name; // Use the name directly from the file item
                  try {
                    fileInfo = JSON.parse(fileItem.content);
                    console.log('Parsed file info:', fileInfo); // Debug log
                  } catch (error) {
                    console.error('Error parsing file content:', error);
                  }
                }

                const hoverData = {
                  word: lexicalNode.getTextContent(),
                  startTime: lexicalNode.getStartTime(),
                  endTime: lexicalNode.getEndTime(),
                  segmentId: lexicalNode.getSegmentId(),
                  speaker: lexicalNode.getSpeaker(),
                  fileId: fileId,
                  fileName: fileName,
                  wordIndex: lexicalNode.getWordIndex(),
                  rect: target.getBoundingClientRect(),
                };

                console.log('Hover data:', hoverData); // Debug log
                setHoverData(hoverData);
              }
            });
          }, 1000); // 2000 milliseconds = 2 seconds
        }
      }
    } else {
      // Clear timer and reset hover data when moving away from a word
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setHoverData(null);
      lastWordRef.current = null;
    }
  }, [editor, files]);

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    editorElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [editor, handleMouseMove]);

  return hoverData
    ? createPortal(
        <WordHoverCard {...hoverData} />,
        document.body
      )
    : null;
}