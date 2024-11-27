import React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $getSelection,
  $getNodeByKey,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW, 
  COPY_COMMAND,
  PASTE_COMMAND,
  TextNode,
  $createRangeSelection,
  $setSelection,
  RangeSelection,
  BaseSelection
} from 'lexical';
import { $isPaperCutSpeakerNode, $createPaperCutSpeakerNode, PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $isPaperCutWordNode, $createPaperCutWordNode, PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $isPaperCutSegmentNode, $createPaperCutSegmentNode , PaperCutSegmentNode} from '@/app/nodes/PaperCutSegmentNode';

type WordData = {
  text: string;
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  wordIndex: number;
};

type SegmentGroup = {
  segmentId: string;
  speaker: string;
  fileId: string;
  words: WordData[];
};

export function CopyPastePlugin() {
  const [editor] = useLexicalComposerContext();
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    // Parse content helper
    const parseContent = (content: string): WordData[] => {
      return content.split(/\n/)
        .join(' ')
        .split(/\s+/)
        .filter(word => word.trim() !== '')
        .map(word => {
          const [text, startTime, endTime, segmentId, speaker, fileId, wordIndex] = word.split('|');
          return {
            text,
            startTime: parseFloat(startTime) || 0,
            endTime: parseFloat(endTime) || 0,
            segmentId: segmentId || '',
            speaker: speaker || '',
            fileId: fileId || '',
            wordIndex: parseInt(wordIndex) || 0
          };
        });
    };
    
    // Group words by segment helper
    const groupWordsBySegment = (words: WordData[]): SegmentGroup[] => {
      const groupsMap = new Map<string, SegmentGroup>();
      
      words.forEach(word => {
        const key = `${word.segmentId}-${word.speaker}-${word.fileId}`;
        if (!groupsMap.has(key)) {
          groupsMap.set(key, {
            segmentId: word.segmentId,
            speaker: word.speaker,
            fileId: word.fileId,
            words: []
          });
        }
        groupsMap.get(key)?.words.push(word);
      });
      
      return Array.from(groupsMap.values());
    };

    const handleContentAtCursor = (words: WordData[], selection: RangeSelection) => {
      const anchor = selection.anchor;
      const anchorNode = anchor.getNode();
      
      let currentWord: PaperCutWordNode | null = null;
      if ($isPaperCutWordNode(anchorNode)) {
        currentWord = anchorNode;
      } else {
        const parent = anchorNode.getParent();
        if (parent && $isPaperCutWordNode(parent)) {
          currentWord = parent;
        }
      }

      if (!currentWord) return;

      const parentSpeaker = currentWord.getParent();
      if (!parentSpeaker || !$isPaperCutSpeakerNode(parentSpeaker)) return;

      // Insert words at cursor position, preserving the current segment context
      words.forEach((wordData, index) => {
        const wordNode = $createPaperCutWordNode(
          wordData.text,
          wordData.startTime,
          wordData.endTime,
          currentWord!.getSegmentId(),
          currentWord!.getSpeaker(),
          wordData.fileId,
          wordData.wordIndex
        );

        const spaceNode = $createPaperCutWordNode(
          ' ',
          wordData.endTime,
          index < words.length - 1 ? words[index + 1].startTime : wordData.endTime + 0.01,
          currentWord!.getSegmentId(),
          currentWord!.getSpeaker(),
          wordData.fileId,
          -1
        );

        selection.insertNodes([wordNode, spaceNode]);
      });
    };

    const appendToEnd = (pastedWords: WordData[]) => {
      editor.update(() => {
        const root = $getRoot();
        let lastSegment = root.getLastChild();
        if (!$isPaperCutSegmentNode(lastSegment)) {
          lastSegment = null;
        }
    
        const newSegments = groupWordsBySegment(pastedWords);
    
        newSegments.forEach((segment) => {
          const segmentNode = $createPaperCutSegmentNode(
            segment.words[0].startTime,
            segment.words[segment.words.length - 1].endTime,
            segment.segmentId,
            segment.speaker,
            segment.fileId
          );
    
          const speakerNode = $createPaperCutSpeakerNode(segment.speaker);
          segmentNode.append(speakerNode);
    
          segment.words.forEach((wordData, index) => {
            const wordNode = $createPaperCutWordNode(
              wordData.text,
              wordData.startTime,
              wordData.endTime,
              wordData.segmentId,
              wordData.speaker,
              wordData.fileId,
              wordData.wordIndex
            );
            speakerNode.append(wordNode);
    
            if (index < segment.words.length - 1) {
              speakerNode.append(
                $createPaperCutWordNode(
                  ' ',
                  wordData.endTime,
                  segment.words[index + 1].startTime,
                  wordData.segmentId,
                  wordData.speaker,
                  wordData.fileId,
                  -1
                )
              );
            }
          });
    
          if (lastSegment) {
            lastSegment.insertAfter(segmentNode);
          } else {
            root.append(segmentNode);
          }
          lastSegment = segmentNode;
        });
      });
    };

    const createNewSegments = (words: WordData[]) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
    
      const segments = new Map<string, WordData[]>();
      words.forEach(word => {
        const key = `${word.segmentId}-${word.speaker}-${word.fileId}`;
        if (!segments.has(key)) {
          segments.set(key, []);
        }
        segments.get(key)?.push(word);
      });
    
      segments.forEach((segmentWords, key) => {
        const firstWord = segmentWords[0];
        const lastWord = segmentWords[segmentWords.length - 1];
    
        const segmentNode = $createPaperCutSegmentNode(
          firstWord.startTime,
          lastWord.endTime,
          firstWord.segmentId,
          firstWord.speaker,
          firstWord.fileId
        );
    
        const speakerNode = $createPaperCutSpeakerNode(firstWord.speaker);
        segmentNode.append(speakerNode);
    
        segmentWords.forEach((wordData, index) => {
          const wordNode = $createPaperCutWordNode(
            wordData.text,
            wordData.startTime,
            wordData.endTime,
            wordData.segmentId,
            wordData.speaker,
            wordData.fileId,
            wordData.wordIndex
          );
          speakerNode.append(wordNode);
    
          if (index < segmentWords.length - 1) {
            const nextWord = segmentWords[index + 1];
            speakerNode.append($createPaperCutWordNode(
              ' ',
              wordData.endTime,
              nextWord.startTime,
              wordData.segmentId,
              wordData.speaker,
              wordData.fileId,
              -1
            ));
          }
        });
    
        selection.insertNodes([segmentNode]);
      });
    };

    const handleContent = (words: WordData[]) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
    
      const anchorNode = selection.anchor.getNode();
      
      let currentWord: PaperCutWordNode | null = null;
      if ($isPaperCutWordNode(anchorNode)) {
        currentWord = anchorNode;
      } else {
        const parent = anchorNode.getParent();
        if (parent && $isPaperCutWordNode(parent)) {
          currentWord = parent;
        }
      }
    
      if (!currentWord) {
        appendToEnd(words);
        return;
      }
    
      const parentSpeaker = currentWord.getParent();
      if (!parentSpeaker || !$isPaperCutSpeakerNode(parentSpeaker)) {
        appendToEnd(words);
        return;
      }
    
      try {
        // Create and insert nodes one at a time
        words.forEach((wordData, index) => {
          // Create new word node
          const wordNode = $createPaperCutWordNode(
            wordData.text,
            wordData.startTime,
            wordData.endTime,
            currentWord!.getSegmentId(),
            currentWord!.getSpeaker(),
            wordData.fileId,
            wordData.wordIndex
          );
    
          // Create space node if needed
          const spaceNode = index < words.length - 1 ? $createPaperCutWordNode(
            ' ',
            wordData.endTime,
            words[index + 1].startTime,
            currentWord!.getSegmentId(),
            currentWord!.getSpeaker(),
            wordData.fileId,
            -1
          ) : null;
    
          // Insert nodes
          if (wordNode.isAttached()) {
            wordNode.remove();
          }
          
          selection.insertNodes([wordNode]);
          if (spaceNode) {
            selection.insertNodes([spaceNode]);
          }
        });
      } catch (error) {
        console.error('Error inserting nodes:', error);
        // Fallback to append
        appendToEnd(words);
      }
    };

    const copyHandler = editor.registerCommand<ClipboardEvent>(
      COPY_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const selectedNodes = selection.getNodes();
        const nodes = new Set<PaperCutWordNode>();
        
        selectedNodes.forEach(node => {
          if ($isPaperCutWordNode(node)) {
            nodes.add(node);
          } else {
            const parent = node.getParent();
            if (parent && $isPaperCutWordNode(parent)) {
              nodes.add(parent);
            }
          }
        });

        const copiedData = Array.from(nodes)
          .map(node => {
            return `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
          })
          .join(' ');

        event.clipboardData?.setData('text/plain', copiedData);
        event.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const pasteHandler = editor.registerCommand(
      PASTE_COMMAND,
      (payload) => {
        const clipboardData = payload instanceof ClipboardEvent ? payload.clipboardData : null;
        const pastedText = clipboardData ? clipboardData.getData('text/plain') : '';
        
        if (!pastedText) return false;

        editor.update(() => {
          const words = parseContent(pastedText);
          if (words.length > 0) {
            handleContent(words);
          }
        });

        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const dragStartHandler = (event: DragEvent) => {
      setIsDragging(true);
      
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
      
        const nodes = selection.getNodes();
        const dragData = nodes.map(node => {
          if ($isPaperCutWordNode(node)) {
            return `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
          }
          return '';
        }).filter(Boolean).join(' ');
      
        event.dataTransfer?.setData('text/plain', dragData);
      });
    };

    const dragEndHandler = () => {
      setIsDragging(false);
    };

    const dropHandler = (event: DragEvent) => {
      event.preventDefault();
      const droppedText = event.dataTransfer?.getData('text/plain');
      
      if (droppedText) {
        const doc = event.target instanceof Node ? event.target.ownerDocument : document;
        if (doc) {
          let caretPosition: any = null;
          if ('caretPositionFromPoint' in doc) {
            caretPosition = (doc as any).caretPositionFromPoint(event.clientX, event.clientY);
          } else if ('caretRangeFromPoint' in doc) {
            caretPosition = (doc as any).caretRangeFromPoint(event.clientX, event.clientY);
          }
    
          if (caretPosition) {
            const range = doc.createRange();
            if ('offsetNode' in caretPosition && 'offset' in caretPosition) {
              range.setStart(caretPosition.offsetNode, caretPosition.offset);
            } else if (caretPosition instanceof Range) {
              range.setStart(caretPosition.startContainer, caretPosition.startOffset);
            }
            range.collapse(true);
            
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            
            editor.update(() => {
              // Parse the dropped text into word data
              const words = parseContent(droppedText);
              if (words.length > 0) {
                handleContent(words);
              }
            });
          } else {
            // Fallback if caretPositionFromPoint and caretRangeFromPoint are not supported
            editor.update(() => {
              const words = parseContent(droppedText);
              if (words.length > 0) {
                handleContent(words);
              }
            });
          }
        } else {
          // Fallback if we couldn't get a valid document
          editor.update(() => {
            const words = parseContent(droppedText);
            if (words.length > 0) {
              handleContent(words);
            }
          });
        }
      }
    };
    
    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('dragstart', dragStartHandler);
      rootElement.addEventListener('dragend', dragEndHandler);
      rootElement.addEventListener('dragover', (e) => e.preventDefault());
      rootElement.addEventListener('drop', dropHandler);
    }

    return () => {
      copyHandler();
      pasteHandler();
      if (rootElement) {
        rootElement.removeEventListener('dragstart', dragStartHandler);
        rootElement.removeEventListener('dragend', dragEndHandler);
        rootElement.removeEventListener('dragover', (e) => e.preventDefault());
        rootElement.removeEventListener('drop', dropHandler);
      }
    };
  }, [editor, isDragging]);

  return null;
}