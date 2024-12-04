"use client"

import React, { useEffect, useCallback, useRef , useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { usePaperCut } from '@/app/contexts/PaperCutContext';
import PapercutEditor from '@/app/components/RightPanel/PapercutEditor/index';
import { PapercutEditorRef } from '@/app/types/papercut';
import { useActiveEditor } from '@/app/components/RightPanel/ActiveEditorContext';
import type { ContentItem, PaperCutTab } from '@/app/contexts/PaperCutContext';
import { X, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";


  export const PaperCutPanel: React.FC = () => {
    const { 
      activeTabId,
      createTab,
      setActiveTab,
      getTabs,
      closeTab,
      getTabContent
    } = usePaperCut();

    const { setActiveEditor } = useActiveEditor();
    const openTabs = useMemo(() => 
      getTabs().filter(tab => tab.type === 'file' && tab.active),
      [getTabs]
    );

  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const tabsListRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsListRef.current) {
      const scrollAmount = direction === 'left' ? -100 : 100;
      tabsListRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const checkScrollButtons = () => {
    if (tabsListRef.current) {
      setShowLeftScroll(tabsListRef.current.scrollLeft > 0);
      setShowRightScroll(
        tabsListRef.current.scrollLeft <
        tabsListRef.current.scrollWidth - tabsListRef.current.clientWidth
      );
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, [openTabs]);

  // Get or create editor ref for a tab
  const editorRefs = useRef<Record<string, React.RefObject<PapercutEditorRef>>>({});

  const getEditorRef = useCallback((tabId: string) => {
    if (!editorRefs.current[tabId]) {
      editorRefs.current[tabId] = React.createRef<PapercutEditorRef>();
    }
    return editorRefs.current[tabId];
  }, []);


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
            <div className="flex items-center gap-2 mb-4 relative">
              {showLeftScroll && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 z-10"
                  onClick={() => scrollTabs('left')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div
                ref={tabsListRef}
                className="flex-grow overflow-x-auto scrollbar-hide"
                onScroll={checkScrollButtons}
              >
                <TabsList className="flex-shrink-0 inline-flex">
                  {openTabs.map((tab: PaperCutTab) => (
                    <div key={tab.id} className="relative flex items-center group">
                      <TabsTrigger value={tab.id} className="px-4 max-w-[150px] truncate">
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
              </div>
              {showRightScroll && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 z-10"
                  onClick={() => scrollTabs('right')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="flex-shrink-0 ml-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48">
                  <div className="space-y-2">
                    {openTabs.map((tab: PaperCutTab) => (
                      <Button
                        key={tab.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setActiveTab(tab.id)}
                      >
                        {tab.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => createTab()} 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0 bg-gray-800 text-white hover:bg-gray-700"
              >
                Add Tab
              </Button>
            </div>
            {openTabs.map((tab: PaperCutTab) => (
        <TabsContent key={tab.id} value={tab.id}>
          <div className="mb-4 text-gray-500 text-sm">
            Paste your content in the editor below
          </div>
          <PapercutEditor
            ref={(editorRef) => {
              if (editorRef) {
                setActiveEditor(tab.id);
              }
            }}
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