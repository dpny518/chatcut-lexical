import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, FC, useState, useEffect } from 'react';
import '@/app/plugins/draggableBlock.css';

export const PaperCutDraggablePlugin: FC<{
  anchorElem?: HTMLElement;
}> = ({ anchorElem = document.body }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  const isOnMenu = (element: HTMLElement): boolean => {
    return !!element.closest('.draggable-block-menu');
  };

  const handleDragOver = (event: Event) => {
    if (!targetLineRef.current) return;
    
    const dragEvent = event as DragEvent; // Type assertion
    const editorElement = anchorElem.querySelector('[data-lexical-editor]');
    if (!editorElement) return;

    const editorRect = editorElement.getBoundingClientRect();
    
    // Ensure the line stays within the editor bounds
    targetLineRef.current.style.left = `${editorRect.left}px`;
    targetLineRef.current.style.width = `${editorRect.width}px`;
    targetLineRef.current.style.top = `${dragEvent.clientY}px`;
  };

  useEffect(() => {
    const editor = anchorElem.querySelector('[data-lexical-editor]');
    if (editor) {
      editor.addEventListener('dragover', handleDragOver);
      return () => {
        editor.removeEventListener('dragover', handleDragOver);
      };
    }
  }, [anchorElem]);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className="draggable-block-menu">
          <svg
            className="icon"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <circle cx="4" cy="4" r="1.5" />
            <circle cx="12" cy="4" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="12" cy="8" r="1.5" />
            <circle cx="4" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
          </svg>
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
    />
  );
};