import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, useEffect } from 'react';
import { $getRoot, $getNodeByKey } from 'lexical';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

// Create style element with our CSS
const injectStyles = () => {
  const styleId = 'papercut-draggable-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.innerHTML = `
    .PaperCutSegmentNode {
      position: relative !important;
      padding-left: 32px !important;
      min-height: 24px;
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
      background-color: #f5f5f5 !important;
      z-index: 10;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
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

  useEffect(() => {
    injectStyles();

    // Verify segments
    editor.getEditorState().read(() => {
      const root = $getRoot();
      root.getChildren().forEach(node => {
        if ($isPaperCutSegmentNode(node)) {
          console.log('Found PaperCutSegmentNode:', node);
        }
      });
    });

    // Debug element positions
    if (menuRef.current && anchorElem) {
      console.log('Menu position:', {
        menuRect: menuRef.current.getBoundingClientRect(),
        anchorRect: anchorElem.getBoundingClientRect(),
        styles: window.getComputedStyle(menuRef.current)
      });
    }
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
          style={{
            opacity: 1,
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            backgroundColor: '#f5f5f5',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
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