import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, FC, useState, useEffect } from 'react';
import { $getNodeByKey, $getRoot, COMMAND_PRIORITY_HIGH, DRAGOVER_COMMAND, DROP_COMMAND } from 'lexical';
import { $isPaperCutSegmentNode, PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { $isPaperCutGroupNode } from '@/app/nodes/PaperCutGroupNode';
import { DragEventHandler } from 'react';
import '@/styles/draggableBlock.css'

export const PaperCutDraggablePlugin: FC<{
  anchorElem?: HTMLElement;
}> = ({ anchorElem = document.body }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('DraggableBlockPlugin mounted');
    console.log('menuRef current:', menuRef.current);
    console.log('targetLineRef current:', targetLineRef.current);
  }, []);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className="draggable-block-menu">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
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
      isOnMenu={(element: HTMLElement) => {
        const isMenu = !!element.closest('.draggable-block-menu');
        console.log('isOnMenu check:', isMenu, 'for element:', element);
        return isMenu;
      }}
    />
  );
};