'use client';
import { Bold, Italic, Underline, Strikethrough, Undo, Redo } from 'lucide-react';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $getRoot,
  $createTextNode,
  createCommand,
  EditorState,
  LexicalEditor,
  LexicalNode,
  TextFormatType,
  ElementNode
} from "lexical";
import { $isWordNode, WordNode } from '@/app/nodes/WordNode';
import { $isSegmentNode, SegmentNode } from '@/app/nodes/SegmentNode';
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { useEditors } from '@/app/contexts/EditorContext';
import { useFileSystem } from "@/app/contexts/FileSystemContext";
import { WordData } from '@/app/utils/clipboard-utils';
import { handlePaste } from '@/app/utils/editor-utils';
import '@/app/plugins/toolbar.css'; 
interface DividerProps {
  className?: string;
}

interface StyleObject {
  [key: string]: string | null;
}

interface EditorUpdatePayload {
  editorState: EditorState;
  tags: Set<string>;
  dirtyLeaves: Set<string>;
  dirtyElements: Set<string>;
}

const LowPriority = 1;
const ADD_TO_PAPERCUT_COMMAND = createCommand<void>('ADD_TO_PAPERCUT_COMMAND');
const INSERT_TO_PAPERCUT_COMMAND = createCommand<void>('INSERT_TO_PAPERCUT_COMMAND');

function Divider({ className = "" }: DividerProps) {
  return <div className={`h-6 w-[1px] bg-border ${className}`} />;
}

const groupWordsBySegment = (words: WordData[]) => {
  const groupsMap = new Map<string, {
    segmentId: string;
    speaker: string;
    fileId: string;
    words: WordData[];
  }>();
  
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

export default function ToolbarPlugin() {
  
  const [editor] = useLexicalComposerContext();
  const { getActivePaperCutEditor } = useEditors();
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isGreenHighlight, setIsGreenHighlight] = useState(false);
  const [isRedHighlight, setIsRedHighlight] = useState(false);
  const [hasValidSelection, setHasValidSelection] = useState(false);

  const HIGHLIGHT_GREEN = '#ADFF2F';
  const HIGHLIGHT_RED = '#FF6347';
  const FORMAT_GREEN_HIGHLIGHT = 'format_green_highlight';
  const FORMAT_RED_HIGHLIGHT = 'format_red_highlight';
  const { files } = useFileSystem();
  
    const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const nodes = selection.getNodes();
      const hasWordNodes = nodes.some($isWordNode);
      const activePaperCutEditor = getActivePaperCutEditor();
      
      console.log('Updating toolbar:');
      console.log('- Has word nodes:', hasWordNodes);
      console.log('- Active PaperCut editor:', activePaperCutEditor);
      console.log('- Selection:', selection);
      console.log('- Node types:', nodes.map(n => n.getType()));
      
      setHasValidSelection(hasWordNodes && activePaperCutEditor !== null);
  
      // Update text format states
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
  
      // Update highlight states
      const bgColor = $getSelectionStyleValueForProperty(selection, 'background-color', undefined);
      setIsGreenHighlight(bgColor === HIGHLIGHT_GREEN);
      setIsRedHighlight(bgColor === HIGHLIGHT_RED);
    } else {
      console.log('No range selection');
      setHasValidSelection(false);
      
      // Reset all states when there's no selection
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setIsStrikethrough(false);
      setIsGreenHighlight(false);
      setIsRedHighlight(false);
    }
  }, [getActivePaperCutEditor]);
  const applyStyleText = useCallback(
    (styles: StyleObject, skipHistoryStack: boolean) => {
      editor.update(
        () => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            $patchStyleText(selection, styles);
          }
        },
        skipHistoryStack ? { tag: 'skip-history' } : undefined
      );
    },
    [editor]
  );

  const applyHighlight = useCallback(
    (color: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const currentBgColor = $getSelectionStyleValueForProperty(selection, 'background-color', undefined);
          applyStyleText({
            'background-color': currentBgColor === color ? null : color
          }, false);
        }
      });
    },
    [editor, applyStyleText]
  );

  const handleAddToPaperCut = useCallback((): boolean => {
    const selection = $getSelection();
    console.log('Selection:', selection);
    if (!$isRangeSelection(selection)) {
      console.log('Not a range selection');
      return false;
    }
  
    const nodes = selection.getNodes();
    console.log('All nodes:', nodes);
    const wordNodes = nodes.filter($isWordNode);
    console.log('Word nodes:', wordNodes);
    
    if (wordNodes.length === 0) return false;
  
    const selectedWords = editor.getEditorState().read(() => {
      return wordNodes.map(node => {
        console.log('Processing node:', node);
        const segment = node.getParent();
        console.log('Parent segment:', segment);
        if (!$isSegmentNode(segment)) {
          console.log('Not a SegmentNode');
          return undefined;
        }
        
        const wordData = {
          word: node.getTextContent(),
          startTime: node.getStartTime(),
          endTime: node.getEndTime(),
          wordIndex: node.getWordIndex(),
          segmentId: segment.getSegmentId(),
          segmentStartTime: segment.getStartTime(),
          segmentEndTime: segment.getEndTime(),
          speaker: segment.getSpeaker(),
          fileName: files[node.getFileId()]?.name || 'unknown',
          fileId: node.getFileId()
        };
        console.log('Word data:', wordData);
        return wordData;
      }).filter((word): word is NonNullable<typeof word> => word !== undefined);
    });
    
    const clipboardData = selectedWords
      .map(wordData => {
        const wordInfo = [
          wordData.word,
          wordData.startTime,
          wordData.endTime,
          wordData.wordIndex
        ].join(',');
    
        const segmentInfo = [
          wordData.segmentId,
          wordData.segmentStartTime,
          wordData.segmentEndTime,
          wordData.speaker
        ].join(',');
    
        const fileInfo = [
          wordData.fileName,
          wordData.fileId
        ].join(',');
    
        const dataString = [wordInfo, segmentInfo, fileInfo].join('|');
        console.log('Data string for word:', dataString);
        return dataString;
      })
      .join(' ');
    
    console.log('Final clipboard data:', clipboardData);
    const papercutEditor = getActivePaperCutEditor();
    console.log('Active PaperCut editor:', papercutEditor);
    console.log('Clipboard data:', clipboardData);
    if (papercutEditor) {
      // Pass true for appendToEnd
      handlePaste(clipboardData, papercutEditor, files, true);
      return true;
    }
    return false;
  }, [editor, getActivePaperCutEditor, files]);
  
  const handleInsertToPaperCut = useCallback((): boolean => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false;
  
    const nodes = selection.getNodes();
    const wordNodes = nodes.filter($isWordNode);
    
    if (wordNodes.length === 0) return false;
  
    const selectedWords = editor.getEditorState().read(() => {
      return wordNodes.map(node => {
        const segment = node.getParent();
        if (!$isSegmentNode(segment)) {
          return undefined;
        }
        
        return {
          word: node.getTextContent(),
          startTime: node.getStartTime(),
          endTime: node.getEndTime(),
          wordIndex: node.getWordIndex(),
          segmentId: segment.getSegmentId(),
          segmentStartTime: segment.getStartTime(),
          segmentEndTime: segment.getEndTime(),
          speaker: segment.getSpeaker(),
          fileName: files[node.getFileId()]?.name || 'unknown',
          fileId: node.getFileId()
        } as const;
      }).filter((word): word is NonNullable<typeof word> => word !== undefined);
    });
  
    const clipboardData = selectedWords
      .map(wordData => {
        const wordInfo = [
          wordData.word,
          wordData.startTime,
          wordData.endTime,
          wordData.wordIndex
        ].join(',');
  
        const segmentInfo = [
          wordData.segmentId,
          wordData.segmentStartTime,
          wordData.segmentEndTime,
          wordData.speaker
        ].join(',');
  
        const fileInfo = [
          wordData.fileName,
          wordData.fileId
        ].join(',');
  
        return [wordInfo, segmentInfo, fileInfo].join('|');
      })
      .join(' ');
  
    const papercutEditor = getActivePaperCutEditor();
    if (papercutEditor) {
      handlePaste(clipboardData, papercutEditor, files, false);
      return true;
    }
    return false;
  }, [editor, getActivePaperCutEditor, files]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener((payload) => {
        payload.editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand<TextFormatType>(
        FORMAT_TEXT_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.formatText(payload);
          }
          return true;
        },
        LowPriority
      ),
      editor.registerCommand<void>(
        ADD_TO_PAPERCUT_COMMAND,
        () => {
          return handleAddToPaperCut();
        },
        LowPriority
      ),
      editor.registerCommand<void>(
        INSERT_TO_PAPERCUT_COMMAND,
        () => {
          return handleInsertToPaperCut();
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar, applyStyleText, handleAddToPaperCut, handleInsertToPaperCut]);
 
  function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
  return (
    <div className="toolbar flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" ref={toolbarRef}>
    <div className="flex items-center gap-1 mr-2">
      <button
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        aria-label="Undo"
      >
        <Undo size={18} />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        aria-label="Redo"
      >
        <Redo size={18} />
      </button>
    </div>
  
      <Divider className="h-6 w-[1px] bg-border" />
  
      <div className="flex items-center gap-1 mx-2">
      <button
  onClick={() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }}
  className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
  aria-label="Format Bold"
>
  <Bold className="h-4 w-4" />
</button>

<button
  onClick={() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
  }}
  className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
  aria-label="Format Italic"
>
  <Italic className="h-4 w-4" />
</button>

<button
  onClick={() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
  }}
  className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
  aria-label="Format Underline"
>
  <Underline className="h-4 w-4" />
</button>

<button
  onClick={() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
  }}
  className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
  aria-label="Format Strikethrough"
>
  <Strikethrough className="h-4 w-4" />
</button>

      </div>
  
      <Divider className="h-6 w-[1px] bg-border" />
  
      <div className="flex items-center gap-1 mx-2">
      <button
  onClick={() => applyHighlight(HIGHLIGHT_GREEN)}
  className={`toolbar-item h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
    ${isGreenHighlight ? "bg-accent text-accent-foreground" : ""}`}
  aria-label="Highlight Green"
>
  <span className="h-4 w-4 flex items-center justify-center text-xs font-medium rounded bg-[#ADFF2F] text-black">G</span>
</button>

<button
  onClick={() => applyHighlight(HIGHLIGHT_RED)}
  className={`toolbar-item h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
    ${isRedHighlight ? "bg-accent text-accent-foreground" : ""}`}
  aria-label="Highlight Red"
>
  <span className="h-4 w-4 flex items-center justify-center text-xs font-medium rounded bg-[#FF6347] text-black">R</span>
      </button>

            </div>
        
            <Divider className="h-6 w-[1px] bg-border" />
        
            <div className="flex items-center gap-2 ml-2">
            <button
        onClick={() => editor.dispatchCommand(ADD_TO_PAPERCUT_COMMAND, undefined)}
        disabled={!hasValidSelection}
        className={`toolbar-item h-8 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium
          ${hasValidSelection 
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" 
            : "opacity-50 cursor-not-allowed"}`}
        aria-label="Add to PaperCut"
      >
        <svg 
          viewBox="0 0 24 24" 
          width="16" 
          height="16" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
          className="mr-1"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add
      </button>

      <button
        onClick={() => editor.dispatchCommand(INSERT_TO_PAPERCUT_COMMAND, undefined)}
        disabled={!hasValidSelection}
        className={`toolbar-item h-8 px-3 inline-flex items-center justify-center rounded-md text-sm font-medium
          ${hasValidSelection 
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" 
            : "opacity-50 cursor-not-allowed"}`}
        aria-label="Insert into PaperCut"
      >
        <span className="mr-1 text-base leading-none">^</span>
        Insert
      </button>
      </div>
    </div>
  );
}
