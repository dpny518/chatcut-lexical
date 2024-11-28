import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, NodeKey } from 'lexical';
import { PaperCutWordNode, $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { PaperCutSegmentNode, $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { FileAudio, User, Hash, Clock, Play, ExternalLink } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useFileSystem } from '@/app/contexts/FileSystemContext';

interface HoverData {
  fileId: string;
  fileName: string;
  speaker: string;
  segmentIndex: string;
  segmentStartTime: string;
  wordStartTime: string;
  word: string;
}

export function WordHoverPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const { files } = useFileSystem();
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [hoverTarget, setHoverTarget] = useState<HTMLElement | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback((event: MouseEvent, wordNode: PaperCutWordNode) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      editor.getEditorState().read(() => {
        const segmentNode = wordNode.getParent();
        if ($isPaperCutSegmentNode(segmentNode)) {
          const fileId = segmentNode.getFileId();
          const fileItem = files[fileId];
          const fileName = fileItem?.name ?? 'Unknown';

          setHoverData({
            fileId,
            fileName,
            speaker: segmentNode.getSpeaker(),
            segmentIndex: segmentNode.getSegmentId(),
            segmentStartTime: formatTime(segmentNode.getStartTime()),
            wordStartTime: wordNode.getStartTime() !== -1 ? formatTime(wordNode.getStartTime()) : 'N/A',
            word: wordNode.getTextContent(),
          });
          setHoverTarget(event.target as HTMLElement);
        }
      });
    }, 1000);
  }, [editor, files]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverData(null);
    setHoverTarget(null);
  }, []);

  useEffect(() => {
    const removeListener = editor.registerMutationListener(
      PaperCutWordNode,
      (mutatedNodes: Map<NodeKey, 'created' | 'destroyed' | 'updated'>) => {
        editor.update(() => {
          Array.from(mutatedNodes.entries()).forEach(([nodeKey, mutation]) => {
            if (mutation === 'created') {
              const node = $getNodeByKey(nodeKey);
              if ($isPaperCutWordNode(node)) {
                const element = editor.getElementByKey(nodeKey);
                if (element) {
                  element.addEventListener('mouseenter', (e) => handleMouseEnter(e, node));
                  element.addEventListener('mouseleave', handleMouseLeave);
                }
              }
            }
          });
        });
      }
    );

    return () => {
      removeListener();
    };
  }, [editor, handleMouseEnter, handleMouseLeave]);

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <HoverCard open={!!hoverData}>
      <HoverCardTrigger asChild>
        {hoverTarget ? <div>{hoverTarget.textContent}</div> : <div />}
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        {hoverData && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Word Info</h4>
            <div className="space-y-2">
              <InfoItem icon={<FileAudio className="w-4 h-4" />} label="File" value={hoverData.fileName} />
              <InfoItem icon={<User className="w-4 h-4" />} label="Speaker" value={hoverData.speaker} />
              <InfoItem icon={<Hash className="w-4 h-4" />} label="Segment Index" value={hoverData.segmentIndex} />
              <InfoItem icon={<Clock className="w-4 h-4" />} label="Segment Start Time" value={hoverData.segmentStartTime} />
              <InfoItem icon={<Play className="w-4 h-4" />} label="Word Start Time" value={hoverData.wordStartTime} />
              <InfoItem icon={<ExternalLink className="w-4 h-4" />} label="Word" value={hoverData.word} />
            </div>
            <a 
              href="#" 
              className="inline-flex items-center text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              Find in source
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function InfoItem({ icon, label, value }: InfoItemProps): JSX.Element {
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{icon}</span>
      <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>
      <span className="text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}