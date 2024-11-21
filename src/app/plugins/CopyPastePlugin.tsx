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
  PasteCommandType,
  ElementNode,
  TextNode
} from 'lexical';
import { PaperCutWordNode, $createPaperCutWordNode, $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { PaperCutSpeakerNode, $createPaperCutSpeakerNode, $isPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { PaperCutSegmentNode, $createPaperCutSegmentNode, $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';

type WordData = [string, string, string, string, string, string, string];

export function CopyPastePlugin() {
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    // Copy handler
    const copyHandler = editor.registerCommand(
      COPY_COMMAND,
      (event: ClipboardEvent) => {
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
   const pasteHandler = editor.registerCommand<PasteCommandType>(
    PASTE_COMMAND,
    (event) => {
      const clipboardData = event instanceof ClipboardEvent ? event.clipboardData : null;
      const pastedText = clipboardData ? clipboardData.getData('text/plain') : '';

      if (!pastedText) return false;

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const words = pastedText.split(' ');
        let currentSpeaker = '';
        let speakerNode: PaperCutSpeakerNode | null = null;
        let paragraphNode: ElementNode | null = null;

        words.forEach((word) => {
          const parts = word.split('|');
          if (parts.length === 7) {
            const [text, startTime, endTime, segmentId, speaker, fileId, wordIndex] = parts as WordData;

            if (speaker !== currentSpeaker) {
              currentSpeaker = speaker;
              
              // Create a new paragraph for the new speaker
              paragraphNode = $createParagraphNode();
              selection.insertNodes([paragraphNode]);

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
            paragraphNode?.append(wordNode);
            paragraphNode?.append($createTextNode(' ')); // Add space between words
          } else {
            // If it's not in our special format, just insert it as plain text
            selection.insertText(word + ' ');
          }
        });

        // Move selection to the end of the pasted content
        const nodes = selection.getNodes();
        const lastNode = nodes[nodes.length - 1];
        if (lastNode) {
          if (lastNode instanceof TextNode || lastNode instanceof PaperCutWordNode) {
            selection.setTextNodeRange(lastNode, lastNode.getTextContent().length, lastNode, lastNode.getTextContent().length);
          } else if (lastNode instanceof ElementNode) {
            const lastChild = lastNode.getLastDescendant();
            if (lastChild instanceof TextNode || lastChild instanceof PaperCutWordNode) {
              selection.setTextNodeRange(lastChild, lastChild.getTextContent().length, lastChild, lastChild.getTextContent().length);
            }
          }
        }
      });

      return true;
    },
    COMMAND_PRIORITY_LOW
  );

  // Clean up
  return () => {
    pasteHandler();
  };
}, [editor]);

return null;
}