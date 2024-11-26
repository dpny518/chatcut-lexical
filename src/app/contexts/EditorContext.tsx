// src/app/contexts/EditorContext.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react';
import { LexicalEditor } from 'lexical';
import { usePaperCut } from './PaperCutContext';

interface EditorContextType {
  transcriptEditor: LexicalEditor | null;
  paperCutEditors: { [tabId: string]: LexicalEditor };
  registerTranscriptEditor: (editor: LexicalEditor) => void;
  registerPaperCutEditor: (tabId: string, editor: LexicalEditor) => void;
  unregisterPaperCutEditor: (tabId: string) => void;
  getActivePaperCutEditor: () => LexicalEditor | null;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [transcriptEditor, setTranscriptEditor] = useState<LexicalEditor | null>(null);
  const [paperCutEditors, setPaperCutEditors] = useState<{ [tabId: string]: LexicalEditor }>({});
  const { activeTabId } = usePaperCut();

  const registerTranscriptEditor = useCallback((editor: LexicalEditor) => {
    setTranscriptEditor(editor);
  }, []);

  const registerPaperCutEditor = useCallback((tabId: string, editor: LexicalEditor) => {
    setPaperCutEditors(prev => ({
      ...prev,
      [tabId]: editor
    }));
  }, []);

  const unregisterPaperCutEditor = useCallback((tabId: string) => {
    setPaperCutEditors(prev => {
      const newEditors = { ...prev };
      delete newEditors[tabId];
      return newEditors;
    });
  }, []);

  const getActivePaperCutEditor = useCallback(() => {
    if (!activeTabId) return null;
    return paperCutEditors[activeTabId] || null;
  }, [activeTabId, paperCutEditors]);

  const value = {
    transcriptEditor,
    paperCutEditors,
    registerTranscriptEditor,
    registerPaperCutEditor,
    unregisterPaperCutEditor,
    getActivePaperCutEditor
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditors() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditors must be used within an EditorProvider');
  }
  return context;
}