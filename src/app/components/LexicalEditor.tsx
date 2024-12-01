'use client'

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';
import { $isPaperCutWordNode, PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $isPaperCutSpeakerNode, PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $isPaperCutSegmentNode, PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { WordHoverPlugin } from '@/app/plugins/WordHoverPlugin';
import { EditRestrictionPlugin } from '@/app/plugins/EditRestrictionPlugin';
import PaperCutToolbarPlugin from '@/app/plugins/PaperCutToolbarPlugin';
import { useEditors } from '@/app/contexts/EditorContext';
import { ClearEditorPlugin } from '@/app/plugins/ClearEditorPlugin';
import PaperCutEditorContent from './PaperCutEditorContent';
import { PaperCutDraggablePlugin } from '@/app/plugins/PaperCutDraggableBlockPlugin';
import { TextNode } from 'lexical';
import { PaperCutEnterPlugin } from '@/app/plugins/PaperCutEnterPlugin';
import '@/styles/papercutEditor.css';
import { PaperCutCursorPlugin } from '@/app/plugins/PaperCutCursorPlugin';
import { PaperCutCursorNode } from '@/app/nodes/PaperCutCursorNode';
import PaperCutPastePlugin from '@/app/plugins/PaperCutPastePlugin';

interface LexicalEditorProps {
  initialState: string | null;
  onChange: (state: string) => void;
  tabId: string;
}

function InitialStatePlugin({ initialState }: { initialState: string | null }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (initialState) {
      const parsedState = editor.parseEditorState(initialState);
      editor.setEditorState(parsedState);
    }
  }, [editor, initialState]);

  return null;
}

function AutoFocus() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.focus();
  }, [editor]);
  return null;
}

function LexicalEditorComponent({ initialState, onChange, tabId }: LexicalEditorProps) {
  const { registerPaperCutEditor, unregisterPaperCutEditor } = useEditors();
  const editorRef = useRef<LexicalEditorType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingAnchorElem = containerRef.current;
  const isSmallWidthViewport = window.innerWidth < 768;

  const handleChange = useCallback((editorState: EditorState) => {
    onChange(JSON.stringify(editorState));
  }, [onChange]);

  const handleEditorCreation = useCallback((editor: LexicalEditorType) => {
    console.log(`LexicalEditor: Editor created for tab ${tabId}`);
    editorRef.current = editor;
    registerPaperCutEditor(tabId, editor);
  }, [registerPaperCutEditor, tabId]);

  useEffect(() => {
    return () => {
      console.log(`LexicalEditor: Cleaning up editor for tab ${tabId}`);
      if (editorRef.current) {
        unregisterPaperCutEditor(tabId);
        editorRef.current = null;
      }
    };
  }, [unregisterPaperCutEditor, tabId]);

  const editorConfig = useMemo(() => ({
    namespace: `PaperCutEditor-${tabId}`,
    onError: (error: Error) => {
      const errorMessage = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
      console.error('Lexical Editor Error:', errorMessage);
    },
    // Remove initialState from config, we'll handle it with InitialStatePlugin
    nodes: [
      PaperCutWordNode,
      PaperCutSpeakerNode,
      PaperCutSegmentNode,
      TextNode,
      PaperCutCursorNode
    ],
    editable: true
  }), [tabId]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div ref={containerRef} className="papercut-editor-container PaperCutSegmentNode">
        <InitialStatePlugin initialState={initialState} />
        <AutoFocus />
        <PaperCutToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="papercut-editor-input"
              spellCheck={false}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              suppressContentEditableWarning
            />
          }
          placeholder={
            <div className="papercut-editor-placeholder">
              Paste transcript content here...
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <OnChangePlugin onChange={handleChange} />
        <WordHoverPlugin />
        <EditRestrictionPlugin />
        <ClearEditorPlugin />
        <PaperCutEditorContent />
        {floatingAnchorElem && !isSmallWidthViewport && (
          <PaperCutDraggablePlugin anchorElem={floatingAnchorElem} />
        )}
        <PaperCutEnterPlugin />
        <PaperCutPastePlugin />
        <RegisterEditorPlugin onEditorCreated={handleEditorCreation} />
      </div>
    </LexicalComposer>
  );
}

function RegisterEditorPlugin({ onEditorCreated }: { onEditorCreated: (editor: LexicalEditorType) => void }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    onEditorCreated(editor);
  }, [editor, onEditorCreated]);

  return null;
}

LexicalEditorComponent.displayName = 'LexicalEditor';

export const LexicalEditor = React.memo(LexicalEditorComponent);