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
  LexicalCommand
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

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          selection.insertText(''); // Clear any selected text

          const words = pastedText.split(' ');
          let currentSpeaker = '';
          let paragraphNode = $createParagraphNode();

          words.forEach((word: string) => {
            const parts = word.split('|');
            if (parts.length === 7) {
              const [text, startTime, endTime, segmentId, speaker, fileId, wordIndex] = parts as WordData;

              if (speaker !== currentSpeaker) {
                currentSpeaker = speaker;
                
                if (paragraphNode.getTextContent()) {
                  selection.insertNodes([paragraphNode]);
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
            selection.insertNodes([paragraphNode]);
          }

          // Move selection to the end of the pasted content
          const lastNode = paragraphNode.getLastDescendant();
          if (lastNode instanceof TextNode || lastNode instanceof PaperCutWordNode) {
            selection.setTextNodeRange(lastNode, lastNode.getTextContent().length, lastNode, lastNode.getTextContent().length);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    // Clean up
    return () => {
      copyHandler();
      pasteHandler();
    };
  }, [editor]);

  return null;
}