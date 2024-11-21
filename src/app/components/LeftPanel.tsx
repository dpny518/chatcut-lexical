"use client";

import React from "react";
import { AppSidebar } from "@/app/components/AppSideBar";

export default function LeftPanel() {
  return (
    <aside className="w-64 h-full bg-muted text-foreground border-r border-border">
      <AppSidebar />
    </aside>
  );
}
