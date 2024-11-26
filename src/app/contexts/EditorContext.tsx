// src/app/contexts/EditorContext.tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react';
import { LexicalEditor } from 'lexical';
import { usePaperCut } from './PaperCutContext';


interface EditorContextType {
  transcriptEditor: LexicalEditor | null;
  paperCutEditors: { [tabId: string]: LexicalEditor };
  activeTabId: string | null; // Add this line
  registerTranscriptEditor: (editor: LexicalEditor) => void;
  registerPaperCutEditor: (tabId: string, editor: LexicalEditor) => void;
  unregisterPaperCutEditor: (tabId: string) => void;
  getActivePaperCutEditor: () => LexicalEditor | null;
  setActiveEditor: (tabId: string | null) => void; // Add this line
}
const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [transcriptEditor, setTranscriptEditor] = useState<LexicalEditor | null>(null);
  const [paperCutEditors, setPaperCutEditors] = useState<{ [tabId: string]: LexicalEditor }>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const registerTranscriptEditor = useCallback((editor: LexicalEditor) => {
    setTranscriptEditor(editor);
  }, []);

  const registerPaperCutEditor = useCallback((tabId: string, editor: LexicalEditor) => {
    console.log(`Registering PaperCut editor for tab: ${tabId}`);
    setPaperCutEditors(prev => {
      const newEditors = { ...prev, [tabId]: editor };
      console.log('Updated paperCutEditors:', Object.keys(newEditors));
      return newEditors;
    });
  }, []);
  
  const unregisterPaperCutEditor = useCallback((tabId: string) => {
    setPaperCutEditors(prev => {
      const newEditors = { ...prev };
      delete newEditors[tabId];
      return newEditors;
    });
  }, []);

  const setActiveEditor = useCallback((tabId: string | null) => {
    console.log('EditorContext: Setting active tab ID:', tabId);
    setActiveTabId(tabId);
  }, []);

  const getActivePaperCutEditor = useCallback(() => {
    console.log('Getting active PaperCut editor');
    console.log('Active tab ID:', activeTabId);
    console.log('Available editors:', Object.keys(paperCutEditors));
    if (!activeTabId) return null;
    const editor = paperCutEditors[activeTabId];
    console.log('Retrieved editor:', editor ? 'Found' : 'Not found');
    return editor || null;
  }, [activeTabId, paperCutEditors]);


  const value: EditorContextType = {
    transcriptEditor,
    paperCutEditors,
    activeTabId,
    registerTranscriptEditor,
    registerPaperCutEditor,
    unregisterPaperCutEditor,
    getActivePaperCutEditor,
    setActiveEditor,
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