"use client"

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import type { PapercutEditorRef } from '@/app/types/papercut';

interface ActiveEditorContextType {
  activeEditorId: string | null;
  editors: Record<string, PapercutEditorRef>;
  setActiveEditor: (id: string) => void;
  registerEditor: (id: string, ref: PapercutEditorRef) => void;
  unregisterEditor: (id: string) => void;
  getActivePaperCutEditor: () => PapercutEditorRef | null;
  hasActiveEditor: () => boolean;
  addToPaperCut: (content: string) => void;
  insertIntoPaperCut: (content: string) => void;
}

const ActiveEditorContext = createContext<ActiveEditorContextType>({
  activeEditorId: null,
  editors: {},
  setActiveEditor: () => {},
  registerEditor: () => {},
  unregisterEditor: () => {},
  getActivePaperCutEditor: () => null,
  hasActiveEditor: () => false,
  addToPaperCut: () => {},
  insertIntoPaperCut: () => {},
});

export const ActiveEditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null);
  const editorsRef = useRef<Record<string, PapercutEditorRef>>({});

  const registerEditor = useCallback((id: string, ref: PapercutEditorRef) => {
    editorsRef.current[id] = ref;
  }, []);

  const unregisterEditor = useCallback((id: string) => {
    delete editorsRef.current[id];
  }, []);

  const getActivePaperCutEditor = useCallback(() => {
    if (!activeEditorId) return null;
    return editorsRef.current[activeEditorId] || null;
  }, [activeEditorId]);

  const hasActiveEditor = useCallback(() => {
    return activeEditorId !== null && editorsRef.current[activeEditorId] !== undefined;
  }, [activeEditorId]);

  const addToPaperCut = useCallback((content: string) => {
    const activeEditor = getActivePaperCutEditor();
    if (activeEditor) {
      activeEditor.addContentAtEnd(content);
    }
  }, [getActivePaperCutEditor]);

  const insertIntoPaperCut = useCallback((content: string) => {
    const activeEditor = getActivePaperCutEditor();
    if (activeEditor) {
      activeEditor.addContentAtCursor(content);
    }
  }, [getActivePaperCutEditor]);

  return (
    <ActiveEditorContext.Provider
      value={{
        activeEditorId,
        editors: editorsRef.current,
        setActiveEditor: setActiveEditorId,
        registerEditor,
        unregisterEditor,
        getActivePaperCutEditor,
        hasActiveEditor,
        addToPaperCut,
        insertIntoPaperCut,
      }}
    >
      {children}
    </ActiveEditorContext.Provider>
  );
};

export const useActiveEditor = () => useContext(ActiveEditorContext);

// Optional: Utility hook for components that only need papercut operations
export const usePaperCutOperations = () => {
  const { 
    getActivePaperCutEditor, 
    hasActiveEditor, 
    addToPaperCut, 
    insertIntoPaperCut 
  } = useActiveEditor();
  
  return { 
    getActivePaperCutEditor, 
    hasActiveEditor, 
    addToPaperCut, 
    insertIntoPaperCut 
  };
};