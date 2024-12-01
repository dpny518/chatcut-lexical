import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, FC, useState, useEffect } from 'react';
import '@/styles/draggableBlock.css';

const styles = `
  .draggable-block-menu {
    /* Your styles here */
  }
  .draggable-block-target-line {
    /* Your styles here */
  }
`;

export const PaperCutDraggablePlugin: FC<{
  anchorElem?: HTMLElement;
}> = ({ anchorElem = document.body }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const isOnMenu = (element: HTMLElement): boolean => {
    return !!element.closest('.draggable-block-menu');
  };

  useEffect(() => {
    const editor = anchorElem.querySelector('[data-lexical-editor]');
    if (!editor) return;

    const handleDragStart = () => {
      setDragActive(true);
      if (targetLineRef.current) {
        targetLineRef.current.classList.add('visible');
      }
    };

    const handleDragEnd = () => {
      setDragActive(false);
      if (targetLineRef.current) {
        targetLineRef.current.classList.remove('visible');
      }
    };

    const handleDragOver = (event: DragEvent) => {
      if (!targetLineRef.current || !dragActive) return;

      const editorRect = editor.getBoundingClientRect();
      const mouseY = event.clientY;
      
      // Ensure the line stays within editor bounds
      const lineY = Math.max(
        editorRect.top,
        Math.min(mouseY, editorRect.bottom)
      );

      targetLineRef.current.style.top = `${lineY}px`;
      targetLineRef.current.style.left = `${editorRect.left}px`;
      targetLineRef.current.style.width = `${editorRect.width}px`;
    };

    editor.addEventListener('dragstart', handleDragStart as EventListener);
    editor.addEventListener('dragend', handleDragEnd as EventListener);
    editor.addEventListener('dragover', handleDragOver as EventListener);

    return () => {
      editor.removeEventListener('dragstart', handleDragStart as EventListener);
      editor.removeEventListener('dragend', handleDragEnd as EventListener);
      editor.removeEventListener('dragover', handleDragOver as EventListener);
    };
  }, [anchorElem, dragActive]);

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