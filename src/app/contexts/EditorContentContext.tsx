// src/app/contexts/EditorContentContext.tsx
'use client'

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useFileSystem } from './FileSystemContext';

type EditorContentContextType = {
  selectedFileIds: string[];
  setSelectedFileIds: (newFileIds: React.SetStateAction<string[]>) => void;
  lastSelectedFileId: string | null;
  setLastSelectedFileId: React.Dispatch<React.SetStateAction<string | null>>;
  paperCutSelectedIds: string[];
  setPaperCutSelectedIds: (newIds: React.SetStateAction<string[]>) => void;
  paperCutLastSelectedId: string | null;
  setPaperCutLastSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
  activeSelectionType: 'files' | 'papercuts' | null;
  setActiveSelectionType: (type: 'files' | 'papercuts' | null) => void;
};

const EditorContentContext = createContext<EditorContentContextType | undefined>(undefined);

export const EditorContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [lastSelectedFileId, setLastSelectedFileId] = useState<string | null>(null);
  const [paperCutSelectedIds, setPaperCutSelectedIds] = useState<string[]>([]);
  const [paperCutLastSelectedId, setPaperCutLastSelectedId] = useState<string | null>(null);
  const [activeSelectionType, setActiveSelectionType] = useState<'files' | 'papercuts' | null>(null);
  const { files } = useFileSystem();
  const prevActiveTypeRef = useRef<'files' | 'papercuts' | null>(null);

  useEffect(() => {
    if (activeSelectionType !== prevActiveTypeRef.current) {
      prevActiveTypeRef.current = activeSelectionType;
    }
  }, [activeSelectionType]);

  const setSelectedFileIdsWithLogging = useCallback((newFileIds: React.SetStateAction<string[]>) => {
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
  }, [files]);

  const setPaperCutSelectedIdsWithLogging = useCallback((newIds: React.SetStateAction<string[]>) => {
    setPaperCutSelectedIds((prevIds) => {
      const nextIds = typeof newIds === 'function' ? newIds(prevIds) : newIds;
      
      console.log('PaperCut Selected IDs changing:', {
        prev: prevIds,
        next: nextIds,
        added: nextIds.filter(id => !prevIds.includes(id)),
        removed: prevIds.filter(id => !nextIds.includes(id)),
      });
      return nextIds;
    });
  }, []);

  // Maintain selections when switching between types
  useEffect(() => {
    if (activeSelectionType === 'files' && selectedFileIds.length === 0 && paperCutSelectedIds.length > 0) {
      setActiveSelectionType('papercuts');
    } else if (activeSelectionType === 'papercuts' && paperCutSelectedIds.length === 0 && selectedFileIds.length > 0) {
      setActiveSelectionType('files');
    }
  }, [selectedFileIds, paperCutSelectedIds, activeSelectionType]);

  return (
    <EditorContentContext.Provider value={{ 
      selectedFileIds, 
      setSelectedFileIds: setSelectedFileIdsWithLogging,
      lastSelectedFileId,
      setLastSelectedFileId,
      paperCutSelectedIds,
      setPaperCutSelectedIds: setPaperCutSelectedIdsWithLogging,
      paperCutLastSelectedId,
      setPaperCutLastSelectedId,
      activeSelectionType,
      setActiveSelectionType,
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