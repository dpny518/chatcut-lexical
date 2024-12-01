'use client'

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
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
//import {PaperCutDraggablePlugin} from '@/app/plugins/PaperCutDraggableBlockPlugin';
import { CustomDraggableBlockPlugin } from '@/app/plugins/CustomDraggableBlockPlugin';

import { TextNode } from 'lexical';
import { PaperCutEnterPlugin } from '@/app/plugins/PaperCutEnterPlugin';
interface LexicalEditorProps {
  initialState: string | null;
  onChange: (state: string) => void;
  tabId: string;
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
  const containerRef = useRef<HTMLDivElement>(null); // Add this ref for the container
  const [editorAnchor, setEditorAnchor] = useState<HTMLElement | null>(null);

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

  useEffect(() => {
    const anchor = document.querySelector('.papercut-editor-input') as HTMLElement;
    setEditorAnchor(anchor);
  }, []);

  const editorConfig = useMemo(() => ({
    namespace: `PaperCutEditor-${tabId}`,
    onError: (error: Error) => {
      // Avoid logging the error object directly to prevent circular references
      const errorMessage = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
      console.error('Lexical Editor Error:', errorMessage);
    },
    editorState: initialState,
    nodes: [
      PaperCutWordNode,
      PaperCutSpeakerNode,
      PaperCutSegmentNode,
      TextNode
    ],
    editable: true
  }), [initialState, tabId]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div ref={containerRef} className="papercut-editor">
        <div className="px-8 relative">
          <AutoFocus />
          {initialState && <PaperCutToolbarPlugin />}
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="papercut-editor-input prose max-w-none min-h-[200px] p-4 outline-none relative overflow-wrap-break-word break-words"
                spellCheck={false}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                suppressContentEditableWarning
              />
            }
            placeholder={
              <div className="papercut-editor-placeholder absolute top-4 left-4 text-gray-400 select-none pointer-events-none">
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
          <PaperCutEnterPlugin />
          <PaperCutEnterPlugin />
          <CustomDraggableBlockPlugin/>
          <RegisterEditorPlugin onEditorCreated={handleEditorCreation} />
        </div>
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