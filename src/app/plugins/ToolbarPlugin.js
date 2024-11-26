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

function Divider() {
  return <div className="divider" />;
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
      const hasWordNodes = nodes.some($isPaperCutWordNode);
      const activePaperCutEditor = getActivePaperCutEditor();
      console.log('Updating toolbar:');
      console.log('- Has word nodes:', hasWordNodes);
      console.log('- Active PaperCut editor:', activePaperCutEditor);
      console.log('- Selection:', selection);
      console.log('- Nodes:', nodes.map(node => node.getType()));
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
  }, [editor, getActivePaperCutEditor]);

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
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        FORMAT_GREEN_HIGHLIGHT,
        () => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const currentBgColor = $getSelectionStyleValueForProperty(selection, 'background-color', null);
            applyStyleText({
              'background-color': currentBgColor === HIGHLIGHT_GREEN ? null : HIGHLIGHT_GREEN
            }, false);
          }
          return true;
        },
        LowPriority
      ),
      editor.registerCommand(
        FORMAT_RED_HIGHLIGHT,
        () => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const currentBgColor = $getSelectionStyleValueForProperty(selection, 'background-color', null);
            applyStyleText({
              'background-color': currentBgColor === HIGHLIGHT_RED ? null : HIGHLIGHT_RED
            }, false);
          }
          return true;
        },
        LowPriority
      ),
      editor.registerCommand(
        ADD_TO_PAPERCUT_COMMAND,
        () => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;
      
          const nodes = selection.getNodes();
          const selectedContent = nodes
            .filter($isPaperCutWordNode)
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
        },
        LowPriority
      )
    );
  }, [editor, updateToolbar, applyStyleText]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND)}
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <i className="format undo" />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND)}
        className="toolbar-item"
        aria-label="Redo"
      >
        <i className="format redo" />
      </button>
      <Divider />
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={`toolbar-item spaced ${isBold ? "active" : ""}`}
        aria-label="Format Bold"
      >
        <i className="format bold" />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`toolbar-item spaced ${isItalic ? "active" : ""}`}
        aria-label="Format Italics"
      >
        <i className="format italic" />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={`toolbar-item spaced ${isUnderline ? "active" : ""}`}
        aria-label="Format Underline"
      >
        <i className="format underline" />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        className={`toolbar-item spaced ${isStrikethrough ? "active" : ""}`}
        aria-label="Format Strikethrough"
      >
        <i className="format strikethrough" />
      </button>
      <Divider />
      <button
        onClick={() => editor.dispatchCommand(FORMAT_GREEN_HIGHLIGHT)}
        className={`toolbar-item spaced ${isGreenHighlight ? "active" : ""}`}
        aria-label="Highlight Green"
      >
        <i className="format highlight-green" style={{ backgroundColor: HIGHLIGHT_GREEN, color: 'black' }}>G</i>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_RED_HIGHLIGHT)}
        className={`toolbar-item spaced ${isRedHighlight ? "active" : ""}`}
        aria-label="Highlight Red"
      >
        <i className="format highlight-red" style={{ backgroundColor: HIGHLIGHT_RED, color: 'black' }}>R</i>
      </button>
      <Divider />
      <button
       onClick={() => {
        console.log('Add to PaperCut button clicked, hasValidSelection:', hasValidSelection);
        editor.dispatchCommand(ADD_TO_PAPERCUT_COMMAND);
      }}
      className={`toolbar-item spaced ${hasValidSelection ? 'active' : ''}`}
      disabled={!hasValidSelection}
      aria-label="Add to PaperCut"
      >
        <i className="format add-to-papercut">
          <svg 
            viewBox="0 0 24 24" 
            width="16" 
            height="16" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </i>
        <span className="text">+PaperCut</span>
      </button>
    </div>
  );
}