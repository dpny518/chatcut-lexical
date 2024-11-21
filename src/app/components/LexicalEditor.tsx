// src/app/components/LexicalEditor.tsx
import React, { useCallback, useMemo } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { EditorState } from 'lexical';
import { PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { CopyPastePlugin } from '@/app/plugins/CopyPastePlugin';
import { WordHoverPlugin } from '@/app/plugins/WordHoverPlugin';

const editorConfig = {
  namespace: 'PaperCutEditor',
  onError: (error: Error) => console.error(error),
  nodes: [
    PaperCutWordNode,
    PaperCutSpeakerNode,
    PaperCutSegmentNode
  ]
};

interface LexicalEditorProps {
  initialState: string | null;
  onChange: (state: string) => void;
}

function LexicalEditorComponent({ initialState, onChange }: LexicalEditorProps) {
  const handleChange = useCallback((editorState: EditorState) => {
    // Serialize the entire editor state to a string
    onChange(JSON.stringify(editorState));
  }, [onChange]);

  const memoizedEditorConfig = useMemo(() => ({
    ...editorConfig,
    editorState: initialState,
  }), [initialState]);

  return (
    <LexicalComposer initialConfig={memoizedEditorConfig}>
      <div className="editor-container">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">Enter some text...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <CopyPastePlugin />
        <OnChangePlugin onChange={handleChange} />
        <WordHoverPlugin />
      </div>
    </LexicalComposer>
  );
}

export const LexicalEditor = React.memo(LexicalEditorComponent);