import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  ElementNode,
  TextNode,
  LexicalNode,
  KEY_ENTER_COMMAND,
} from 'lexical';

import {
  $createPaperCutSegmentNode,
  $isPaperCutSegmentNode,
  PaperCutSegmentNode
} from '@/app/nodes/PaperCutSegmentNode';

import {
  $createPaperCutWordNode,
  $isPaperCutWordNode,
} from '@/app/nodes/PaperCutWordNode';

import { $createPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';

export function PaperCutEnterPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        
        if (!$isRangeSelection(selection)) {
          return false;
        }

        event?.preventDefault();

        try {
          editor.update(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) {
              return;
            }

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
              return;
            }

            const newSegment = $createPaperCutSegmentNode(
              segmentNode.getStartTime(),
              segmentNode.getEndTime(),
              segmentNode.getSegmentId(),
              segmentNode.getSpeaker(),
              segmentNode.getFileId(),
              true
            );

            const speakerNode = $createPaperCutSpeakerNode(segmentNode.getSpeaker());
            newSegment.append(speakerNode);

            const nodes = Array.from(segmentNode.getChildren());
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
                  segmentNode.getSegmentId(),
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

            segmentNode.insertAfter(newSegment);
            newSegment.selectStart();
          });
        } catch (error) {
          console.warn('Error handling Enter key:', error);
        }

        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );

    return () => {
      removeEnterListener();
    };
  }, [editor]);

  return null;
}