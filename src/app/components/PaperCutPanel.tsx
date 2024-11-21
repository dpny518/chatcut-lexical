// src/app/components/PaperCutPanel.tsx
import React, { useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { LexicalEditor } from './LexicalEditor';

type PaperCutTab = {
  id: string;
  name: string;
  content: string;
};

export function PaperCutPanel() {
  const [tabs, setTabs] = useState<PaperCutTab[]>([
    { id: '1', name: 'PaperCut 1', content: '' }
  ]);
  const [activeTab, setActiveTab] = useState('1');

  const handleTabNameChange = useCallback((id: string, newName: string) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === id ? { ...tab, name: newName } : tab
    ));
  }, []);

  const handleContentChange = useCallback((id: string, newContent: string) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === id ? { ...tab, content: newContent } : tab
    ));
  }, []);

  const addNewTab = useCallback(() => {
    setTabs(prevTabs => {
      const newId = (parseInt(prevTabs[prevTabs.length - 1].id) + 1).toString();
      const newTab = { id: newId, name: `PaperCut ${newId}`, content: '' };
      setActiveTab(newId);
      return [...prevTabs, newTab];
    });
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex justify-between items-center mb-4">
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button onClick={addNewTab} variant="outline">Add Tab</Button>
      </div>
      {tabs.map(tab => (
        <TabsContent key={tab.id} value={tab.id}>
          <Card>
            <CardHeader>
              <CardTitle>
                <Input
                  value={tab.name}
                  onChange={(e) => handleTabNameChange(tab.id, e.target.value)}
                  className="font-bold text-lg"
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LexicalEditor
                content={tab.content}
                onChange={(newContent) => handleContentChange(tab.id, newContent)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
