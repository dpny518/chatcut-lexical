import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getRoot,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalNode,
  ElementNode
} from 'lexical';
import { useEffect } from 'react';
import { 
  $createPaperCutSegmentNode,
  $isPaperCutSegmentNode,
} from '@/app/nodes/PaperCutSegmentNode';

import {
  $createPaperCutSpeakerNode,
  $isPaperCutSpeakerNode,
} from '@/app/nodes/PaperCutSpeakerNode';

import {
  $createPaperCutWordNode,
  $isPaperCutWordNode,
  PaperCutWordNode
} from '@/app/nodes/PaperCutWordNode';

export const SYNC_COMMAND: LexicalCommand<void> = createCommand('SYNC_COMMAND');

interface SegmentData {
  startTime: number;
  endTime: number;
  fileId: string;
  speakers: Map<string, PaperCutWordNode[]>;
}

export function EditorSyncPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      SYNC_COMMAND,
      () => {
        editor.update(() => {
          syncEditorState();
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(() => {
      editor.dispatchCommand(SYNC_COMMAND, undefined);
    });
  }, [editor]);

  return null;
}

function syncEditorState(): void {
  const root = $getRoot();
  const nodes = root.getChildren();
  
  const segments = new Map<string, SegmentData>();

  nodes.forEach((node: LexicalNode) => {
    if (node instanceof ElementNode) {
      node.getChildren().forEach((child: LexicalNode) => {
        if ($isPaperCutWordNode(child)) {
          const segmentId = child.getSegmentId();
          const speaker = child.getSpeaker();
          
          if (!segments.has(segmentId)) {
            segments.set(segmentId, {
              startTime: child.getStartTime(),
              endTime: child.getEndTime(),
              fileId: child.getFileId(),
              speakers: new Map()
            });
          }
          
          const segment = segments.get(segmentId)!;
          if (!segment.speakers.has(speaker)) {
            segment.speakers.set(speaker, []);
          }
          
          segment.speakers.get(speaker)!.push(child);
          
          segment.startTime = Math.min(segment.startTime, child.getStartTime());
          segment.endTime = Math.max(segment.endTime, child.getEndTime());
        }
      });
    }
  });

  root.clear();

  Array.from(segments.entries()).forEach(([segmentId, segmentData]) => {
    const segmentNode = $createPaperCutSegmentNode(
      segmentData.startTime,
      segmentData.endTime,
      segmentId,
      '', // Speaker will be in child nodes
      segmentData.fileId
    );
    
    Array.from(segmentData.speakers.entries()).forEach(([speaker, words]) => {
      const speakerNode = $createPaperCutSpeakerNode(speaker);
      
      words.sort((a: PaperCutWordNode, b: PaperCutWordNode) => {
        if (a.getStartTime() === b.getStartTime()) {
          return a.getWordIndex() - b.getWordIndex();
        }
        return a.getStartTime() - b.getStartTime();
      });
      
      words.forEach((word: PaperCutWordNode) => {
        speakerNode.append(word);
      });
      
      segmentNode.append(speakerNode);
    });
    
    const paragraph = $createParagraphNode();
    paragraph.append(segmentNode);
    root.append(paragraph);
  });
}