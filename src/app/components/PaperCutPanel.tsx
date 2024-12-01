// src/app/components/PaperCutPanel.tsx
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LexicalEditor } from './LexicalEditor';
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

  // Add this state to force re-render
  const [editorKey, setEditorKey] = useState(0);

  // Modify setActiveTab to force re-render
  const handleSetActiveTab = useCallback((id: string) => {
    setActiveTab(id);
    setEditorKey(prev => prev + 1);
  }, [setActiveTab]);

  // Only get tabs that are currently active/open
  const openTabs = getTabs().filter(tab => tab.type === 'file' && tab.active);

  if (!activeTabId || openTabs.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <Button onClick={() => createTab()} variant="outline">Create New PaperCut</Button>
      </div>
    );
  }

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <Tabs value={activeTabId} onValueChange={handleSetActiveTab} className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList className="w-full justify-start">
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
        <Button onClick={() => createTab()} variant="outline">Add Tab</Button>
      </div>
      {openTabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Input
                  value={tab.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    updateTabName(tab.id, e.target.value)
                  }
                  className="font-bold text-lg"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LexicalEditor
                key={`${tab.id}-${editorKey}`}
                initialState={tab.editorState}
                onChange={(newState) => updateTabContent(tab.id, newState)}
                tabId={tab.id}
              />
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}