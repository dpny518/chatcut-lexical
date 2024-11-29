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
          // Allow deletion of entire selections
          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            const allWordNodesOrParagraphs = nodes.every(
              node => $isPaperCutWordNode(node) || $isParagraphNode(node) || $isTextNode(node)
            );
            // Only allow if all nodes are word nodes or paragraphs
            return !allWordNodesOrParagraphs;
          }

          // Get the node before the selection
          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();
          
          if ($isPaperCutWordNode(anchorNode)) {
            // If we're at the start of a word node, allow deletion to remove the whole word
            if (anchor.offset === 0) {
              return false;
            }
            // Otherwise prevent character deletion within the word
            return true;
          }

          // Allow deletion if we're not in a word node
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
          // Allow deletion of entire selections
          if (!selection.isCollapsed()) {
            const nodes = selection.getNodes();
            const allWordNodesOrParagraphs = nodes.every(
              node => $isPaperCutWordNode(node) || $isParagraphNode(node) || $isTextNode(node)
            );
            // Only allow if all nodes are word nodes or paragraphs
            return !allWordNodesOrParagraphs;
          }

          // Get the node at the selection
          const focus = selection.focus;
          const focusNode = focus.getNode();
          
          if ($isPaperCutWordNode(focusNode)) {
            // If we're at the end of a word node, allow deletion to remove the whole word
            if (focus.offset === focusNode.getTextContentSize()) {
              return false;
            }
            // Otherwise prevent character deletion within the word
            return true;
          }

          // Allow deletion if we're not in a word node
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
            return nodes.some($isPaperCutWordNode);
          }

          const node = selection.anchor.getNode();
          return $isPaperCutWordNode(node);
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      editor.registerCommand(
        DELETE_WORD_COMMAND,
        (payload) => {
          // Always allow word-level deletions
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      )
    );
  }, [editor]);

  return null;
}