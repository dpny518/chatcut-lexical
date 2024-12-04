"use client"

import React, { useEffect, useCallback, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { usePaperCut } from '@/app/contexts/PaperCutContext';
import { useActiveEditor } from './ActiveEditorContext';
import PapercutEditor from '@/app/components/RightPanel/PapercutEditor/index';
import { cn } from "@/lib/utils";
import type { PapercutEditorRef } from '@/app/types/papercut'
import type { ContentItem, PaperCutTab } from '@/app/contexts/PaperCutContext';

interface Props {
  forceUpdate: () => void;
}

export const PaperCutPanel: React.FC<Props> = ({ forceUpdate }) => {
  const { 
    activeTabId,
    createTab,
    updateTabName,
    updateTabContent,
    setActiveTab,
    getTabs,
    closeTab
  } = usePaperCut();

  const { setActiveEditor, registerEditor } = useActiveEditor();
  const editorRefs = useRef<Record<string, React.RefObject<PapercutEditorRef>>>({});
  const openTabs = getTabs().filter(tab => tab.type === 'file' && tab.active);

  // Get or create editor ref for a tab
  const getEditorRef = useCallback((tabId: string) => {
    if (!editorRefs.current[tabId]) {
      editorRefs.current[tabId] = React.createRef<PapercutEditorRef>();
    }
    return editorRefs.current[tabId];
  }, []);

  // Register editor refs with ActiveEditorContext
  useEffect(() => {
    openTabs.forEach(tab => {
      const ref = getEditorRef(tab.id);
      if (ref.current) {
        registerEditor(tab.id, ref.current);
      }
    });
  }, [openTabs, getEditorRef, registerEditor]);

  // Update active editor when active tab changes
  useEffect(() => {
    if (activeTabId) {
      setActiveEditor(activeTabId);
    }
  }, [activeTabId, setActiveEditor]);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleContentChange = useCallback((tabId: string, newContent: ContentItem[]) => {
    updateTabContent(tabId, newContent);
    // Get the editor ref and save its state if needed
    const editorRef = editorRefs.current[tabId]?.current;
    if (editorRef) {
      const currentState = editorRef.getCurrentState();
      // You could potentially save this state to your tab state management
      // or localStorage if needed
    }
  }, [updateTabContent]);

  return (
    <main className="flex-1 h-full bg-black text-foreground overflow-y-auto overflow-x-hidden">
      <div className="min-w-0 px-2">
        {(!activeTabId || openTabs.length === 0) ? (
          <div className="h-full flex justify-center items-center">
            <Button 
              onClick={() => createTab()} 
              variant="outline" 
              className={cn(
                "text-lg px-8 py-6",
                "border-border hover:border-primary",
                "text-foreground hover:text-primary",
                "transition-colors duration-200",
                "bg-black hover:bg-gray-900"
              )}
            >
              Create New PaperCut
            </Button>
          </div>
        ) : (
          <Tabs value={activeTabId || undefined} onValueChange={setActiveTab} className="min-w-0">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              <TabsList className="flex-shrink min-w-0">
                {openTabs.map((tab: PaperCutTab) => (
                  <div key={tab.id} className="relative flex items-center group">
                    <TabsTrigger value={tab.id} className="px-4">
                      {tab.name}
                    </TabsTrigger>
                    <span
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer p-1"
                      onClick={(e) => handleCloseTab(e, tab.id)}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </div>
                ))}
              </TabsList>
              <Button onClick={() => createTab()} variant="outline" size="sm" className="flex-shrink-0">
                Add Tab
              </Button>
            </div>
            
            {openTabs.map((tab: PaperCutTab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <div className="mb-4">
                  <Input
                    value={tab.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateTabName(tab.id, e.target.value);
                      forceUpdate();
                    }}
                    className="font-bold text-lg max-w-md"
                  />
                </div>
                <PapercutEditor
                  ref={getEditorRef(tab.id)}
                  key={tab.id}
                  content={tab.editorState || []}
                  onChange={(newContent) => handleContentChange(tab.id, newContent)}
                  tabId={tab.id}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </main>
  );
};

export default PaperCutPanel;