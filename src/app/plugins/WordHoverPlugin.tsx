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
  
  // Refs for managing hover behavior
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentWordRef = useRef<string | null>(null);
  const isMouseOverCardRef = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const hideHoverCard = useCallback(() => {
    if (!isMouseOverCardRef.current) {
      setHoverData(null);
      currentWordRef.current = null;
    }
  }, []);

  const handleWordData = useCallback((key: string, target: HTMLElement) => {
    editor.getEditorState().read(() => {
      const lexicalNode = $getNodeByKey(key);
      if (lexicalNode instanceof PaperCutWordNode) {
        const fileId = lexicalNode.getFileId();
        const fileItem = files[fileId];
        
        let fileName = fileItem?.name ?? 'Unknown';
        let fileInfo = null;

        if (fileItem?.content) {
          try {
            fileInfo = JSON.parse(fileItem.content);
          } catch (error) {
            console.warn('Error parsing file content:', error);
          }
        }

        const newHoverData = {
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

        setHoverData(newHoverData);
      }
    });
  }, [editor, files]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    if (target.classList.contains('papercut-word')) {
      const key = target.getAttribute('data-lexical-node-key');
      
      if (key && key !== currentWordRef.current) {
        clearHoverTimer();
        currentWordRef.current = key;

        hoverTimerRef.current = setTimeout(() => {
          handleWordData(key, target);
        }, 500); // Reduced delay to 500ms for better responsiveness
      }
    } else if (!isMouseOverCardRef.current) {
      clearHoverTimer();
      setTimeout(hideHoverCard, 100); // Small delay to prevent flickering
    }
  }, [clearHoverTimer, hideHoverCard, handleWordData]);

  const handleCardMouseEnter = useCallback(() => {
    isMouseOverCardRef.current = true;
  }, []);

  const handleCardMouseLeave = useCallback(() => {
    isMouseOverCardRef.current = false;
    hideHoverCard();
  }, [hideHoverCard]);

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    editorElement.addEventListener('mousemove', handleMouseMove);

    return () => {
      editorElement.removeEventListener('mousemove', handleMouseMove);
      clearHoverTimer();
    };
  }, [editor, handleMouseMove, clearHoverTimer]);

  return hoverData
    ? createPortal(
        <div
          ref={cardRef}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        >
          <WordHoverCard {...hoverData} />
        </div>,
        document.body
      )
    : null;
}