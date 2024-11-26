'use client';

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
  $createParagraphNode,
  createCommand
} from "lexical";
import { $isPaperCutWordNode, $createPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText
} from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { useEditors } from '@/app/contexts/EditorContext';

const LowPriority = 1;
const ADD_TO_PAPERCUT_COMMAND = createCommand('ADD_TO_PAPERCUT_COMMAND');
const INSERT_TO_PAPERCUT_COMMAND = createCommand('INSERT_TO_PAPERCUT_COMMAND');


function Divider({ className = "" }) {
  return <div className={`h-6 w-[1px] bg-border ${className}`} />;
}

function isWordNode(node) {
  return node.getType() === 'word' || $isPaperCutWordNode(node);
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const { getActivePaperCutEditor } = useEditors();
  const toolbarRef = useRef(null);

  // Basic editor states
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  // Highlight states
  const [isGreenHighlight, setIsGreenHighlight] = useState(false);
  const [isRedHighlight, setIsRedHighlight] = useState(false);
  const [hasValidSelection, setHasValidSelection] = useState(false);

  const HIGHLIGHT_GREEN = '#ADFF2F';
  const HIGHLIGHT_RED = '#FF6347';
  const FORMAT_GREEN_HIGHLIGHT = 'format_green_highlight';
  const FORMAT_RED_HIGHLIGHT = 'format_red_highlight';

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const nodes = selection.getNodes();
      const hasWordNodes = nodes.some(isWordNode);
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
      const bgColor = $getSelectionStyleValueForProperty(selection, 'background-color', null);
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
    (styles, skipHistoryStack) => {
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

  const handleAddToPaperCut = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false;

    const nodes = selection.getNodes();
    const selectedContent = nodes
      .filter(isWordNode)
      .map(node => ({
        text: node.getTextContent(),
        startTime: node.getStartTime(),
        endTime: node.getEndTime(),
        segmentId: node.getSegmentId(),
        speaker: node.getSpeaker(),
        fileId: node.getFileId(),
        wordIndex: node.getWordIndex()
      }));

    if (selectedContent.length === 0) return false;

    const papercutEditor = getActivePaperCutEditor();
    
    if (papercutEditor) {
      papercutEditor.update(() => {
        const root = $getRoot();
        let currentSpeaker = '';
        let paragraphNode = $createParagraphNode();

        selectedContent.forEach((word) => {
          if (word.speaker !== currentSpeaker) {
            currentSpeaker = word.speaker;
            
            if (paragraphNode.getTextContent()) {
              root.append(paragraphNode);
              paragraphNode = $createParagraphNode();
            }

            const speakerNameNode = $createTextNode(`${word.speaker}: `);
            speakerNameNode.toggleFormat('bold');
            paragraphNode.append(speakerNameNode);
          }

          const wordNode = $createPaperCutWordNode(
            word.text,
            word.startTime,
            word.endTime,
            word.segmentId,
            word.speaker,
            word.fileId,
            word.wordIndex
          );
          paragraphNode.append(wordNode);
          paragraphNode.append($createTextNode(' '));
        });

        if (paragraphNode.getTextContent()) {
          root.append(paragraphNode);
        }
      });
    }
    return true;
  }, [getActivePaperCutEditor]);

  const handleInsertToPaperCut = useCallback(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return false;

    const nodes = selection.getNodes();
    const selectedContent = nodes
      .filter(isWordNode)
      .map(node => ({
        text: node.getTextContent(),
        startTime: node.getStartTime(),
        endTime: node.getEndTime(),
        segmentId: node.getSegmentId(),
        speaker: node.getSpeaker(),
        fileId: node.getFileId(),
        wordIndex: node.getWordIndex()
      }));

    if (selectedContent.length === 0) return false;

    const papercutEditor = getActivePaperCutEditor();
    
    if (papercutEditor) {
      papercutEditor.update(() => {
        const selection = $getSelection();
        if (!selection) {
          // If no selection, do nothing
          return;
        }

        let currentSpeaker = '';
        let paragraphNode = selection.anchor.getNode();
        
        // If we're not in a paragraph, create one
        if (!paragraphNode.getType() === 'paragraph') {
          paragraphNode = $createParagraphNode();
          selection.insertNodes([paragraphNode]);
        }

        const contentNodes = [];
        selectedContent.forEach((word) => {
          if (word.speaker !== currentSpeaker) {
            currentSpeaker = word.speaker;
            
            if (contentNodes.length > 0) {
              contentNodes.push($createTextNode(' '));
            }

            const speakerNameNode = $createTextNode(`${word.speaker}: `);
            speakerNameNode.toggleFormat('bold');
            contentNodes.push(speakerNameNode);
          }

          const wordNode = $createPaperCutWordNode(
            word.text,
            word.startTime,
            word.endTime,
            word.segmentId,
            word.speaker,
            word.fileId,
            word.wordIndex
          );
          contentNodes.push(wordNode);
          contentNodes.push($createTextNode(' '));
        });

        selection.insertNodes(contentNodes);
      });
    }
    return true;
  }, [getActivePaperCutEditor]);
  
  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(CAN_UNDO_COMMAND, setCanUndo, LowPriority),
      editor.registerCommand(CAN_REDO_COMMAND, setCanRedo, LowPriority),
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // Apply the format
            selection.formatText(payload);
          }
          return true;
        },
        LowPriority
      ),
      editor.registerCommand(FORMAT_GREEN_HIGHLIGHT, () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const currentBgColor = $getSelectionStyleValueForProperty(selection, 'background-color', null);
          applyStyleText({
            'background-color': currentBgColor === HIGHLIGHT_GREEN ? null : HIGHLIGHT_GREEN
          }, false);
        }
        return true;
      }, LowPriority),
      editor.registerCommand(FORMAT_RED_HIGHLIGHT, () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const currentBgColor = $getSelectionStyleValueForProperty(selection, 'background-color', null);
          applyStyleText({
            'background-color': currentBgColor === HIGHLIGHT_RED ? null : HIGHLIGHT_RED
          }, false);
        }
        return true;
      }, LowPriority),
      editor.registerCommand(ADD_TO_PAPERCUT_COMMAND, handleAddToPaperCut, LowPriority),
      editor.registerCommand(INSERT_TO_PAPERCUT_COMMAND, handleInsertToPaperCut, LowPriority)
    );
  }, [editor, updateToolbar, applyStyleText, handleAddToPaperCut, handleInsertToPaperCut]);

  return (
    <div className="toolbar flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" ref={toolbarRef}>
      <div className="flex items-center gap-1 mr-2">
        <button
          disabled={!canUndo}
          onClick={() => editor.dispatchCommand(UNDO_COMMAND)}
          className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          aria-label="Undo"
        >
          <i className="format undo" />
        </button>
        <button
          disabled={!canRedo}
          onClick={() => editor.dispatchCommand(REDO_COMMAND)}
          className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          aria-label="Redo"
        >
          <i className="format redo" />
        </button>
      </div>
  
      <Divider className="h-6 w-[1px] bg-border" />
  
      <div className="flex items-center gap-1 mx-2">
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground 
            ${isBold ? "bg-accent text-accent-foreground" : ""}`}
          aria-label="Format Bold"
        >
          <i className="format bold" />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
            ${isItalic ? "bg-accent text-accent-foreground" : ""}`}
          aria-label="Format Italics"
        >
          <i className="format italic" />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
            ${isUnderline ? "bg-accent text-accent-foreground" : ""}`}
          aria-label="Format Underline"
        >
          <i className="format underline" />
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
            ${isStrikethrough ? "bg-accent text-accent-foreground" : ""}`}
          aria-label="Format Strikethrough"
        >
          <i className="format strikethrough" />
        </button>
      </div>
  
      <Divider className="h-6 w-[1px] bg-border" />
  
      <div className="flex items-center gap-1 mx-2">
        <button
          onClick={() => editor.dispatchCommand(FORMAT_GREEN_HIGHLIGHT)}
          className={`toolbar-item h-8 px-2 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
            ${isGreenHighlight ? "bg-accent text-accent-foreground" : ""}`}
          aria-label="Highlight Green"
        >
          <span className="h-4 w-4 flex items-center justify-center text-xs font-medium rounded bg-[#ADFF2F] text-black">G</span>
        </button>
        <button
          onClick={() => editor.dispatchCommand(FORMAT_RED_HIGHLIGHT)}
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
          onClick={() => editor.dispatchCommand(ADD_TO_PAPERCUT_COMMAND)}
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
          onClick={() => editor.dispatchCommand(INSERT_TO_PAPERCUT_COMMAND)}
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