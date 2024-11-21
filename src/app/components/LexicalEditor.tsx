// src/app/components/LexicalEditor.tsx
import React, { useEffect, useCallback } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, EditorState } from 'lexical';
import { PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { CopyPastePlugin } from '@/app/plugins/CopyPastePlugin';

const editorConfig = {
  namespace: 'PaperCutEditor',
  onError: (error: Error) => console.error(error),
  nodes: [
    PaperCutWordNode,
    PaperCutSpeakerNode,
    PaperCutSegmentNode
  ]
};

function InitialContentPlugin({ content }: { content: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      if (root.getTextContent() !== content) {
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(content));
        root.append(paragraph);
      }
    });
  }, [editor, content]);

  return null;
}

interface LexicalEditorProps {
  content: string;
  onChange: (content: string) => void;
}

function LexicalEditorComponent({ content, onChange }: LexicalEditorProps) {
  const handleChange = useCallback((editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      onChange(root.getTextContent());
    });
  }, [onChange]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">Enter some text...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <CopyPastePlugin />
        <OnChangePlugin onChange={handleChange} />
        <InitialContentPlugin content={content} />
      </div>
    </LexicalComposer>
  );
}

export const LexicalEditor = React.memo(LexicalEditorComponent);