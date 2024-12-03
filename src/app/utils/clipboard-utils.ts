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
  console.log('Raw clipboard data:', data);
  return data.split(' ')
    .filter(word => word.includes('|'))
    .map(wordData => {
      // Split on | first to get the three main parts
      const parts = wordData.split('|');
      const wordInfo = parts[0];
      const segmentInfo = parts[1];
      const fileInfo = parts.slice(2).join('|'); // Join the rest back together in case filename contains |
      
      const [word, wordStart, wordEnd, wordIndex] = wordInfo.split(',');
      const [segmentId, segmentStart, segmentEnd, speaker] = segmentInfo.split(',');
      
      // Find the last comma to split filename and fileId
      const lastCommaIndex = fileInfo.lastIndexOf(',');
      const fileName = fileInfo.slice(0, lastCommaIndex);
      const fileId = fileInfo.slice(lastCommaIndex + 1);

      console.log('Parsed file info:', { fileName, fileId }); // Debug log
      
      const parsedData = {
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
      
      console.log('Parsed word data:', parsedData);
      return parsedData;
    });
};

export const getAllWordNodes = (editor: LexicalEditor, files: Record<string, any>): WordData[] => {
  let wordNodes: WordData[] = [];
  
  editor.getEditorState().read(() => {
    const root = $getRoot();
    
    console.log('Root children:', root.getChildren());
    
    root.getChildren().forEach(node => {
      console.log('Node type:', node.getType());
      
      if ($isPaperCutSegmentNode(node)) {
        console.log('Found segment node');
        const segmentStartTime = node.getStartTime();
        const segmentEndTime = node.getEndTime();
        
        const children = node.getChildren();
        console.log('Segment children:', children);
        
        children.forEach(child => {
          console.log('Child type:', child.getType());
          
          if ($isPaperCutWordNode(child)) {
            console.log('Found word node:', {
              text: child.getTextContent(),
              fileId: child.getFileId()
            });
            
            try {
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
            } catch (error) {
              console.error('Error processing word node:', error);
            }
          }
        });
      }
    });
  });
  
  console.log('Final word nodes:', wordNodes);
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