// TimelinePlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';

function TimelinePlugin() {
  const [editor] = useLexicalComposerContext();
  const [timeMarkers, setTimeMarkers] = useState<number[]>([]);

  useEffect(() => {
    const updateTimeMarkers = () => {
      editor.getEditorState().read(() => {
        const root = editor.getRootElement();
        if (!root) return;

        const segments = root.querySelectorAll('[data-lexical-segment]');
        const newTimeMarkers: number[] = [];

        segments.forEach((segment) => {
          const startTime = segment.getAttribute('data-start-time');
          if (startTime) {
            newTimeMarkers.push(parseFloat(startTime));
          }
        });

        setTimeMarkers(newTimeMarkers);
      });
    };

    editor.registerUpdateListener(updateTimeMarkers);
    return () => {
      editor.removeUpdateListener(updateTimeMarkers);
    };
  }, [editor]);

  return (
    <div className="timeline">
      {timeMarkers.map((time, index) => (
        <div key={index} className="time-marker">
          {formatTime(time)}
        </div>
      ))}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default TimelinePlugin;