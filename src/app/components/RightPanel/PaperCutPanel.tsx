"use client"
import React, { useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { usePaperCut, PaperCutTab, ContentItem } from '@/app/contexts/PaperCutContext';
import { useActiveEditor } from '@/app/components/RightPanel/ActiveEditorContext';
import PapercutEditor  from './PapercutEditor';


export const PaperCutPanel: React.FC = () => {
  const { 
    activeTabId,
    createTab,
    updateTabName,
    updateTabContent,
    setActiveTab,
    getTabs,
    closeTab
  } = usePaperCut();

  const { setActiveEditor } = useActiveEditor();

  const openTabs = getTabs().filter(tab => tab.type === 'file' && tab.active);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    closeTab(tabId);
  };

  useEffect(() => {
    if (activeTabId) {
      setActiveEditor(activeTabId);
    }
  }, [activeTabId, setActiveEditor]);

  return (
    <main className="flex-1 h-full bg-muted/50 text-foreground overflow-y-auto overflow-x-hidden">
      <div className="min-w-0 px-2">
        {(!activeTabId || openTabs.length === 0) ? (
          <div className="h-full flex justify-center items-center">
            <Button 
              onClick={() => createTab()} 
              variant="outline" 
              className="text-lg px-8 py-6"
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
                    <TabsTrigger value={tab.id} className="pr-8">
                      {tab.displayName}
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
                    value={tab.displayName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTabName(tab.id, e.target.value)}
                    className="font-bold text-lg max-w-md"
                  />
                </div>
                <PapercutEditor
                  key={tab.id}
                  content={Array.isArray(tab.editorState) ? tab.editorState : []}
                  onChange={(newContent: ContentItem[]) => updateTabContent(tab.id, JSON.stringify(newContent))}
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