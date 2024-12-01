import { DraggableBlockPlugin_EXPERIMENTAL } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useRef, useEffect } from 'react';

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu';

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`);
}

interface PaperCutDraggablePluginProps {
  anchorElem?: HTMLElement;
}

export const PaperCutDraggablePlugin = ({
  anchorElem = document.body,
}: PaperCutDraggablePluginProps): JSX.Element => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('PaperCutDraggablePlugin mounted');
    if (menuRef.current) {
      // Reset any transform that might be hiding the menu
      menuRef.current.style.transform = '';
    }
  }, []);

  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      anchorElem={anchorElem}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className={DRAGGABLE_BLOCK_MENU_CLASSNAME}>
          <div className="icon">
            <span />
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