'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  CAN_REDO_COMMAND, 
  CAN_UNDO_COMMAND, 
  REDO_COMMAND, 
  UNDO_COMMAND,
  CLEAR_EDITOR_COMMAND,
  $getRoot,
  LexicalNode,
  $createParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $createPaperCutSpeakerNode, $isPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { Undo, Redo, RefreshCw, Trash2 } from 'lucide-react';

// Create a custom command for clearing
export const PAPERCUT_CLEAR_COMMAND = createCommand('PAPERCUT_CLEAR_COMMAND');

function Divider() {
  return <div className="h-6 w-[1px] bg-border" />;
}

const PaperCutToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const updateToolbar = useCallback(() => {
    editor.getEditorState().read(() => {
      // Check if editor has content
      const root = $getRoot();
      setHasContent(root.getTextContentSize() > 0);
      
      // Check history state directly
      const historyState = (editor as any)._config.namespace ? 
        (window as any).__lexicalHistory__?.[editor._config.namespace] : null;
      
      if (historyState) {
        setCanUndo(historyState.undoStack.length > 0);
        setCanRedo(historyState.redoStack.length > 0);
      }
    });
  }, [editor]);

  const syncSpeakers = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const children = root.getChildren();
      
      let currentSpeaker = '';
      let currentParagraph = $createParagraphNode();
      const newContent: LexicalNode[] = [];
  
      children.forEach((child) => {
        if ($isPaperCutWordNode(child)) {
          const speaker = child.getSpeaker();
          if (speaker !== currentSpeaker) {
            if (currentParagraph.getChildrenSize() > 0) {
              newContent.push(currentParagraph);
              currentParagraph = $createParagraphNode();
            }
            
            currentSpeaker = speaker;
            const speakerNode = $createPaperCutSpeakerNode(speaker);
            currentParagraph.append(speakerNode);
          }
          currentParagraph.append(child.constructor.clone(child));
        } else if ($isPaperCutSpeakerNode(child)) {
          // Skip existing speaker nodes
        } else {
          currentParagraph.append(child.constructor.clone(child));
        }
      });
  
      if (currentParagraph.getChildrenSize() > 0) {
        newContent.push(currentParagraph);
      }
  
      root.clear();
      newContent.forEach((node) => root.append(node));
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand(
        PAPERCUT_CLEAR_COMMAND,
        () => {
          editor.update(() => {
            const root = $getRoot();
            root.getChildren().forEach(child => child.remove());
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          });
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor, updateToolbar]);

  return (
    <div className="toolbar flex items-center gap-1 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" ref={toolbarRef}>
      <div className="flex items-center gap-1 mr-2">
        <button
          disabled={!canUndo}
          onClick={() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground 
            ${!canUndo ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          disabled={!canRedo}
          onClick={() => {
            editor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
            ${!canRedo ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      <Divider />
      
      <button
        onClick={syncSpeakers}
        className="toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
        aria-label="Sync Speakers"
      >
        <RefreshCw className="h-4 w-4" />
      </button>

      <Divider />

      <button
        disabled={!hasContent}
        onClick={() => {
          editor.dispatchCommand(PAPERCUT_CLEAR_COMMAND, undefined);
        }}
        className={`toolbar-item h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground
          ${!hasContent ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label="Clear Editor"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

export default PaperCutToolbarPlugin;