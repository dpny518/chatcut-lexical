'use client'

import React, { useCallback, useMemo, useEffect } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';
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

function LexicalEditorComponent({ initialState, onChange, tabId }: LexicalEditorProps) {
  const { registerPaperCutEditor, unregisterPaperCutEditor } = useEditors();

  const handleLexicalEditorRef = useCallback(
    (editor: LexicalEditorType | null) => {
      if (editor !== null) {
        registerPaperCutEditor(tabId, editor);
      }
    },
    [registerPaperCutEditor, tabId]
  );

  useEffect(() => {
    return () => {
      unregisterPaperCutEditor(tabId);
    };
  }, [unregisterPaperCutEditor, tabId]);

  const handleChange = useCallback((editorState: EditorState) => {
    onChange(JSON.stringify(editorState));
  }, [onChange]);

  const editorConfig = useMemo(() => ({
    namespace: `PaperCutEditor-${tabId}`, // Make namespace unique per editor
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