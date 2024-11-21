"use client";

import React from "react";
import { Editor } from "@/app/text-editor";

export default function CenterPanel() {
  return (
    <main className="flex-1 h-full bg-muted/50 text-foreground border-r border-border overflow-auto">
      <Editor />
    </main>
  );
}
