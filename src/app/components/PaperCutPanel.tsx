// src/app/components/PaperCutPanel.tsx
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const handleTabNameChange = (id: string, newName: string) => {
    setTabs(tabs.map(tab => 
      tab.id === id ? { ...tab, name: newName } : tab
    ));
  };

  const handleContentChange = (id: string, newContent: string) => {
    setTabs(tabs.map(tab => 
      tab.id === id ? { ...tab, content: newContent } : tab
    ));
  };

  const addNewTab = () => {
    const newId = (parseInt(tabs[tabs.length - 1].id) + 1).toString();
    setTabs([...tabs, { id: newId, name: `PaperCut ${newId}`, content: '' }]);
    setActiveTab(newId);
  };

  return (
    <div className="papercut-panel">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <input
                value={tab.name}
                onChange={(e) => handleTabNameChange(tab.id, e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </TabsTrigger>
          ))}
          <button onClick={addNewTab}>+</button>
        </TabsList>
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id}>
            <LexicalEditor
              content={tab.content}
              onChange={(newContent) => handleContentChange(tab.id, newContent)}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}