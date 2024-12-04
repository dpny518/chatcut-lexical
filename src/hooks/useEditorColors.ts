// src/hooks/useEditorColors.ts
import { useCallback } from 'react';

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