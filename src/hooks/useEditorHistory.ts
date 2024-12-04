import { useCallback, useRef } from 'react';
import { EditorState } from '@/app/types/papercut';

export function useEditorHistory(
  initialState: EditorState,
  onChange: (state: EditorState) => void
) {
  const historyRef = useRef<EditorState[]>([initialState]);
  const currentIndexRef = useRef(0);

  const pushState = useCallback((state: EditorState) => {
    const nextIndex = currentIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex).concat(state);
    currentIndexRef.current = nextIndex;
    onChange(state);
  }, [onChange]);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      onChange(historyRef.current[currentIndexRef.current]);
    }
  }, [onChange]);

  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      onChange(historyRef.current[currentIndexRef.current]);
    }
  }, [onChange]);

  return { pushState, undo, redo };
}

export function useEditorColors() {
  const generateColorForSpeaker = useCallback((index: number) => {
    const hue = (index * 137.508) % 360;
    const saturation = 65;
  
    return {
      bg: `hsla(${hue}, ${saturation}%, 60%, 0)`,
      blockHover: `hsl(${hue}, ${saturation}%, 45%)`,
      wordHover: `hsl(${hue}, ${saturation}%, 55%)`,
      textLight: `hsl(${hue}, ${saturation}%, 95%)`,
      textDark: `hsl(${hue}, ${saturation}%, 15%)`,
      edgeLine: `hsl(${hue}, ${saturation}%, 45%)`
    };
  }, []);

  return { generateColorForSpeaker };
}