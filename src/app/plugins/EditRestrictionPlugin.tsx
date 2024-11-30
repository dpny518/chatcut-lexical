import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  $isTextNode,
  $isParagraphNode,
  $createTextNode,
  $getRoot,
  ElementNode,
  TextNode,
  LexicalNode,
} from 'lexical';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
import { $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { 
  $isPaperCutSegmentNode, 
  $createPaperCutSegmentNode, 
  PaperCutSegmentNode 
} from '@/app/nodes/PaperCutSegmentNode';
import { $createPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $createPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';

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

          if (selection.getNodes().some($isPaperCutSegmentNode)) {
            return false;
          }

          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
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

      // Delete handler (from second code)
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          if (selection.getNodes().some($isPaperCutSegmentNode)) {
            return false;
          }

          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
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

      // Character deletion handler (from second code)
      editor.registerCommand(
        DELETE_CHARACTER_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            if (nodes.some($isPaperCutWordNode)) {
              return true;
            }
          }

          const node = selection.anchor.getNode();
          return $isPaperCutWordNode(node);
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      // Word deletion handler (from second code)
      editor.registerCommand(
        DELETE_WORD_COMMAND,
        (payload) => {
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      )
    );
  }, [editor]);

  return null;
}