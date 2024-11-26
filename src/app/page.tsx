'use client';

import React from "react";
import "@/app/styles.css";
import LeftPanel from "@/app/components/LeftPanel";
import CenterPanel from "@/app/components/CenterPanel";
import RightPanel from "@/app/components/RightPanel";
import { useFormattedWords } from '@/app/contexts/FormattedWordsContext';

export default function App() {
  const { formattedWords } = useFormattedWords();

  // Keep the logging if you need it for debugging
  React.useEffect(() => {
    console.log('FormattedWords in main component:', formattedWords);
  }, [formattedWords]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Left Panel */}
      <aside className="w-64 border-r border-gray-200 bg-white flex-shrink-0">
        <LeftPanel />
      </aside>

      {/* Center Panel */}
      <main className="flex-1 flex flex-col overflow-hidden px-2">
        <header className="border-b border-gray-200 p-4 bg-white flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-700">Transcript Editor</h1>
        </header>
        <div className="flex-1 overflow-auto">
          <CenterPanel />
        </div>
      </main>

      {/* Right Panel */}
      <aside className="w-[28rem] border-l border-gray-200 bg-white flex-shrink-0">
        <RightPanel />
      </aside>
    </div>
  );
}