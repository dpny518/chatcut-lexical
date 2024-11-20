// src/app/page.tsx
"use client"

import React from 'react';
import "@/app/styles.css";
import { Editor } from '@/app/text-editor'
import { TypingAnimation } from '@/app/components/typing-animation';
import { AppSidebar } from '@/app/components/AppSideBar';
import RightPanel from '@/app/components/RightPanel';
import { FileSystemProvider } from '@/app/contexts/FileSystemContext';

export default function Home() {
  return (
    <FileSystemProvider>
      <div className="App">
        <TypingAnimation />
        <div className="transcript-editor">
          <AppSidebar />
          <div className="main-editor">
            <Editor />
          </div>
          <RightPanel />
        </div>
      </div>
    </FileSystemProvider>
  )
}