// src/app/contexts/EditorContentContext.tsx
'use client'
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

type EditorContentContextType = {
  selectedFileIds: string[];
  setSelectedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
};

const EditorContentContext = createContext<EditorContentContextType | undefined>(undefined);

export const EditorContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  useEffect(() => {
    console.log('Selected File IDs updated:', selectedFileIds);
  }, [selectedFileIds]);

  const setSelectedFileIdsWithLogging = (newFileIds: React.SetStateAction<string[]>) => {
    setSelectedFileIds((prevFileIds) => {
      const nextFileIds = typeof newFileIds === 'function' ? newFileIds(prevFileIds) : newFileIds;
      console.log('Selected File IDs changing:', {
        prev: prevFileIds,
        next: nextFileIds,
        added: nextFileIds.filter(id => !prevFileIds.includes(id)),
        removed: prevFileIds.filter(id => !nextFileIds.includes(id)),
      });
      return nextFileIds;
    });
  };

  return (
    <EditorContentContext.Provider value={{ selectedFileIds, setSelectedFileIds: setSelectedFileIdsWithLogging }}>
      {children}
    </EditorContentContext.Provider>
  );
};

export const useEditorContent = () => {
  const context = useContext(EditorContentContext);
  if (context === undefined) {
    throw new Error('useEditorContent must be used within an EditorContentProvider');
  }
  return context;
};