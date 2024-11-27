// src/app/utils/editorHelpers.ts

import { 
    $getRoot,
    $createParagraphNode,
    $createTextNode,
    LexicalEditor
  } from 'lexical';
  import { $isPaperCutWordNode, $createPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
  import { $isPaperCutSpeakerNode, $createPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
  import { $isPaperCutSegmentNode, $createPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
  
  export type WordData = {
    text: string;
    startTime: number;
    endTime: number;
    segmentId: string;
    speaker: string;
    fileId: string;
    wordIndex: number;
  };
  
  export const reorganizeWords = (editor: LexicalEditor) => {
    editor.update(() => {
      const root = $getRoot();
      const allNodes: Array<WordData | { type: 'space', text: string }> = [];
      
      // Collect all words and existing spaces
      root.getChildren().forEach(segment => {
        if ($isPaperCutSegmentNode(segment)) {
          segment.getChildren().forEach(speaker => {
            if ($isPaperCutSpeakerNode(speaker)) {
              speaker.getChildren().forEach(node => {
                if ($isPaperCutWordNode(node)) {
                  allNodes.push({
                    text: node.getTextContent(),
                    startTime: node.getStartTime(),
                    endTime: node.getEndTime(),
                    segmentId: node.getSegmentId(),
                    speaker: node.getSpeaker(),
                    fileId: node.getFileId(),
                    wordIndex: node.getWordIndex()
                  });
                } else if (node.getTextContent() === ' ') {
                  allNodes.push({ type: 'space', text: ' ' });
                }
              });
            }
          });
        }
      });
  
      console.log('Before restructure:', JSON.stringify(allNodes, null, 2));
  
      // Clear existing content
      root.clear();
  
      // Recreate content preserving original structure
      let currentSegment: any = null;
      let currentSpeaker: any = null;
  
      allNodes.forEach((node) => {
        if ('type' in node && node.type === 'space') {
          // For spaces, just append a regular space TextNode
          if (currentSpeaker) {
            currentSpeaker.append($createTextNode(' '));
          }
        } else {
          const wordData = node as WordData;
          
          // Create new segment if needed
          if (!currentSegment || currentSegment.getSegmentId() !== wordData.segmentId) {
            currentSegment = $createPaperCutSegmentNode(
              wordData.startTime,
              wordData.endTime,
              wordData.segmentId,
              wordData.speaker,
              wordData.fileId
            );
            root.append(currentSegment);
            currentSpeaker = null;
          }
  
          // Create new speaker if needed
          if (!currentSpeaker || currentSpeaker.getSpeaker() !== wordData.speaker) {
            currentSpeaker = $createPaperCutSpeakerNode(wordData.speaker);
            currentSegment.append(currentSpeaker);
          }
  
          // Create word node
          const wordNode = $createPaperCutWordNode(
            wordData.text,
            wordData.startTime,
            wordData.endTime,
            wordData.segmentId,
            wordData.speaker,
            wordData.fileId,
            wordData.wordIndex
          );
          currentSpeaker.append(wordNode);
        }
      });
  
      console.log('After restructure:', JSON.stringify(root.getTextContent(), null, 2));
    });
  };