import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  CLEAR_EDITOR_COMMAND, 
  COMMAND_PRIORITY_EDITOR,
  $getRoot,
  $createParagraphNode,
  createCommand
} from 'lexical';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';

// Create a custom command for clearing
export const PAPERCUT_CLEAR_COMMAND = createCommand('PAPERCUT_CLEAR_COMMAND');

export function ClearEditorPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLEAR_EDITOR_COMMAND,
        () => {
          // Forward to our custom command
          editor.dispatchCommand(PAPERCUT_CLEAR_COMMAND, undefined);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        PAPERCUT_CLEAR_COMMAND,
        () => {
          editor.update(() => {
            // Store the current state implicitly for undo
            const root = $getRoot();
            // Clear all children
            root.getChildren().forEach(child => child.remove());
            // Add an empty paragraph
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  return null;
}