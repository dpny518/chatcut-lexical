'use client'

import React, { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditorState, LexicalEditor as LexicalEditorType, $getRoot } from 'lexical';
import { $createPaperCutWordNode, $isPaperCutWordNode, PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $isPaperCutSpeakerNode, PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $isPaperCutSegmentNode, PaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { WordHoverPlugin } from '@/app/plugins/WordHoverPlugin';
import { EditRestrictionPlugin } from '@/app/plugins/EditRestrictionPlugin';
import PaperCutToolbarPlugin from '@/app/plugins/PaperCutToolbarPlugin';
import { useEditors } from '@/app/contexts/EditorContext';
import { ClearEditorPlugin } from '@/app/plugins/ClearEditorPlugin';
import PaperCutEditorContent from './PaperCutEditorContent';
import { PaperCutDraggablePlugin } from '@/app/plugins/PaperCutDraggableBlockPlugin';
import { TextNode, LexicalNode, $isElementNode } from 'lexical';
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

function InitialStatePlugin({ initialState, tabId }: InitialStatePluginProps): null {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    if (initialState) {
      try {
        // First parse into an object to manipulate
        const stateObj = JSON.parse(initialState);
        
        // Deep traverse the state object to ensure all PaperCutWordNodes have fileId
        const processNode = (node: any) => {
          if (node.__type === 'papercut-word') {
            node.fileId = tabId;
          }
          if (node.children) {
            node.children.forEach(processNode);
          }
        };

        if (stateObj.root?.children) {
          stateObj.root.children.forEach(processNode);
        }

        // Now create editor state from the modified object
        const updatedState = editor.parseEditorState(JSON.stringify(stateObj));
        editor.setEditorState(updatedState);
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

  // Add state for anchor element
  const [anchorElem, setAnchorElem] = useState<HTMLElement | null>(null);

  // Set anchor element after mount
  useEffect(() => {
    if (containerRef.current) {
      setAnchorElem(containerRef.current);
      console.log('Container ref set:', containerRef.current);
    }
  }, []);

  useEffect(() => {
    console.log('containerRef changed:', containerRef.current);
  }, [containerRef.current]);

  useEffect(() => {
    console.log('Debug: PaperCutDraggablePlugin render attempt', {
      containerRef: containerRef.current,
      anchorElem,
      timestamp: new Date().toISOString()
    });
  }, [containerRef.current, anchorElem]);

  const handleChange = useCallback((editorState: EditorState) => {
    const currentEditor = editorRef.current;
    if (currentEditor) {
      currentEditor.update(() => {
        const root = $getRoot();
        root.getChildren().forEach((child: LexicalNode) => {
          if (child.getType() === 'papercut-word') {
            console.log(`Processing node with tabId: ${tabId}`);
          }
        });
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
      <div 
        ref={containerRef} 
        className="papercut-editor-container"
        style={{ 
          position: 'relative',
          minHeight: '100px' // Add minimum height
        }}
      >
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
        {/* Only render when we have an anchor element */}
        {anchorElem && (
          <PaperCutDraggablePlugin anchorElem={anchorElem} />
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