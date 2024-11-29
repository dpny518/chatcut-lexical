import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  $isTextNode,
  $isParagraphNode,
} from 'lexical';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
import { $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';

export function EditRestrictionPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          // Allow operations on segment nodes
          if (selection.getNodes().some($isPaperCutSegmentNode)) {
            return false;
          }

          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            // If any selected node is a word node, select and delete the entire word(s)
            if (nodes.some($isPaperCutWordNode)) {
              editor.update(() => {
                nodes.forEach(node => {
                  if ($isPaperCutWordNode(node)) {
                    node.selectNext();
                    node.remove();
                  }
                });
              });
              return true;
            }
            return false;
          }

          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();
          
          if ($isPaperCutWordNode(anchorNode)) {
            // For backspace, always delete the entire word
            editor.update(() => {
              anchorNode.selectNext();
              anchorNode.remove();
            });
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          // Allow operations on segment nodes
          if (selection.getNodes().some($isPaperCutSegmentNode)) {
            return false;
          }

          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            // If any selected node is a word node, select and delete the entire word(s)
            if (nodes.some($isPaperCutWordNode)) {
              editor.update(() => {
                nodes.forEach(node => {
                  if ($isPaperCutWordNode(node)) {
                    node.selectNext();
                    node.remove();
                  }
                });
              });
              return true;
            }
            return false;
          }

          const focus = selection.focus;
          const focusNode = focus.getNode();
          
          if ($isPaperCutWordNode(focusNode)) {
            // For delete key, always delete the entire word
            editor.update(() => {
              focusNode.selectNext();
              focusNode.remove();
            });
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      editor.registerCommand(
        DELETE_CHARACTER_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            // If any selected node is a word node, prevent character deletion
            if (nodes.some($isPaperCutWordNode)) {
              return true;
            }
          }

          const node = selection.anchor.getNode();
          return $isPaperCutWordNode(node);
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      editor.registerCommand(
        DELETE_WORD_COMMAND,
        (payload) => {
          return false; // Always allow word-level deletions
        },
        COMMAND_PRIORITY_CRITICAL,
      )
    );
  }, [editor]);

  return null;
}