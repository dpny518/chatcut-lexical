import { $createTextNode, $getRoot, $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import { $createPaperCutSegmentNode, PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { $createPaperCutWordNode, $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $createPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { WordData, parseClipboardData, getAllWordNodes, formatTime } from './clipboard-utils';

interface SplitPosition {
  wordIndex: number;
  segmentId: string;
}

// Get splits by tracking word positions and segmentIds
const getSplitPositions = (editor: LexicalEditor): SplitPosition[] => {
  const splitPositions: SplitPosition[] = [];
  const root = $getRoot();
  let wordIndex = 0;
  
  root.getChildren().forEach(node => {
    if ($isPaperCutSegmentNode(node)) {
      if (node.isManualSplit()) {
        splitPositions.push({
          wordIndex,
          segmentId: node.getSegmentId()
        });
      }
      // Count words in this segment
      node.getChildren().forEach(child => {
        if ($isPaperCutWordNode(child)) {
          wordIndex++;
        }
      });
    }
  });
  
  return splitPositions;
};

export const createSegmentWithWords = (
  words: WordData[], 
  isNewSpeaker: boolean = false,
  isManualSplit: boolean = false
): PaperCutSegmentNode | null => {
  if (words.length === 0) return null;

  const segment = $createPaperCutSegmentNode(
    words[0].segmentStartTime,
    words[0].segmentEndTime,
    words[0].segmentId,
    words[0].speaker,
    words[0].fileId,
    isManualSplit
  );

  if (isNewSpeaker) {
    segment.append($createTextNode('\n'));
  }
  
  const speakerNode = $createPaperCutSpeakerNode(words[0].speaker);
  segment.append(speakerNode);

  words.forEach((wordData, index) => {
    if (index > 0) {
      segment.append($createTextNode(' '));
    }

    const wordNode = $createPaperCutWordNode(
      wordData.word,
      wordData.startTime,
      wordData.endTime,
      wordData.segmentId,
      wordData.speaker,
      wordData.fileId,
      wordData.wordIndex
    );

    segment.append(wordNode);
  });

  return segment;
};

export const handlePaste = (clipboardData: string, editor: LexicalEditor, files: Record<string, any>, appendToEnd: boolean = false): boolean => {
    if (!clipboardData) return false;
  
    try {
      const newWords = parseClipboardData(clipboardData);
      
      editor.update(() => {
        const selection = $getSelection();
        const root = $getRoot();
        let insertIndex = 0;

        // Get existing split positions before modifying
        const splitPositions = getSplitPositions(editor);
  
        if (appendToEnd) {
          const existingWords = getAllWordNodes(editor, files);
          insertIndex = existingWords.length;
        } else if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const offset = selection.anchor.offset;
          
          if ($isPaperCutWordNode(anchorNode)) {
            const existingWords = getAllWordNodes(editor, files);
            const wordStartTime = anchorNode.getStartTime();
            const wordText = anchorNode.getTextContent();
            
            const currentIndex = existingWords.findIndex(word => 
              word.word === wordText &&
              word.startTime === wordStartTime
            );
            
            if (currentIndex !== -1) {
              insertIndex = offset === anchorNode.getTextContent().length ? 
                currentIndex + 1 : currentIndex;
            }
          } else {
            const parent = anchorNode.getParent();
            if (parent && $isPaperCutSegmentNode(parent)) {
              const nodes = parent.getChildren();
              const nodeIndex = nodes.indexOf(anchorNode);
              
              let nextWordNode = null;
              for (let i = nodeIndex + 1; i < nodes.length; i++) {
                const node = nodes[i];
                if ($isPaperCutWordNode(node)) {
                  nextWordNode = node;
                  break;
                }
              }
              
              if (nextWordNode && $isPaperCutWordNode(nextWordNode)) {
                const existingWords = getAllWordNodes(editor, files);
                const nextWordIndex = existingWords.findIndex(word => 
                  word.word === nextWordNode.getTextContent() &&
                  word.startTime === nextWordNode.getStartTime()
                );
                
                if (nextWordIndex !== -1) {
                  insertIndex = nextWordIndex;
                }
              }
            }
          }
        }

        const existingWords = getAllWordNodes(editor, files);
        const beforeWords = existingWords.slice(0, insertIndex);
        const afterWords = existingWords.slice(insertIndex);
  
        root.clear();
  
        let currentWords: WordData[] = [];
        let currentSpeaker = '';
        let isFirstSegment = true;
        let wordCount = 0;
  
        const flushWords = (forceSplit: boolean = false) => {
          if (currentWords.length > 0) {
            // Find if there's a split position matching our current position
            const split = splitPositions.find(sp => 
              sp.wordIndex === wordCount - currentWords.length &&
              sp.segmentId === currentWords[0].segmentId
            );
            
            const segment = createSegmentWithWords(
              currentWords, 
              !isFirstSegment || forceSplit,
              !!split // Mark as manual split if we found a matching split position
            );
            
            if (segment) {
              root.append(segment);
              isFirstSegment = false;
            }
            currentWords = [];
          }
        };
  
        [...beforeWords, ...newWords, ...afterWords].forEach((word) => {
          // Check if this word is at a split position
          const atSplitPosition = splitPositions.some(sp => 
            sp.wordIndex === wordCount && 
            sp.segmentId === word.segmentId
          );

          if ((word.speaker !== currentSpeaker) || atSplitPosition) {
            flushWords(atSplitPosition);
            currentSpeaker = word.speaker;
          }

          currentWords.push(word);
          wordCount++;
        });
  
        flushWords();
      });
  
      return true;
    } catch (error) {
      console.error('Error parsing pasted content:', error);
      return false;
    }
  };