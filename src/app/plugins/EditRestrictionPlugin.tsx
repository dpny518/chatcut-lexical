// src/app/plugins/EditRestrictionPlugin.tsx

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_CRITICAL,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  COMMAND_PRIORITY_HIGH,
  createCommand,
  LexicalCommand,
  PASTE_COMMAND,
} from 'lexical';

const KEY_DOWN_COMMAND: LexicalCommand<KeyboardEvent> = createCommand('KEY_DOWN_COMMAND');

export function EditRestrictionPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const preventDefaultKeyCommands = [
      KEY_BACKSPACE_COMMAND,
      KEY_DELETE_COMMAND,
      KEY_ENTER_COMMAND,
    ];

    // Prevent default key commands
    const removeKeyCommandListeners = preventDefaultKeyCommands.map(command =>
      editor.registerCommand(
        command,
        (event) => {
          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );

    // Register the custom keydown command
    const removeKeyDownCommand = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        // Allow copy (Ctrl+C) and paste (Ctrl+V)
        if ((event.ctrlKey || event.metaKey) && (event.key === 'c' || event.key === 'v')) {
          return false;
        }
        // Prevent all other key presses
        event.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Handle keydown events
    const removeKeyDownListener = editor.registerRootListener(
      (rootElement: HTMLElement | null) => {
        if (rootElement !== null) {
          const handler = (event: KeyboardEvent) => {
            editor.dispatchCommand(KEY_DOWN_COMMAND, event);
          };
          rootElement.addEventListener('keydown', handler);
          return () => {
            rootElement.removeEventListener('keydown', handler);
          };
        }
        return () => {};
      }
    );

    // Allow paste command to pass through
    const removePasteListener = editor.registerCommand(
      PASTE_COMMAND,
      () => {
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Cleanup
    return () => {
      removeKeyCommandListeners.forEach(removeListener => removeListener());
      removeKeyDownCommand();
      removeKeyDownListener();
      removePasteListener();
    };
  }, [editor]);

  return null;
}