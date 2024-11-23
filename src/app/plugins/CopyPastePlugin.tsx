// src/app/plugins/CopyPastePlugin.tsx

import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $createTextNode, 
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  COMMAND_PRIORITY_LOW, 
  COPY_COMMAND,
  PASTE_COMMAND, 
  TextNode,
  LexicalCommand,
  $createRangeSelection,
  $setSelection,
  RangeSelection
} from 'lexical';
import { PaperCutWordNode, $createPaperCutWordNode, $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { PaperCutSpeakerNode, $createPaperCutSpeakerNode, $isPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { PaperCutSegmentNode, $createPaperCutSegmentNode, $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';

type WordData = [string, string, string, string, string, string, string];

export function CopyPastePlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    // Copy handler
    const copyHandler = editor.registerCommand<ClipboardEvent>(
      COPY_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const nodes = selection.getNodes();
        const copiedData = nodes.map(node => {
          if ($isPaperCutWordNode(node)) {
            return `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
          } else if ($isPaperCutSpeakerNode(node)) {
            return `\n${node.getSpeaker()}:\n`;
          } else {
            return node.getTextContent();
          }
        }).join(' ');

        event.clipboardData?.setData('text/plain', copiedData);
        event.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    // Paste handler
    const pasteHandler = editor.registerCommand(
      PASTE_COMMAND,
      (payload) => {
        const clipboardData = payload instanceof ClipboardEvent ? payload.clipboardData : null;
        const pastedText = clipboardData ? clipboardData.getData('text/plain') : '';

        if (!pastedText) return false;

        handleContent(pastedText);
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    // Drag start handler
    const dragStartHandler = (event: DragEvent) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const nodes = selection.getNodes();
      const dragData = nodes.map(node => {
        if ($isPaperCutWordNode(node)) {
          return `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
        } else {
          return node.getTextContent();
        }
      }).join(' ');

      event.dataTransfer?.setData('text/plain', dragData);
    };

    // Drop handler
const dropHandler = (event: DragEvent) => {
  event.preventDefault();
  const droppedText = event.dataTransfer?.getData('text/plain');
  if (droppedText) {
    const doc = event.target instanceof Node ? event.target.ownerDocument : document;
    if (doc) {
      let caretPosition: any = null;
      if ('caretPositionFromPoint' in doc) {
        caretPosition = (doc as any).caretPositionFromPoint(event.clientX, event.clientY);
      } else if ('caretRangeFromPoint' in doc) {
        caretPosition = (doc as any).caretRangeFromPoint(event.clientX, event.clientY);
      }

      if (caretPosition) {
        const range = doc.createRange();
        if ('offsetNode' in caretPosition && 'offset' in caretPosition) {
          range.setStart(caretPosition.offsetNode, caretPosition.offset);
        } else if (caretPosition instanceof Range) {
          range.setStart(caretPosition.startContainer, caretPosition.startOffset);
        }
        range.collapse(true);
        
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        editor.update(() => {
          handleContent(droppedText);
        });
      } else {
        // Fallback if caretPositionFromPoint and caretRangeFromPoint are not supported
        editor.update(() => {
          handleContent(droppedText);
        });
      }
    } else {
      // Fallback if we couldn't get a valid document
      editor.update(() => {
        handleContent(droppedText);
      });
    }
  }
};

    // Function to handle pasted or dropped content
    const handleContent = (content: string) => {
      const words = content.split(/\s+/).filter(word => word.trim() !== '');

      const isValidContent = words.every(word => {
        const parts = word.split('|');
        return parts.length === 7 && 
               !isNaN(parseFloat(parts[1])) && 
               !isNaN(parseFloat(parts[2])) &&
               !isNaN(parseInt(parts[6]));
      });

      if (!isValidContent) {
        console.warn('Invalid content. Only content with metadata is allowed.');
        return;
      }

      let selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        const root = $getRoot();
        const lastChild = root.getLastChild();
        selection = $createRangeSelection();
        if (lastChild) {
          (selection as RangeSelection).focus.set(lastChild.getKey(), lastChild.getTextContent().length, 'text');
        } else {
          (selection as RangeSelection).focus.set(root.getKey(), 0, 'element');
        }
        $setSelection(selection);
      }

      let currentSpeaker = '';
      let paragraphNode = $createParagraphNode();

      words.forEach((word: string) => {
        const parts = word.split('|');
        if (parts.length === 7) {
          const [text, startTime, endTime, segmentId, speaker, fileId, wordIndex] = parts as WordData;

          if (speaker !== currentSpeaker) {
            currentSpeaker = speaker;
            
            if (paragraphNode.getTextContent()) {
              (selection as RangeSelection).insertNodes([paragraphNode]);
              paragraphNode = $createParagraphNode();
            }

            // Add speaker name as a bold text node
            const speakerNameNode = $createTextNode(speaker + ': ');
            speakerNameNode.toggleFormat('bold');
            paragraphNode.append(speakerNameNode);
          }

          const wordNode = $createPaperCutWordNode(
            text,
            parseFloat(startTime) || 0,
            parseFloat(endTime) || 0,
            segmentId,
            speaker,
            fileId,
            parseInt(wordIndex) || 0
          );
          paragraphNode.append(wordNode);
          paragraphNode.append($createTextNode(' ')); // Add space between words
        } else {
          // If it's not in our special format, just insert it as plain text
          paragraphNode.append($createTextNode(word + ' '));
        }
      });

      // Insert the last paragraph if it's not empty
      if (paragraphNode.getTextContent()) {
        (selection as RangeSelection).insertNodes([paragraphNode]);
      }

      // Move selection to the end of the inserted content
      const lastNode = paragraphNode.getLastDescendant();
      if (lastNode instanceof TextNode || lastNode instanceof PaperCutWordNode) {
        (selection as RangeSelection).setTextNodeRange(lastNode, lastNode.getTextContent().length, lastNode, lastNode.getTextContent().length);
      }
    };

    // Add event listeners for drag and drop
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('dragstart', dragStartHandler);
      rootElement.addEventListener('dragover', (e) => e.preventDefault());
      rootElement.addEventListener('drop', dropHandler);
    }

    // Clean up
    return () => {
      copyHandler();
      pasteHandler();
      if (rootElement) {
        rootElement.removeEventListener('dragstart', dragStartHandler);
        rootElement.removeEventListener('dragover', (e) => e.preventDefault());
        rootElement.removeEventListener('drop', dropHandler);
      }
    };
  }, [editor]);

  return null;
}