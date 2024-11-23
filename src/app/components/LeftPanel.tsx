// src/app/components/LeftPanel.tsx
"use client";

import React from "react";
import { AppSidebar } from "@/app/components/AppSideBar";
import { PaperCutSidebar } from "@/app/components/PaperCutSidebar";
import { SidebarSeparator } from "@/app/components/Sidebar/SidebarSeparator";
import Chatbot from "@/app/components/Chatbot/Chatbot";

export default function LeftPanel() {
  return (
    <aside className="w-64 h-full bg-muted text-foreground border-r border-border flex flex-col">
      <div className="flex-grow overflow-auto">
        <AppSidebar />
        <SidebarSeparator />
        <PaperCutSidebar />
      </div>
      <div className="border-t border-border p-4 mt-auto">
        <Chatbot />
      </div>
    </aside>
  );
}