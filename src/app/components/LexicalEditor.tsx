'use client'

import React, { useCallback, useMemo, useEffect, useRef } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditorState, LexicalEditor as LexicalEditorType, $getRoot, NodeKey } from 'lexical';
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

interface InitialStatePluginProps {
  initialState: string | null;
  tabId: string;
}

function traverseNodes(root: any, tabId: string) {
  // Use Lexical's node traversal methods
  root.getChildren().forEach((child: any) => {
    if (child.getType() === 'papercut-word') {
      console.log(`Processing node with tabId: ${tabId}`);
    }
    // Recursively traverse if there are children
    if (child.getChildren) {
      traverseNodes(child, tabId);
    }
  });
}

function InitialStatePlugin({ initialState, tabId }: InitialStatePluginProps): null {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (initialState) {
      try {
        const parsedState = editor.parseEditorState(initialState);
        editor.update(() => {
          const editorState = parsedState.toJSON();
          if (editorState.root?.children) {
            editorState.root.children.forEach((node: any) => {
              if (node.__type === 'papercut-word') {
                node.fileId = tabId;
              }
            });
          }
          const updatedState = editor.parseEditorState(JSON.stringify(editorState));
          editor.setEditorState(updatedState);
        });
      } catch (error) {
        console.error('Error parsing initial state:', error);
      }
    }
  }, [editor, initialState, tabId]);

  return null;
}

function AutoFocus(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.focus();
  }, [editor]);
  return null;
}

function RegisterEditorPlugin({ onEditorCreated }: { onEditorCreated: (editor: LexicalEditorType) => void }): null {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    onEditorCreated(editor);
  }, [editor, onEditorCreated]);

  return null;
}

function LexicalEditorComponent({ initialState, onChange, tabId }: LexicalEditorProps): JSX.Element {
  const { registerPaperCutEditor, unregisterPaperCutEditor } = useEditors();
  const editorRef = useRef<LexicalEditorType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const floatingAnchorElem = containerRef.current;
  const isSmallWidthViewport = window.innerWidth < 768;

  const handleChange = useCallback((editorState: EditorState) => {
    const currentEditor = editorRef.current;
    if (currentEditor) {
      currentEditor.update(() => {
        const root = $getRoot();
        // Use our helper function to traverse the nodes
        traverseNodes(root, tabId);
      });
    }
    onChange(JSON.stringify(editorState));
  }, [onChange, tabId]);

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
    nodes: [
      PaperCutWordNode,
      PaperCutSpeakerNode,
      PaperCutSegmentNode,
      TextNode,
      PaperCutCursorNode
    ],
    editable: true,
    theme: {
      paragraph: 'PaperCutSegmentNode'
    }
  }), [tabId]);

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div ref={containerRef} className="papercut-editor-container">
        <InitialStatePlugin initialState={initialState} tabId={tabId} />
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

LexicalEditorComponent.displayName = 'LexicalEditor';

export const LexicalEditor = React.memo(LexicalEditorComponent);