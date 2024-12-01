import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getSelection, BLUR_COMMAND, FOCUS_COMMAND, COMMAND_PRIORITY_LOW, TextNode } from 'lexical';
import { $isRangeSelection, $isTextNode } from 'lexical';

function CursorVisibilityPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isFocused, setIsFocused] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const CURSOR_INDICATOR = '▎';

  useEffect(() => {
    const removeFocusListener = editor.registerCommand(
      FOCUS_COMMAND,
      () => {
        setIsFocused(true);
        setShowIndicator(false);
        // Clean up indicator on focus
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = selection.focus.getNode();
            const textContent = node.getTextContent();
            if (textContent.includes(CURSOR_INDICATOR)) {
              if ($isTextNode(node)) {
                node.setTextContent(textContent.replace(CURSOR_INDICATOR, ''));
              }
            }
          }
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeBlurListener = editor.registerCommand(
      BLUR_COMMAND,
      () => {
        setIsFocused(false);
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            setShowIndicator(true);
          }
        });
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const removeUpdateListener = editor.registerUpdateListener(() => {
      if (!isFocused) {
        editor.getEditorState().read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            setShowIndicator(true);
          }
        });
      }
    });

    return () => {
      removeFocusListener();
      removeBlurListener();
      removeUpdateListener();
    };
  }, [editor, isFocused]);

  useEffect(() => {
    if (!showIndicator || isFocused) return;

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = selection.focus.getNode();
        const textContent = node.getTextContent();
        
        // Remove any existing indicators first
        const cleanContent = textContent.replace(CURSOR_INDICATOR, '');
        const offset = selection.focus.offset;
        
        // Insert the indicator at cursor position
        const newContent = cleanContent.slice(0, offset) + 
                         CURSOR_INDICATOR + 
                         cleanContent.slice(offset);
        
        if ($isTextNode(node)) {
          node.setTextContent(newContent);
        }
        selection.focus.offset = offset;
      }
    });

    return () => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const node = selection.focus.getNode();
          const textContent = node.getTextContent();
          if ($isTextNode(node)) {
            node.setTextContent(textContent.replace(CURSOR_INDICATOR, ''));
          }
        }
      });
    };
  }, [showIndicator, isFocused, editor]);

  return null;
}

export default CursorVisibilityPlugin;