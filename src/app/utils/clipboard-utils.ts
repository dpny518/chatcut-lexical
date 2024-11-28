import { LexicalEditor, $getRoot } from 'lexical';
import { $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';

export interface WordData {
  word: string;
  startTime: number;
  endTime: number;
  wordIndex: number;
  segmentId: string;
  segmentStartTime: number;
  segmentEndTime: number;
  speaker: string;
  fileName: string;
  fileId: string;
}

export const parseClipboardData = (data: string): WordData[] => {
  return data.split(' ')
    .filter(word => word.includes('|'))
    .map(wordData => {
      const [wordInfo, segmentInfo, fileInfo] = wordData.split('|');
      const [word, wordStart, wordEnd, wordIndex] = wordInfo.split(',');
      const [segmentId, segmentStart, segmentEnd, speaker] = segmentInfo.split(',');
      const [fileName, fileId] = fileInfo.split(',');

      return {
        word,
        startTime: parseFloat(wordStart) || -1,
        endTime: parseFloat(wordEnd) || -1,
        wordIndex: parseInt(wordIndex),
        segmentId,
        segmentStartTime: parseFloat(segmentStart) || -1,
        segmentEndTime: parseFloat(segmentEnd) || -1,
        speaker,
        fileName,
        fileId
      };
    });
};

export const getAllWordNodes = (editor: LexicalEditor, files: Record<string, any>): WordData[] => {
  let wordNodes: WordData[] = [];
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    
    root.getChildren().forEach(node => {
      if ($isPaperCutSegmentNode(node)) {
        const segmentStartTime = node.getStartTime();
        const segmentEndTime = node.getEndTime();
        
        node.getChildren().forEach(child => {
          if ($isPaperCutWordNode(child)) {
            const fileId = child.getFileId();
            const fileName = files[fileId]?.name || 'unknown';
            
            wordNodes.push({
              word: child.getTextContent(),
              startTime: child.getStartTime(),
              endTime: child.getEndTime(),
              wordIndex: child.getWordIndex(),
              segmentId: child.getSegmentId(),
              segmentStartTime,
              segmentEndTime,
              speaker: child.getSpeaker(),
              fileName,
              fileId
            });
          }
        });
      }
    });
  });
  
  return wordNodes;
};

export const formatDragData = (node: any, files: Record<string, any>, segment: any): string => {
  const fileName = files[node.getFileId()]?.name || 'unknown';
  
  const wordInfo = [
    node.getTextContent(),
    node.getStartTime(),
    node.getEndTime(),
    node.getWordIndex()
  ].join(',');

  const segmentInfo = [
    node.getSegmentId(),
    segment.getStartTime(),
    segment.getEndTime(),
    node.getSpeaker()
  ].join(',');

  const fileInfo = [
    fileName,
    node.getFileId()
  ].join(',');

  return [wordInfo, segmentInfo, fileInfo].join('|');
};

export const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};