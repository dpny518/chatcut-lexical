import React from "react";
import '@/styles/layout.css';
import LeftPanel from "@/app/components/LeftPanel";
import CenterPanel from "@/app/components/CenterPanel";
import RightPanel from "@/app/components/RightPanel/RightPanel";
import { useFormattedWords } from '@/app/contexts/FormattedWordsContext';

export default function App() {
  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - keep current size */}
      <aside className="w-64 border-r border-border bg-card/50 flex-shrink-0">
        <LeftPanel />
      </aside>

      {/* Center Panel - adjust max-width */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl">
        <header className="border-b border-border p-4 bg-card/50 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Source</h1>
        </header>
        <div className="flex-1 overflow-auto bg-background">
          <CenterPanel />
        </div>
      </main>

      {/* Right Panel - much wider */}
      <aside className="w-[600px] border-l border-border bg-card/50 flex-shrink-0">  
         <RightPanel />
      </aside>
    </div>
  );
}