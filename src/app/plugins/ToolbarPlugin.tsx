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
  createCommand,
  EditorState,
  LexicalEditor,
  TextFormatType,
} from "lexical";
import { $isWordNode } from '@/app/nodes/WordNode';
import { $getSelectionStyleValueForProperty, $patchStyleText } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { useEditors } from '@/app/contexts/EditorContext';
import '@/styles/toolbar.css';
import { useActiveEditor } from '@/app/components/RightPanel/ActiveEditorContext';

interface DividerProps {
  className?: string;
}

interface StyleObject {
  [key: string]: string | null;
}

const LowPriority = 1;
const ADD_TO_PAPERCUT_COMMAND = createCommand<void>('ADD_TO_PAPERCUT_COMMAND');
const INSERT_TO_PAPERCUT_COMMAND = createCommand<void>('INSERT_TO_PAPERCUT_COMMAND');

function Divider({ className = "" }: DividerProps) {
  return <div className={`h-6 w-[1px] bg-border ${className}`} />;
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const { getActivePaperCutEditor } = useActiveEditor();
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

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const nodes = selection.getNodes();
      const hasWordNodes = nodes.some($isWordNode);
      const activePaperCutEditor = getActivePaperCutEditor();
      
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
      setHasValidSelection(false);
      
      // Reset all states when there's no selection
      setIsBold(false);
      setIsItalic(false);
      setIsUnderline(false);
      setIsStrikethrough(false);
      setIsGreenHighlight(false);
      setIsRedHighlight(false);
    }
    return false;
  }, [getActivePaperCutEditor]);

  const applyStyleText = useCallback(
    (styles: StyleObject) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
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
          });
        }
      });
    },
    [editor, applyStyleText]
  );

  const handleAddToPaperCut = useCallback((): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
  
    const range = selection.getRangeAt(0);
    const selectedNodes = getSelectedNodes(range);
    
    if (selectedNodes.length === 0) return false;
  
    const clipboardData = getClipboardDataFromNodes(selectedNodes);
    const papercutEditor = getActivePaperCutEditor();
    if (papercutEditor) {
      papercutEditor.addContentAtEnd(clipboardData);
      return true;
    }
    return false;
  }, [getActivePaperCutEditor]);
  const handleInsertToPaperCut = useCallback((): boolean => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
  
    const range = selection.getRangeAt(0);
    const selectedNodes = getSelectedNodes(range);
    
    if (selectedNodes.length === 0) return false;
  
    const clipboardData = getClipboardDataFromNodes(selectedNodes);
  
    const papercutEditor = getActivePaperCutEditor();
    if (papercutEditor) {
      papercutEditor.addContentAtCursor(clipboardData);
      return true;
    }
    return false;
  }, [getActivePaperCutEditor]);

  
  // Helper function to get selected nodes
  const getSelectedNodes = (range: Range): Element[] => {
    const nodes: Element[] = [];
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node: Node) => {
          if (node.nodeType === Node.ELEMENT_NODE && 
              (node as Element).hasAttribute('data-word-metadata') &&
              range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
  
    let node: Node | null;
    while (node = walker.nextNode()) {
      nodes.push(node as Element);
    }
  
    return nodes;
  };
  
  const getClipboardDataFromNodes = (nodes: Element[]): string => {
    return nodes.map(node => node.getAttribute('data-word-metadata'))
                .filter((data): data is string => data !== null)
                .join(' ');
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        editor.getEditorState().read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(SELECTION_CHANGE_COMMAND, updateToolbar, LowPriority),
      editor.registerCommand(CAN_UNDO_COMMAND, (payload) => {
        setCanUndo(payload);
        return false;
      }, LowPriority),
      editor.registerCommand(CAN_REDO_COMMAND, (payload) => {
        setCanRedo(payload);
        return false;
      }, LowPriority),
      editor.registerCommand(ADD_TO_PAPERCUT_COMMAND, handleAddToPaperCut, LowPriority),
      editor.registerCommand(INSERT_TO_PAPERCUT_COMMAND, handleInsertToPaperCut, LowPriority)
    );
  }, [editor, updateToolbar, handleAddToPaperCut, handleInsertToPaperCut]);

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
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground ${isBold ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Format Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground ${isItalic ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Format Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground ${isUnderline ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Format Underline"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground ${isStrikethrough ? 'bg-accent text-accent-foreground' : ''}`}
          aria-label="Format Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
      </div>

      <Divider className="h-6 w-[1px] bg-border" />

      <div className="flex items-center gap-1 mx-2">
        <button
          onClick={() => applyHighlight(HIGHLIGHT_GREEN)}
          className={`toolbar-item h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground ${isGreenHighlight ? "bg-accent text-accent-foreground" : ""}`}
          aria-label="Highlight Green"
        >
          <span className="h-4 w-4 flex items-center justify-center text-xs font-medium rounded bg-[#ADFF2F] text-black">G</span>
        </button>
        <button
          onClick={() => applyHighlight(HIGHLIGHT_RED)}
          className={`toolbar-item h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground ${isRedHighlight ? "bg-accent text-accent-foreground" : ""}`}
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