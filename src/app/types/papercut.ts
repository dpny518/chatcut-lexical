export interface ContentItem {
    word: string;
    startTime: number;
    endTime: number;
    wordIndex: number;
    segmentId: string;
    segmentStartTime: number;
    segmentEndTime: number;
    speaker: string;
    fileName: string;
    fileId: string;
  }
  
  export interface Block {
    id: string;
    items: ContentItem[];
    speaker: string;
  }
  
  export interface SpeakerColor {
    bg: string;
    blockHover: string;
    wordHover: string;
    textLight: string;
    textDark: string;
    edgeLine: string;
  }
  
  export interface CursorPosition {
    blockId: string;
    wordIndex: number;
  }
  
  export interface EditorState {
    blocks: Block[];
    cursorPosition: CursorPosition | null;
    speakerColorIndices: Record<string, number>;
  }
  
  export interface PapercutEditorRef {
    addContentAtEnd: (clipboardData: string) => void;
    addContentAtCursor: (clipboardData: string) => void;
    getCurrentState: () => EditorState;
    restoreState: (state: EditorState) => void;
  }