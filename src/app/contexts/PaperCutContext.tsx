// src/app/contexts/PaperCutContext.tsx
'use client'
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useEditorContent } from '@/app/contexts/EditorContentContext'
import { useEditors } from '@/app/contexts/EditorContext'
export type PaperCutType = 'file' | 'folder';

export interface PaperCutTab {
  id: string;
  name: string;
  type: PaperCutType;
  editorState: string | null;
  parentId: string | null;
  active: boolean;
  createdAt: number;
  order: number;
}

interface PaperCutContextType {
  tabs: { [id: string]: PaperCutTab };
  activeTabId: string | null;
  createTab: (name?: string, parentId?: string | null) => string;
  createFolder: (name: string, parentId?: string | null) => string;
  closeTab: (id: string) => void;
  deleteTab: (id: string) => void;
  updateTabName: (id: string, newName: string) => void;
  updateTabContent: (id: string, newContent: string) => void;
  setActiveTab: (id: string) => void;
  moveTab: (id: string, newParentId: string | null, beforeId?: string | null) => void;
  getTabs: () => PaperCutTab[];
  getAllContents: (folderId: string) => string[];
  isAllContentsSelected: (folderId: string) => boolean;
}

const PaperCutContext = createContext<PaperCutContextType | undefined>(undefined);

// Counter for generating unique IDs
let nextId = 1;

export const PaperCutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setActiveEditor } = useEditors(); // Add this line to get the function from EditorContext
  const [tabs, setTabs] = useState<{ [id: string]: PaperCutTab }>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const initialRenderRef = useRef(true);

  // Generate a unique ID without using Date.now()
  const generateId = useCallback((prefix: string) => {
    return `${prefix}-${nextId++}`;
  }, []);
  
  const createTab = useCallback((name?: string, parentId: string | null = null) => {
    const id = generateId('papercut');
    const siblingTabs = Object.values(tabs).filter(t => t.parentId === parentId);
    const maxOrder = Math.max(0, ...siblingTabs.map(t => t.order));
    
    setTabs(prev => {
      const newTabs = { ...prev };
      // Don't deactivate other tabs - remove this part
      // Instead, just add the new tab as active
      newTabs[id] = {
        id,
        name: name || `PaperCut ${Object.keys(prev).length + 1}`,
        type: 'file',
        editorState: null,
        parentId,
        active: true,
        createdAt: nextId,
        order: maxOrder + 1000
      };

      return newTabs;
    });

    setActiveTabId(id);
    setActiveEditor(id);
    
    return id;
}, [tabs, generateId, setActiveEditor]);

  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    const id = generateId('folder');
    const siblingTabs = Object.values(tabs).filter(t => t.parentId === parentId);
    const maxOrder = Math.max(0, ...siblingTabs.map(t => t.order));
    
    const newFolder: PaperCutTab = {
      id,
      name,
      type: 'folder',
      editorState: null,
      parentId,
      active: false,
      createdAt: nextId, // Use counter instead of timestamp
      order: maxOrder + 1000
    };

    setTabs(prev => ({
      ...prev,
      [id]: newFolder
    }));
    return id;
  }, [tabs, generateId]);
  const deleteTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = { ...prev };
      delete newTabs[id];
      return newTabs;
    });
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => ({
      ...prev,
      [id]: { ...prev[id], active: false }
    }));
    
    if (activeTabId === id) {
      const activeTabs = Object.values(tabs)
        .filter(tab => tab.type === 'file' && tab.active && tab.id !== id)
        .sort((a, b) => b.createdAt - a.createdAt);
      
      if (activeTabs.length > 0) {
        const nextActiveTab = activeTabs[0];
        setActiveTabId(nextActiveTab.id);
        setActiveEditor(nextActiveTab.id);
      } else {
        setActiveTabId(null);
        setActiveEditor('');
      }
    }
}, [activeTabId, tabs, setActiveEditor]);

  const updateTabName = useCallback((id: string, newName: string) => {
    setTabs(prev => ({
      ...prev,
      [id]: { ...prev[id], name: newName }
    }));
  }, []);

  const updateTabContent = useCallback((id: string, newContent: string) => {
    setTabs(prev => ({
      ...prev,
      [id]: { ...prev[id], editorState: newContent }
    }));
  }, []);

  const setActiveTab = useCallback((id: string) => {
    console.log('PaperCutContext: Setting active tab:', id);
    setTabs(prev => {
      const newTabs = { ...prev };
      // Don't deactivate other tabs, just set the new one as active
      if (newTabs[id]) {
        newTabs[id] = { ...newTabs[id], active: true };
      }
      return newTabs;
    });

    setActiveTabId(id);
    setActiveEditor(id);
}, [setActiveEditor]);
  
  const moveTab = useCallback((id: string, newParentId: string | null, beforeId: string | null = null) => {
    setTabs(prev => {
      const movedTab = prev[id];
      if (!movedTab) return prev;
      
      const siblings = Object.values(prev).filter(t => t.parentId === newParentId);
      
      let newOrder: number;
      if (beforeId) {
        const beforeTab = prev[beforeId];
        const afterTab = siblings.find(t => t.order > beforeTab.order);
        newOrder = afterTab 
          ? (beforeTab.order + afterTab.order) / 2 
          : beforeTab.order + 1000;
      } else {
        const maxOrder = Math.max(0, ...siblings.map(t => t.order));
        newOrder = maxOrder + 1000;
      }
      
      return {
        ...prev,
        [id]: {
          ...movedTab,
          parentId: newParentId,
          order: newOrder
        }
      };
    });
  }, []);

  const getTabs = useCallback(() => {
    return Object.values(tabs).sort((a, b) => a.order - b.order);
  }, [tabs]);

  const getAllContents = useCallback((folderId: string): string[] => {
    const contents: string[] = [];
    const queue = [folderId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const item = tabs[currentId];
      if (!item) continue;
      if (item.type === 'file') {
        contents.push(currentId);
      } else if (item.type === 'folder') {
        const childItems = Object.values(tabs)
          .filter(t => t.parentId === currentId)
          .sort((a, b) => a.order - b.order);
        childItems.forEach(child => queue.push(child.id));
      }
    }
    return contents;
  }, [tabs]);

  const isAllContentsSelected = useCallback((folderId: string): boolean => {
    const contents = getAllContents(folderId);
    return contents.length > 0 && contents.every(id => {
      const tab = tabs[id];
      return tab && tab.active;
    });
  }, [tabs, getAllContents]);

  const contextValue: PaperCutContextType = {
    tabs,
    activeTabId,
    createTab,
    createFolder,
    closeTab,
    deleteTab,
    updateTabName,
    updateTabContent,
    setActiveTab,
    moveTab,
    getTabs,
    getAllContents,
    isAllContentsSelected,
  };

  return (
    <PaperCutContext.Provider value={contextValue}>
      {children}
    </PaperCutContext.Provider>
  );
};

export const usePaperCut = () => {
  const context = useContext(PaperCutContext);
  if (!context) {
    throw new Error('usePaperCut must be used within a PaperCutProvider');
  }
  return context;
};