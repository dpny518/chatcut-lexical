import React from "react";
import '@/styles/layout.css';
import LeftPanel from "@/app/components/LeftPanel";
import CenterPanel from "@/app/components/CenterPanel";
import RightPanel from "@/app/components/RightPanel/RightPanel";
import { useFormattedWords } from '@/app/contexts/FormattedWordsContext';

export default function App() {
  return (
    <div className="flex h-screen bg-black text-gray-200 font-sans">
    {/* Left Panel */}
    <aside className="w-64 bg-gray-900 flex-shrink-0 p-4">
      <LeftPanel />
    </aside>
  
    {/* Center Panel */}
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4">
        <CenterPanel />
      </div>
    </main>
  
    {/* Right Panel */}
    <aside className="w-[500px] bg-gray-900 flex-shrink-0 p-4">
      <RightPanel />
    </aside>
  </div>
  );
}