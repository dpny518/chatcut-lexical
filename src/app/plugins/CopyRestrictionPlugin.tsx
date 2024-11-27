import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COPY_COMMAND,
  CUT_COMMAND,
} from 'lexical';
import { useEffect } from 'react';
import { mergeRegister } from '@lexical/utils';
import { $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { $isPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';

export function CopyRestrictionPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        COPY_COMMAND,
        (event: ClipboardEvent) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }
      
          // Get just the PaperCutWordNodes from the selection
          const selectedNodes = selection.getNodes();
          const wordNodes = selectedNodes.filter($isPaperCutWordNode);
      
          // If no PaperCutWordNodes are found, prevent the copy completely
          if (wordNodes.length === 0) {
            event.preventDefault();
            return true;
          }
      
          // Format only the word nodes with metadata
          const copiedData = wordNodes.map((node, index) => {
            const metadata = `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
            
            if (node.getWordIndex() === -1 || index === wordNodes.length - 1) {
              return metadata;
            }
            
            const nextNode = wordNodes[index + 1];
            const spaceMetadata = ` |${node.getEndTime()}|${nextNode.getStartTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|-1`;
            
            return metadata + spaceMetadata;
          }).join(' ');
      
          event.clipboardData?.setData('text/plain', copiedData);
          event.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      ),

      // Handle cut command the same way as copy
      editor.registerCommand(
        CUT_COMMAND,
        (event: ClipboardEvent) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) {
            return false;
          }

          const nodes = selection.getNodes();
          const getAllWordNodes = (node: any): any[] => {
            if ($isPaperCutWordNode(node)) {
              return [node];
            }
            if ($isPaperCutSegmentNode(node) || $isPaperCutSpeakerNode(node)) {
              return node.getChildren().flatMap(getAllWordNodes);
            }
            return [];
          };

          const wordNodes = nodes.flatMap(getAllWordNodes);

          if (wordNodes.length === 0) {
            event.preventDefault();
            return true;
          }

          // Format and set clipboard data
          const copiedData = wordNodes.map((node, index) => {
            const metadata = `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
            
            if (node.getWordIndex() === -1 || index === wordNodes.length - 1) {
              return metadata;
            }
            
            const nextNode = wordNodes[index + 1];
            const spaceMetadata = ` |${node.getEndTime()}|${nextNode.getStartTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|-1`;
            
            return metadata + spaceMetadata;
          }).join(' ');

          event.clipboardData?.setData('text/plain', copiedData);
          
          // Allow the cut operation to proceed after copying
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [editor]);

  return null;
}