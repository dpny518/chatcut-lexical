import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, useEffect } from 'react';
import { $getRoot, $isParagraphNode } from 'lexical';
import { $isPaperCutGroupNode } from '@/app/nodes/PaperCutGroupNode';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';
const STYLE_ID = 'papercut-draggable-styles';

const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.innerHTML = `
    .papercut-editor-container {
      position: relative !important;
    }

    .papercut-group-node {
      position: relative !important;
      margin: 8px 0 !important;
      padding-left: 32px !important;
      min-height: 24px !important;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME} {
      border-radius: 4px;
      padding: 2px 1px;
      cursor: grab;
      opacity: 1 !important;
      position: absolute !important;
      left: 0 !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 24px !important;
      height: 24px !important;
      background-color: #e2e8f0 !important;
      z-index: 10 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME}:hover {
      background-color: #cbd5e1 !important;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME}:active {
      cursor: grabbing !important;
      background-color: #94a3b8 !important;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME} .drag-handle-icon {
      width: 16px;
      height: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2px;
    }

    .${DRAGGABLE_BLOCK_MENU_CLASSNAME} .drag-handle-line {
      height: 2px;
      background-color: #475569;
      border-radius: 1px;
    }

    .draggable-block-target-line {
      pointer-events: none;
      background: #3b82f6;
      height: 4px;
      position: absolute;
      left: 0;
      right: 0;
      opacity: 0;
      transform: translateY(-50%);
      transition: opacity 0.2s ease;
    }
  `;
  document.head.appendChild(style);
};

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

const DragHandleIcon = () => (
  <div className="drag-handle-icon">
    <div className="drag-handle-line" />
    <div className="drag-handle-line" />
    <div className="drag-handle-line" />
  </div>
);

export function PaperCutDraggablePlugin({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectStyles();
  
    editor.update(() => {
      const root = $getRoot();
      const children = root.getChildren();
      console.log('Root children:', children); // Debug log
      
      children.forEach(node => {
        console.log('Node type:', node.getType()); // Debug log
        if ($isPaperCutGroupNode(node)) {
          console.log('Found group node'); // Debug log
          const element = editor.getElementByKey(node.getKey());
          if (element) {
            element.setAttribute('draggable', 'true');
            element.setAttribute('data-lexical-drag-target', 'true');
          }
        }
      });
    });
    // Observer to handle dynamically added content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node instanceof HTMLElement && node.classList.contains('papercut-group-node')) {
              node.setAttribute('draggable', 'true');
              node.setAttribute('data-lexical-drag-target', 'true');
            }
          });
        }
      });
    });

    observer.observe(anchorElem, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [editor, anchorElem]);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div 
          ref={menuRef} 
          className={DRAGGABLE_BLOCK_MENU_CLASSNAME}
          draggable={true}
        >
          <DragHandleIcon />
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
    />
  );
}