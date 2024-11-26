'use client'

import React, { useCallback, useMemo, useEffect } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { CopyPastePlugin } from '@/app/plugins/CopyPastePlugin';
import { WordHoverPlugin } from '@/app/plugins/WordHoverPlugin';
import { EditRestrictionPlugin } from '@/app/plugins/EditRestrictionPlugin';
import PaperCutToolbarPlugin from '@/app/plugins/PaperCutToolbarPlugin';
import { useEditors } from '@/app/contexts/EditorContext';

interface LexicalEditorProps {
  initialState: string | null;
  onChange: (state: string) => void;
  tabId: string;
}

function AutoFocus() {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Focus the editor on mount
    editor.focus();
  }, [editor]);

  return null;
}

function LexicalEditorComponent({ initialState, onChange, tabId }: LexicalEditorProps) {
  const { registerPaperCutEditor, unregisterPaperCutEditor } = useEditors();

  const handleLexicalEditorRef = useCallback(
    (editor: LexicalEditorType | null) => {
      console.log(`handleLexicalEditorRef called for tab: ${tabId}, editor: ${editor ? 'exists' : 'null'}`);
      if (editor !== null) {
        console.log(`LexicalEditor: Registering editor for tab: ${tabId}`);
        registerPaperCutEditor(tabId, editor);
      }
    },
    [registerPaperCutEditor, tabId]
  );
  
  useEffect(() => {
    return () => {
      console.log(`Unregistering editor for tab: ${tabId}`);
      unregisterPaperCutEditor(tabId);
    };
  }, [unregisterPaperCutEditor, tabId]);

  const handleChange = useCallback((editorState: EditorState) => {
    onChange(JSON.stringify(editorState));
  }, [onChange]);

  const editorConfig = useMemo(() => ({
    namespace: `PaperCutEditor-${tabId}`,
    onError: (error: Error) => console.error(error),
    editorState: initialState,
    editorRef: handleLexicalEditorRef,
    nodes: [
      PaperCutWordNode,
      PaperCutSpeakerNode,
      PaperCutSegmentNode
    ]
  }), [initialState, handleLexicalEditorRef, tabId]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container relative">
        <AutoFocus />
        <PaperCutToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable 
              className="editor-input min-h-[200px] p-4 outline-none" 
              spellCheck={false}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              suppressContentEditableWarning
            />
          }
          placeholder={<div className="editor-placeholder">Enter some text...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <CopyPastePlugin />
        <OnChangePlugin onChange={handleChange} />
        <WordHoverPlugin />
        <EditRestrictionPlugin />
      </div>
    </LexicalComposer>
  );
}

// Use displayName to help with debugging
LexicalEditorComponent.displayName = 'LexicalEditor';

export const LexicalEditor = React.memo(LexicalEditorComponent);