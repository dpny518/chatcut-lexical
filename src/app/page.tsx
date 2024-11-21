"use client"

import React from 'react';
import "@/app/styles.css";
import { Editor } from '@/app/text-editor'
import { TypingAnimation } from '@/app/components/typing-animation';
import { AppSidebar } from '@/app/components/AppSideBar';
import RightPanel from '@/app/components/RightPanel';
import { FileSystemProvider } from '@/app/contexts/FileSystemContext';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

export default function Home() {
  return (
    <FileSystemProvider>
      <div className="App">
        <TypingAnimation />
        <div className="transcript-editor">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={20} minSize={15}>
              <AppSidebar />
            </Panel>
            <PanelResizeHandle className="resize-handle" />
            <Panel minSize={30}>
              <div className="main-editor">
                <Editor />
              </div>
            </Panel>
            <PanelResizeHandle className="resize-handle" />
            <Panel defaultSize={30} minSize={20}>
              <RightPanel />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </FileSystemProvider>
  )
}