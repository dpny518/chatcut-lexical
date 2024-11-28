import { useEffect, useCallback } from "react";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $getSelection, 
  $isRangeSelection, 
  $createTextNode, 
  $isElementNode,
  ElementNode,
  PASTE_COMMAND, 
  COPY_COMMAND, 
  COMMAND_PRIORITY_LOW 
} from 'lexical';
import { 
  $createPaperCutWordNode, 
  $isPaperCutWordNode, 
  PaperCutWordNode 
} from '@/app/nodes/PaperCutWordNode';
import { 
  $createPaperCutSegmentNode,
  $isPaperCutSegmentNode,
  PaperCutSegmentNode 
} from '@/app/nodes/PaperCutSegmentNode';
import { 
  $createPaperCutSpeakerNode,
  $isPaperCutSpeakerNode 
} from '@/app/nodes/PaperCutSpeakerNode';

interface WordData {
  word: string;
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  wordIndex: number;
}

function PaperCutEditorContent() {
  const [editor] = useLexicalComposerContext();


  const extractWordData = (node: PaperCutWordNode): WordData => ({
    word: node.getTextContent(),
    startTime: node.getStartTime(),
    endTime: node.getEndTime(),
    segmentId: node.getSegmentId(),
    speaker: node.getSpeaker(),
    fileId: node.getFileId(),
    wordIndex: node.getWordIndex(),
  });
  
  const getAllWordNodes = (): WordData[] => {
    const root = $getRoot();
    const wordNodes: WordData[] = [];
  
    root.getChildren().forEach(rootNodeChild => {
      if ($isPaperCutSegmentNode(rootNodeChild)) {
        rootNodeChild.getChildren().forEach(child => {
          if ($isPaperCutWordNode(child)) {
            wordNodes.push(extractWordData(child));
          }
        });
      } else if ($isElementNode(rootNodeChild)) {
        const elementNode = rootNodeChild as ElementNode;
        elementNode.getChildren().forEach(grandChild => {
          if ($isPaperCutWordNode(grandChild)) {
            wordNodes.push(extractWordData(grandChild));
          }
        });
      }
    });
  
    return wordNodes;
  };
  
  const groupWordsBySegmentAndSpeaker = (words: WordData[]): WordData[][] => {
    const groups: WordData[][] = [];
    let currentGroup: WordData[] = [];
    let currentSpeaker = '';
    let lastWordTime = 0;

    words.forEach((word) => {
      const timeGap = word.startTime - lastWordTime;
      
      if (word.speaker !== currentSpeaker || (timeGap > 2 && lastWordTime !== 0)) {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [];
        currentSpeaker = word.speaker;
      }
      
      currentGroup.push(word);
      lastWordTime = word.endTime;
    });

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  };

  
  const createSegmentWithSpeakerBreaks = (words: WordData[]) => {
    if (words.length === 0) return null;
    
    const firstWord = words[0];
    const segment = $createPaperCutSegmentNode(
      firstWord.startTime,
      words[words.length - 1].endTime,
      firstWord.segmentId,
      firstWord.speaker,
      firstWord.fileId
    );

    let currentWords: WordData[] = [];
    let currentSpeaker = firstWord.speaker;

    const flushCurrentWords = () => {
      if (currentWords.length === 0) return;

      // Add speaker header if needed
      if (segment.getChildrenSize() > 0) {
        segment.append($createTextNode('\n'));
      }

      const timeLabel = $createTextNode(`[${formatTime(currentWords[0].startTime)}] `);
      timeLabel.setStyle('color: #888; font-size: 0.8em;');
      const speakerNode = $createPaperCutSpeakerNode(currentSpeaker);
      
      segment.append(timeLabel);
      segment.append(speakerNode);

      // Add words
      currentWords.forEach((wordData, idx) => {
        if (idx > 0) segment.append($createTextNode(' '));
        
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

      currentWords = [];
    };

    words.forEach((wordData, index) => {
      if (wordData.speaker !== currentSpeaker) {
        flushCurrentWords();
        currentSpeaker = wordData.speaker;
      }
      currentWords.push(wordData);
    });

    flushCurrentWords();
    return segment;
  };
  const parseClipboardData = (data: string): WordData[] => {
    return data.split(' ')
      .filter(word => word.includes('|'))
      .map(wordData => {
        const [
          word,
          startTime,
          endTime,
          segmentId,
          speaker,
          fileId,
          wordIndex
        ] = wordData.split('|');

        return {
          word,
          startTime: parseFloat(startTime) || -1,
          endTime: parseFloat(endTime) || -1,
          segmentId,
          speaker,
          fileId,
          wordIndex: parseInt(wordIndex)
        };
      });
  };

  const handleCopy = useCallback((event: ClipboardEvent): boolean => {
    event.preventDefault();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const nodes = selection.getNodes();
      const wordNodes = nodes.filter($isPaperCutWordNode);

      if (wordNodes.length === 0) return false;

      const clipboardData = wordNodes
        .map((node: PaperCutWordNode) => {
          return `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
        })
        .join(' ');

      event.clipboardData?.setData('text/plain', clipboardData);
      return true;
    });
    return true;
  }, [editor]);


const handlePaste = useCallback((event: ClipboardEvent): boolean => {
  event.preventDefault();
  const clipboardData = event.clipboardData?.getData('text/plain');
  if (!clipboardData) return false;

  try {
    const selection = $getSelection();
    let insertIndex = 0;
    
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const offset = selection.anchor.offset;
      
      if ($isPaperCutWordNode(anchorNode)) {
        const existingWords = getAllWordNodes();
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
          
          // Find the next word node after this space
          let nextWordNode = null;
          for (let i = nodeIndex + 1; i < nodes.length; i++) {
            const node = nodes[i];
            if ($isPaperCutWordNode(node)) {
              nextWordNode = node;
              break;
            }
          }
          
          if (nextWordNode && $isPaperCutWordNode(nextWordNode)) {
            const existingWords = getAllWordNodes();
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

    const existingWords = getAllWordNodes();
    const newWords = parseClipboardData(clipboardData);
    
    const beforeWords = existingWords.slice(0, insertIndex);
    const afterWords = existingWords.slice(insertIndex);

    editor.update(() => {
      const root = $getRoot();
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
}, [editor]);
  
  const createSegmentWithWords = (words: WordData[], isNewSpeaker: boolean = false) => {
    if (words.length === 0) return null;
  
    // Create the segment with metadata from first word
    const segment = $createPaperCutSegmentNode(
      words[0].startTime,
      words[words.length - 1].endTime,
      words[0].segmentId,
      words[0].speaker,
      words[0].fileId
    );
  
    // Add newline for new speaker sections (skip for first section)
    if (isNewSpeaker) {
      segment.append($createTextNode('\n'));
    }
  
    // Add timestamp and speaker label
    const timeLabel = $createTextNode(`[${formatTime(words[0].startTime)}] `);
    timeLabel.setStyle('color: #888; font-size: 0.8em;');
    
    const speakerNode = $createPaperCutSpeakerNode(words[0].speaker);
    
    segment.append(timeLabel);
    segment.append(speakerNode);
  
    // Add all words with spaces between them
    words.forEach((wordData, index) => {
      // Add space before all words except the first
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
  useEffect(() => {
    return editor.registerCommand(
      COPY_COMMAND,
      handleCopy,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, handleCopy]);

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      handlePaste,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, handlePaste]);

  return null;
 
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default PaperCutEditorContent;
