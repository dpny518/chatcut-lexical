// CursorPersistencePlugin.tsx
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection,
  $setSelection,
  RangeSelection,
  NodeSelection,
  BaseSelection
} from 'lexical';

export function CursorPersistencePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    let lastSelection: BaseSelection | null = null;

    const updateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (selection) {
          lastSelection = selection.clone();
        }
      });
    });

    const focusListener = () => {
      editor.update(() => {
        if (lastSelection) {
          $setSelection(lastSelection);
        }
      });
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('focus', focusListener);
    }

    return () => {
      updateListener();
      if (rootElement) {
        rootElement.removeEventListener('focus', focusListener);
      }
    };
  }, [editor]);

  return null;
}