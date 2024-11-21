// src/app/components/LexicalEditor.tsx

import React from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { CopyPastePlugin } from '@/app/plugins/CopyPastePlugin';
import { PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';

const editorConfig = {
  namespace: 'MyEditor',
  onError(error: Error) {
    console.error('Lexical error:', error);
  },
  nodes: [
    PaperCutWordNode,
    PaperCutSpeakerNode,
    PaperCutSegmentNode
  ]
};

interface LexicalEditorProps {
  content?: string;
  onChange?: (editorState: any) => void;
}

export function LexicalEditor({ content, onChange }: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">Paste your transcript here...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <AutoFocusPlugin />
        <CopyPastePlugin />
      </div>
    </LexicalComposer>
  );
}