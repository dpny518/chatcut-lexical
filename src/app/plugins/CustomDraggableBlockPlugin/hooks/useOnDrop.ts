import { useCallback, useEffect } from 'react';
import { $getNodeByKey, COMMAND_PRIORITY_HIGH, DROP_COMMAND } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { draggableStore } from '../store';
import { DRAGGABLE_KEY } from '../constants';
import { $createPaperCutGroupNode } from '@/app/nodes/PaperCutGroupNode';
import { handlePaste } from '@/app/utils/editor-utils';

export const useOnDrop = () => {
   const [editor] = useLexicalComposerContext();

   const handleOnDrop = useCallback((dragEvent: DragEvent): boolean => {
      dragEvent.preventDefault();

      const lineElement = draggableStore.getState().line?.htmlElement;

      const closestToLineElementKey = lineElement?.getAttribute(DRAGGABLE_KEY);
      if (!closestToLineElementKey) {
         console.error('[ON DROP] no closestToLineElementKey');
         return false;
      }

      // Handle file drop
      if (dragEvent.dataTransfer?.types.includes('Files')) {
         if (dragEvent.dataTransfer?.items) {
            Array.from(dragEvent.dataTransfer.items).forEach((item) => {
               if (item.kind === 'file') {
                  const file = item.getAsFile();
                  if (file) {
                     const reader = new FileReader();
                     reader.onload = (e) => {
                        if (e.target) {
                           const text = e.target.result as string;
                           handlePaste(text, editor, {}, true);
                        } else {
                           console.error('FileReader event target is null');
                        }
                     };
                     reader.readAsText(file);
                  }
               }
            });
            return true;
         }
      }

      const draggableElement = draggableStore.getState().draggable?.htmlElement;

      const draggableKey = draggableElement?.getAttribute(DRAGGABLE_KEY);
      if (!draggableKey) {
         console.error('NO DRAGGABLE KEY');
         return false;
      }

      const lineLexicalNode = $getNodeByKey(closestToLineElementKey);

      const draggableLexicalNode = $getNodeByKey(draggableKey);
      if (!draggableLexicalNode) {
         console.error('NO DRAGGABLE ELEMENT FOUND');
         return false;
      }

      // Inserts a node after this LexicalNode (as the next sibling).
      lineLexicalNode?.insertAfter(draggableLexicalNode);

      return true;
   }, [editor]);

   useEffect(() => {
      editor.registerCommand(
         DROP_COMMAND,
         (event) => {
            return handleOnDrop(event);
         },
         COMMAND_PRIORITY_HIGH,
      );
   }, [editor, handleOnDrop]);

   return { handleOnDrop };
};
