// src/app/contexts/PaperCutContext.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useEditors } from '@/app/contexts/EditorContext'

export type PaperCutType = 'file' | 'folder';

export interface PaperCutTab {
  id: string;
  name: string;
  displayName: string;
  type: PaperCutType;
  editorState: ContentItem[] | null;  
  active: boolean;
  createdAt: number;
  order: number;
  parentId: string | null;
}

export interface ContentItem {
  word: string;
  startTime: number;
  endTime: number;
  wordIndex: number;
  segmentId: string;
  segmentStartTime: number;
  segmentEndTime: number;
  speaker: string;
  fileName: string;
  fileId: string;
}

interface PaperCutContextType {
  tabs: { [id: string]: PaperCutTab };
  activeTabId: string | null;
  createTab: (name?: string, parentId?: string | null) => string;
  createFolder: (name: string, parentId?: string | null) => string;
  closeTab: (id: string) => void;
  reopenTab: (id: string) => void;
  deleteTab: (id: string) => void;
  updateTabName: (id: string, newName: string) => void;
  updateTabContent: (id: string, newContent: ContentItem[]) => void;
  setActiveTab: (id: string) => void;
  moveTab: (id: string, newParentId: string | null, beforeId?: string | null) => void;
  getTabs: () => PaperCutTab[];
  getAllContents: (folderId: string) => string[];
  isAllContentsSelected: (folderId: string) => boolean;
  getTabByDisplayName: (displayName: string) => PaperCutTab | undefined;
  getTabContent: (id: string) => ContentItem[] | null;
}

const PaperCutContext = createContext<PaperCutContextType | undefined>(undefined);

// Counter for generating unique IDs
let nextId = 1;

const generateId = (prefix: string) => {
  return `${prefix}-${nextId++}`;
};

export const PaperCutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<{ [id: string]: PaperCutTab }>({});
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const { setActiveEditor } = useEditors();
  const [tabContents, setTabContents] = useState<{ [id: string]: ContentItem[] }>({});
  const createTab = useCallback((name?: string, parentId: string | null = null) => {
    const id = generateId('papercut');
    const siblingTabs = Object.values(tabs).filter(t => t.parentId === parentId);
    const maxOrder = Math.max(0, ...siblingTabs.map(t => t.order));
    
    setTabs(prev => ({
      ...prev,
      [id]: {
        id,
        name: name || `New Tab ${nextId++}`,
        displayName: name || `New Tab ${nextId}`,
        type: 'file',
        editorState: null,
        parentId,
        active: true,
        createdAt: nextId,
        order: maxOrder + 1000
      }
    }));
    setActiveTabId(id);
    setActiveEditor(id);
    return id;
  }, [tabs, setActiveEditor]);

  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    const id = generateId('folder');
    const siblingTabs = Object.values(tabs).filter(t => t.parentId === parentId);
    const maxOrder = Math.max(0, ...siblingTabs.map(t => t.order));
    
    const newFolder: PaperCutTab = {
      id,
      name,
      displayName: name,
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
  }, [tabs]);

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

  const reopenTab = useCallback((id: string) => {
    setTabs(prev => ({
      ...prev,
      [id]: { ...prev[id], active: true }
    }));
    setActiveTabId(id);
    setActiveEditor(id);
  }, [setActiveEditor]);
  
  const deleteTab = useCallback((id: string) => {
    setTabs(prev => {
      const newTabs = { ...prev };
      delete newTabs[id];
      return newTabs;
    });
  }, []);

  const updateTabName = useCallback((id: string, newName: string) => {
    setTabs(prev => ({
      ...prev,
      [id]: { ...prev[id], name: newName, displayName: newName }
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
  const updateTabContent = useCallback((id: string, newContent: ContentItem[]) => {
    setTabContents(prev => ({
      ...prev,
      [id]: newContent
    }));
    setTabs(prev => ({
      ...prev,
      [id]: { ...prev[id], editorState: newContent }
    }));
  }, []);

  const getTabContent = useCallback((id: string) => {
    return tabContents[id] || null;
  }, [tabContents]);

  // Optionally, you can save the state to localStorage
  useEffect(() => {
    const savedState = JSON.stringify({ tabs, tabContents });
    localStorage.setItem('paperCutState', savedState);
  }, [tabs, tabContents]);

  // Load state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem('paperCutState');
    if (savedState) {
      const { tabs: savedTabs, tabContents: savedContents } = JSON.parse(savedState);
      setTabs(savedTabs);
      setTabContents(savedContents);
    }
  }, []);

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

  const getTabByDisplayName = useCallback((displayName: string) => {
    return Object.values(tabs).find(tab => tab.name === displayName);
  }, [tabs]);

  const contextValue: PaperCutContextType = {
    tabs,
    activeTabId,
    createTab,
    createFolder,
    closeTab,
    reopenTab,
    deleteTab,
    updateTabName,
    updateTabContent,
    setActiveTab,
    moveTab,
    getTabs,
    getAllContents,
    isAllContentsSelected,
    getTabByDisplayName,
    getTabContent,
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
  return {
    ...context,
    activeTabId: context.activeTabId,
  };
};