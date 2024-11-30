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

// Keep the original getSplitPositions function as it works well
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
      node.getChildren().forEach(child => {
        if ($isPaperCutWordNode(child)) {
          wordIndex++;
        }
      });
    }
  });
  
  return splitPositions;
};

// Keep the original createSegmentWithWords as it works correctly
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
        const existingWords = getAllWordNodes(editor, files);

        // Get existing split positions before modifying
        const splitPositions = getSplitPositions(editor);
  
        if (appendToEnd) {
          insertIndex = existingWords.length;
        } else if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const offset = selection.anchor.offset;
          
          if ($isPaperCutWordNode(anchorNode)) {
            const wordStartTime = anchorNode.getStartTime();
            const wordText = anchorNode.getTextContent();
            
            const currentIndex = existingWords.findIndex(word => 
              word.word === wordText &&
              word.startTime === wordStartTime
            );
            
            if (currentIndex !== -1) {
              // If we're at the beginning of a word (offset 0), insert before it
              // Otherwise, insert after it
              insertIndex = offset === 0 ? currentIndex : currentIndex + 1;
            }
          } else {
            // Handle non-word nodes (spaces, etc)
            const parent = anchorNode.getParent();
            if (parent && $isPaperCutSegmentNode(parent)) {
              const nodes = parent.getChildren();
              const nodeIndex = nodes.indexOf(anchorNode);
              
              // Find previous and next word nodes
              let prevWordNode = null;
              let nextWordNode = null;
              
              // Look backwards for previous word
              for (let i = nodeIndex - 1; i >= 0; i--) {
                if ($isPaperCutWordNode(nodes[i])) {
                  prevWordNode = nodes[i];
                  break;
                }
              }
              
              // Look forwards for next word
              for (let i = nodeIndex + 1; i < nodes.length; i++) {
                if ($isPaperCutWordNode(nodes[i])) {
                  nextWordNode = nodes[i];
                  break;
                }
              }
              
              // Determine insert position based on surrounding words
              if (prevWordNode && nextWordNode) {
                // If between words, use cursor position relative to space
                const spaceNode = anchorNode;
                const spaceLength = spaceNode.getTextContent().length;
                
                if (offset > spaceLength / 2) {
                  // Closer to next word
                  if ($isPaperCutWordNode(nextWordNode)) {
                    const nextIndex = existingWords.findIndex(word => 
                      word.word === nextWordNode.getTextContent() &&
                      word.startTime === nextWordNode.getStartTime()
                    );
                    insertIndex = nextIndex !== -1 ? nextIndex : insertIndex;
                  }
                } else {
                  // Closer to previous word
                  if ($isPaperCutWordNode(prevWordNode)) {
                    const prevIndex = existingWords.findIndex(word => 
                      word.word === prevWordNode.getTextContent() &&
                      word.startTime === prevWordNode.getStartTime()
                    );
                    insertIndex = prevIndex !== -1 ? prevIndex + 1 : insertIndex;
                  }
                }
              } else if (prevWordNode) {
                // At end of text or segment
                if ($isPaperCutWordNode(prevWordNode)) {
                  const prevIndex = existingWords.findIndex(word => 
                    word.word === prevWordNode.getTextContent() &&
                    word.startTime === prevWordNode.getStartTime()
                  );
                  insertIndex = prevIndex !== -1 ? prevIndex + 1 : existingWords.length;
                }
              } else if (nextWordNode) {
                // At start of text or segment
                if ($isPaperCutWordNode(nextWordNode)) {
                  const nextIndex = existingWords.findIndex(word => 
                    word.word === nextWordNode.getTextContent() &&
                    word.startTime === nextWordNode.getStartTime()
                  );
                  insertIndex = nextIndex !== -1 ? nextIndex : 0;
                }
              }
            }
          }
        }

        // Adjust split positions based on insertion point
        const adjustedSplitPositions = splitPositions.map(split => ({
          ...split,
          wordIndex: split.wordIndex >= insertIndex ? 
            split.wordIndex + newWords.length : 
            split.wordIndex
        }));

        const beforeWords = existingWords.slice(0, insertIndex);
        const afterWords = existingWords.slice(insertIndex);
  
        root.clear();
  
        let currentWords: WordData[] = [];
        let currentSpeaker = '';
        let isFirstSegment = true;
        let wordCount = 0;
  
        const flushWords = (forceSplit: boolean = false) => {
          if (currentWords.length > 0) {
            const split = adjustedSplitPositions.find(sp => 
              sp.wordIndex === wordCount - currentWords.length &&
              sp.segmentId === currentWords[0].segmentId
            );
            
            const segment = createSegmentWithWords(
              currentWords, 
              !isFirstSegment || forceSplit,
              !!split
            );
            
            if (segment) {
              root.append(segment);
              isFirstSegment = false;
            }
            currentWords = [];
          }
        };
  
        [...beforeWords, ...newWords, ...afterWords].forEach((word) => {
          const atSplitPosition = adjustedSplitPositions.some(sp => 
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