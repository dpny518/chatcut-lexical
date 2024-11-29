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

  const [editorKey, setEditorKey] = useState(0);
  const openTabs = getTabs().filter(tab => tab.type === 'file' && tab.active);

  const handleSetActiveTab = useCallback((id: string) => {
    setActiveTab(id);
    setEditorKey(prev => prev + 1);
  }, [setActiveTab]);

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {(!activeTabId || openTabs.length === 0) ? (
        <div className="flex-grow flex justify-center items-center">
          <Button 
            onClick={() => createTab()} 
            variant="outline" 
            className="text-lg px-8 py-6"
          >
            Create New PaperCut
          </Button>
        </div>
      ) : (
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
            <Button onClick={() => createTab()} variant="outline" size="sm">
              Add Tab
            </Button>
          </div>
          
          {openTabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="overflow-visible">
              <Card className="overflow-visible shadow-sm">
                <CardHeader className="pb-2">
                  <Input
                    value={tab.name}
                    onChange={(e) => updateTabName(tab.id, e.target.value)}
                    className="font-bold text-lg border-none px-0 focus-visible:ring-0"
                  />
                </CardHeader>
                <CardContent className="overflow-visible relative pt-0">
                  <div className="relative">
                    <LexicalEditor
                      key={`${tab.id}-${editorKey}`}
                      initialState={tab.editorState}
                      onChange={(newState) => updateTabContent(tab.id, newState)}
                      tabId={tab.id}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}