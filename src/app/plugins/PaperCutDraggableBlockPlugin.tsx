import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useRef, useEffect } from 'react';
import '@/styles/draggableBlock.css';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

export const PaperCutDraggablePlugin = ({
  anchorElem = document.body,
}: {
  anchorElem?: HTMLElement;
}): JSX.Element => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('PaperCutDraggablePlugin mounted');
    console.log('anchorElem:', anchorElem);
    console.log('menuRef current:', menuRef.current);
  }, [anchorElem]);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div 
          ref={menuRef} 
          className={DRAGGABLE_BLOCK_MENU_CLASSNAME}
          style={{ backgroundColor: 'rgba(0,0,0,0.05)' }} // Debug styling
        >
          <div className="icon">
            <span></span>
          </div>
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
    />
  );
};