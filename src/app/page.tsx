'use client';

import React from "react";
import "@/app/styles.css";
import LeftPanel from "@/app/components/LeftPanel";
import CenterPanel from "@/app/components/CenterPanel";
import RightPanel from "@/app/components/RightPanel";
import { useFormattedWords } from '@/app/contexts/FormattedWordsContext';

export default function App() {
  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - keep current size */}
      <aside className="w-64 border-r border-border bg-card flex-shrink-0">
        <LeftPanel />
      </aside>

      {/* Center Panel - adjust max-width */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-4xl">
        <header className="border-b border-border p-4 bg-card flex items-center justify-between">
          <h1 className="text-lg font-semibold">Transcript Editor</h1>
        </header>
        <div className="flex-1 overflow-auto">
          <CenterPanel />
        </div>
      </main>

      {/* Right Panel - make narrower */}
      <aside className="w-120 border-l border-border bg-card flex-shrink-0">
        <RightPanel />
      </aside>
    </div>
  );
}