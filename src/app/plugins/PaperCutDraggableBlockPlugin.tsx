import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, useEffect, useState } from 'react';
import { $getRoot, $isElementNode } from 'lexical';
import React from 'react';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

const injectStyles = () => {
  const styleId = 'papercut-draggable-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .editor-paragraph {
      position: relative !important;
    }

    [data-lexical-editor] div[draggable="true"] {
      position: relative;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME} {
      border-radius: 4px;
      padding: 2px 1px;
      cursor: grab;
      opacity: 1 !important;
      position: absolute !important;
      left: 8px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 24px !important;
      height: 24px !important;
      background-color: #f5f5f5 !important;
      z-index: 10;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME}::before,
    .${DRAGGABLE_BLOCK_MENU_CLASSNAME}::after {
      content: '';
      position: absolute;
      left: 6px;
      right: 6px;
      height: 2px;
      background: #666;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME}::before {
      top: 8px;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME}::after {
      bottom: 8px;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME} .icon {
      width: 12px;
      height: 2px;
      background: #666;
    }

    .draggable-block-target-line {
      pointer-events: none;
      background: #0074d9;
      height: 3px;
      position: absolute;
      left: 0;
      right: 0;
      opacity: 0;
      transform: translateY(-50%);
      transition: opacity 0.2s ease;
      z-index: 9;
    }
  `;
  document.head.appendChild(style);
};

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export function PaperCutDraggablePlugin({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    injectStyles();

    // Debug
    console.log('Editor container:', anchorElem);
    const paragraphs = anchorElem.querySelectorAll('.editor-paragraph');
    console.log('Found paragraphs:', paragraphs.length);
    paragraphs.forEach((p, i) => {
      console.log(`Paragraph ${i}:`, p.textContent);
      const isSpeaker = p.querySelector('.editor-text-bold');
      if (isSpeaker) {
        console.log('Is speaker paragraph:', isSpeaker.textContent);
        // Make sure it's draggable
        p.setAttribute('draggable', 'true');
        p.setAttribute('data-drag-handle', 'true');
      }
    });

    editor.update(() => {
      const root = $getRoot();
      
      // Find and prepare all speaker sections
      editor.getEditorState().read(() => {
        const nodes = root.getChildren();
        let currentSpeakerGroup: HTMLElement | null = null;

        nodes.forEach((node) => {
          const dom = editor.getElementByKey(node.getKey());
          if (!dom) return;

          // Check if this is a speaker header
          if (dom.querySelector('.editor-text-bold')) {
            // Create a new speaker group
            const group = document.createElement('div');
            group.className = 'papercut-speaker-group';
            group.setAttribute('data-draggable', 'true');
            dom.parentNode?.insertBefore(group, dom);
            group.appendChild(dom);
            currentSpeakerGroup = group;
          } else if (currentSpeakerGroup && dom.classList.contains('segment')) {
            // Add segments to current speaker group
            currentSpeakerGroup.appendChild(dom);
          } else if (dom.tagName === 'P') {
            // Reset speaker group at paragraph breaks
            currentSpeakerGroup = null;
          }
        });
      });
    });
  }, [editor, anchorElem]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>) => {
    console.log('Drag started:', event);
    const target = event.target as HTMLElement;
    const paragraph = target.closest('.editor-paragraph');
    if (paragraph) {
      console.log('Found draggable paragraph:', paragraph);
    }
  };

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div 
          ref={menuRef} 
          className={DRAGGABLE_BLOCK_MENU_CLASSNAME}
          draggable={isHovering}
          onDragStart={handleDragStart}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="icon" />
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
    />
  );
}