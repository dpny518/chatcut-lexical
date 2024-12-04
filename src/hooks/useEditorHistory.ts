import { useCallback, useRef, useState } from 'react';
import { EditorState, ContentItem, Block, CursorPosition } from '@/app/types/papercut';

interface HistoryState {
  blocks: Block[];
  content: ContentItem[];
  cursorPosition: CursorPosition | null;
  speakerColorIndices: Record<string, number>;
}

export function useEditorHistory(
  initialState: HistoryState,
  onChange: (state: HistoryState) => void
) {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const historyRef = useRef<HistoryState[]>([initialState]);
  const currentIndexRef = useRef(0);

  const pushState = useCallback((state: HistoryState) => {
    const nextIndex = currentIndexRef.current + 1;
    historyRef.current = historyRef.current.slice(0, nextIndex).concat(state);
    currentIndexRef.current = nextIndex;
    setCanUndo(true);
    setCanRedo(false);
    onChange(state);
  }, [onChange]);

  const undo = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current--;
      const newState = historyRef.current[currentIndexRef.current];
      onChange(newState);
      setCanUndo(currentIndexRef.current > 0);
      setCanRedo(true);
    }
  }, [onChange]);

  const redo = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current++;
      const newState = historyRef.current[currentIndexRef.current];
      onChange(newState);
      setCanUndo(true);
      setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
    }
  }, [onChange]);

  return { pushState, undo, redo, canUndo, canRedo };
}