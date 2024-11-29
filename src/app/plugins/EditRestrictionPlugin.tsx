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
        KEY_ENTER_COMMAND,
        (event: KeyboardEvent | null) => {
          const selection = $getSelection();
          
          if (!$isRangeSelection(selection)) {
            return false;
          }

          event?.preventDefault();

          const anchorNode = selection.anchor.getNode();
          let currentNode: ElementNode | TextNode = anchorNode;
          let segmentNode: PaperCutSegmentNode | null = null;
          
          while (currentNode !== null) {
            if ($isPaperCutSegmentNode(currentNode)) {
              segmentNode = currentNode;
              break;
            }
            const parent = currentNode.getParent();
            if (parent === null) break;
            currentNode = parent;
          }

          if (!segmentNode) {
            return false;
          }

          try {
            editor.update(() => {
              const newSegment = $createPaperCutSegmentNode(
                segmentNode!.getStartTime(),
                segmentNode!.getEndTime(),
                segmentNode!.getSegmentId(),
                segmentNode!.getSpeaker(),
                segmentNode!.getFileId(),
                true
              );

              const speakerNode = $createPaperCutSpeakerNode(segmentNode!.getSpeaker());
              newSegment.append(speakerNode);

              const nodes = segmentNode!.getChildren();
              let cursorIndex = nodes.findIndex((node: LexicalNode) => node === anchorNode);
              
              if (cursorIndex === -1) {
                for (let i = 0; i < nodes.length; i++) {
                  const node = nodes[i];
                  let current: ElementNode | TextNode = anchorNode;
                  while (current !== null) {
                    if (current === node) {
                      cursorIndex = i;
                      break;
                    }
                    const parent = current.getParent();
                    if (parent === null) break;
                    current = parent;
                  }
                  if (cursorIndex !== -1) break;
                }
              }

              if (cursorIndex === -1) return;

              let foundWordNode = false;

              for (let i = cursorIndex; i < nodes.length; i++) {
                const node = nodes[i];
                if ($isPaperCutWordNode(node)) {
                  foundWordNode = true;
                  const clonedWord = $createPaperCutWordNode(
                    node.getTextContent(),
                    node.getStartTime(),
                    node.getEndTime(),
                    segmentNode!.getSegmentId(),
                    node.getSpeaker(),
                    node.getFileId(),
                    node.getWordIndex()
                  );
                  newSegment.append(clonedWord);
                  node.remove();
                } else if ($isTextNode(node) && foundWordNode) {
                  const textContent = node.getTextContent();
                  const newTextNode = $createTextNode(textContent);
                  newSegment.append(newTextNode);
                  node.remove();
                }
              }

              segmentNode!.insertAfter(newSegment);
              newSegment.selectStart();
            });
          } catch (error) {
            console.warn('Error handling Enter key:', error);
          }

          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

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