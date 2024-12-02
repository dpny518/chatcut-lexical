"use client"
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LexicalEditor } from '@/app/components/LexicalEditor';
import { usePaperCut } from '@/app/contexts/PaperCutContext';

interface LexicalEditorProps {
  initialState: string | null;
  onChange: (newState: string) => void;
  tabId: string;
}

export function PaperCutPanel() {
  const { 
    tabs,
    activeTabId,
    createTab,
    updateTabName,
    updateTabContent,
    setActiveTab,
    getTabs,
    closeTab
  } = usePaperCut();

  const openTabs = getTabs().filter(tab => tab.type === 'file' && tab.active);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    closeTab(tabId);
  };

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
          <Tabs value={activeTabId} onValueChange={setActiveTab} className="min-w-0">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto">
              <TabsList className="flex-shrink min-w-0">
                {openTabs.map(tab => (
                  <div key={tab.id} className="relative flex items-center group">
                    <TabsTrigger value={tab.id} className="pr-8">
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
            
            {openTabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id}>
                <div className="mb-4">
                  <Input
                    value={tab.name}
                    onChange={(e) => updateTabName(tab.id, e.target.value)}
                    className="font-bold text-lg max-w-md"
                  />
                </div>
                <LexicalEditor
                  key={tab.id}
                  initialState={tab.editorState}
                  onChange={(newState) => updateTabContent(tab.id, newState)}
                  tabId={tab.id}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </main>
  );
}