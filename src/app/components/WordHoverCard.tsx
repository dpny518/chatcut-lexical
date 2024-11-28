import React, { useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, LexicalNode } from 'lexical';
import { PaperCutWordNode, $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { FileAudio, User, Hash, Clock, Play, ExternalLink } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface HoverData {
  file: string;
  speaker: string;
  segmentIndex: string;
  segmentStartTime: string;
  wordStartTime: string;
  word: string;
}

interface HoverPosition {
  x: number;
  y: number;
}

export function WordHoverPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [hoverData, setHoverData] = useState<HoverData | null>(null);
  const [hoverPosition, setHoverPosition] = useState<HoverPosition>({ x: 0, y: 0 });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const removeListener = editor.registerMutationListener(
      PaperCutWordNode,
      (mutatedNodes: Map<string, 'created' | 'destroyed'>) => {
        for (const [nodeKey, mutation] of mutatedNodes) {
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
        }
      }
    );

    return () => {
      removeListener();
    };
  }, [editor]);

  const handleMouseEnter = (event: MouseEvent, node: PaperCutWordNode) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      setHoverPosition({ x: rect.left, y: rect.bottom });
      setHoverData({
        file: node.getFileId(),
        speaker: node.getSpeaker(),
        segmentIndex: node.getSegmentId(),
        segmentStartTime: formatTime(node.getSegmentStartTime()),
        wordStartTime: node.getStartTime() !== -1 ? formatTime(node.getStartTime()) : 'N/A',
        word: node.getTextContent(),
      });
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoverData(null);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!hoverData) return null;

  return (
    <HoverCard open={!!hoverData}>
      <HoverCardTrigger asChild>
        <div style={{ position: 'fixed', left: hoverPosition.x, top: hoverPosition.y }} />
      </HoverCardTrigger>
      <HoverCardContent className="w-80 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Word Info</h4>
          <div className="space-y-2">
            <InfoItem icon={<FileAudio className="w-4 h-4" />} label="File" value={hoverData.file} />
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