"use client";

import React from "react";
import { FileSidebar } from "@/app/components/FileSideBar"
import { PaperCutSidebar } from "./PaperCutSidebar";
import { SidebarSeparator } from "./Sidebar/SidebarSeparator";
import Chatbot from "./Chatbot/Chatbot";

export default function LeftPanel() {
  return (
    <aside className="w-64 h-full bg-muted text-foreground border-r border-border flex flex-col">
      <div className="flex-grow overflow-auto">
        <FileSidebar />
        <SidebarSeparator />
        <PaperCutSidebar />
      </div>
      <div className="border-t border-border p-4 mt-auto">
        <Chatbot />
      </div>
    </aside>
  );
}