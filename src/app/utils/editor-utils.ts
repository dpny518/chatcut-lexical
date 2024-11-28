import { $createTextNode, $getRoot, $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import { $createPaperCutSegmentNode, PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { $createPaperCutWordNode, $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $createPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { WordData, parseClipboardData, getAllWordNodes, formatTime } from './clipboard-utils';

export const createSegmentWithWords = (words: WordData[], isNewSpeaker: boolean = false): PaperCutSegmentNode | null => {
  if (words.length === 0) return null;

  const segment = $createPaperCutSegmentNode(
    words[0].segmentStartTime,
    words[0].segmentEndTime,
    words[0].segmentId,
    words[0].speaker,
    words[0].fileId
  );

  if (isNewSpeaker) {
    segment.append($createTextNode('\n'));
  }

  const timeLabel = $createTextNode(`[${formatTime(words[0].segmentStartTime)}] `);
  timeLabel.setStyle('color: #888; font-size: 0.8em;');
  
  const speakerNode = $createPaperCutSpeakerNode(words[0].speaker);
  
  segment.append(timeLabel);
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
  
        if (appendToEnd) {
          // For "Add" operation - append at the end
          const existingWords = getAllWordNodes(editor, files);
          insertIndex = existingWords.length;
        } else if ($isRangeSelection(selection)) {
          // For "Insert" operation - use current selection
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
  
        const flushWords = () => {
          if (currentWords.length > 0) {
            const segment = createSegmentWithWords(currentWords, !isFirstSegment);
            if (segment) {
              root.append(segment);
              isFirstSegment = false;
            }
            currentWords = [];
          }
        };
  
        [...beforeWords, ...newWords, ...afterWords].forEach((word) => {
          if (word.speaker !== currentSpeaker) {
            flushWords();
            currentSpeaker = word.speaker;
          }
          currentWords.push(word);
        });
  
        flushWords();
      });
  
      return true;
    } catch (error) {
      console.error('Error parsing pasted content:', error);
      return false;
    }
  };