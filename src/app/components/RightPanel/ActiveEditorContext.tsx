"use client"
import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import { PapercutEditorRef } from './PapercutEditor';

interface ActiveEditorContextType {
  activeEditorId: string | null;
  setActiveEditor: (editorId: string) => void;
  getActivePaperCutEditor: () => PapercutEditorRef | null;
  registerEditor: (editorId: string, editorRef: PapercutEditorRef) => void;
}

const ActiveEditorContext = createContext<ActiveEditorContextType | undefined>(undefined);

interface ActiveEditorProviderProps {
  children: ReactNode;
}

export const ActiveEditorProvider: React.FC<ActiveEditorProviderProps> = ({ children }) => {
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const editorsRef = useRef<Record<string, PapercutEditorRef>>({});

  const setActiveEditor = useCallback((editorId: string) => {
    setActiveEditorId(editorId);
  }, []);

  const registerEditor = useCallback((editorId: string, editorRef: PapercutEditorRef) => {
    console.log('Registering editor:', editorId);
    editorsRef.current[editorId] = editorRef;
  }, []);
  const getActivePaperCutEditor = useCallback(() => {
    return activeEditorId ? editorsRef.current[activeEditorId] || null : null;
  }, [activeEditorId]);

  return (
    <ActiveEditorContext.Provider 
      value={{ 
        activeEditorId, 
        setActiveEditor, 
        getActivePaperCutEditor,
        registerEditor
      }}
    >
      {children}
    </ActiveEditorContext.Provider>
  );
};

export const useActiveEditor = () => {
  const context = useContext(ActiveEditorContext);
  if (context === undefined) {
    throw new Error('useActiveEditor must be used within an ActiveEditorProvider');
  }
  return context;
};