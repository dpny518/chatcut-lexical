// src/app/contexts/EditorContentContext.tsx
'use client'
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useFileSystem } from './FileSystemContext';

type EditorContentContextType = {
  selectedFileIds: string[];
  setSelectedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  lastSelectedId: string | null;
  setLastSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
};

const EditorContentContext = createContext<EditorContentContextType | undefined>(undefined);

export const EditorContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const { files } = useFileSystem();

  useEffect(() => {
    console.log('Selected File IDs updated:', selectedFileIds);
  }, [selectedFileIds]);

  const setSelectedFileIdsWithLogging = (newFileIds: React.SetStateAction<string[]>) => {
    setSelectedFileIds((prevFileIds) => {
      const nextFileIds = typeof newFileIds === 'function' ? newFileIds(prevFileIds) : newFileIds;
      
      // Sort the selected file IDs based on their order in the file system
      const sortedFileIds = nextFileIds.sort((a, b) => {
        const fileA = files[a];
        const fileB = files[b];
        if (fileA && fileB) {
          return fileA.order - fileB.order;
        }
        return 0;
      });

      console.log('Selected File IDs changing:', {
        prev: prevFileIds,
        next: sortedFileIds,
        added: sortedFileIds.filter(id => !prevFileIds.includes(id)),
        removed: prevFileIds.filter(id => !sortedFileIds.includes(id)),
      });
      return sortedFileIds;
    });
  };

  return (
    <EditorContentContext.Provider value={{ 
      selectedFileIds, 
      setSelectedFileIds: setSelectedFileIdsWithLogging,
      lastSelectedId,
      setLastSelectedId,
    }}>
      {children}
    </EditorContentContext.Provider>
  );
}

export const useEditorContent = () => {
  const context = useContext(EditorContentContext);
  if (context === undefined) {
    throw new Error('useEditorContent must be used within an EditorContentProvider');
  }
  return context;
};