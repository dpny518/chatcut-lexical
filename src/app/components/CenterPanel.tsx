// CenterPanel.tsx
"use client";

import React from "react";
import { Editor } from "@/app/text-editor";
import { FormattedWordsProvider } from "@/app/contexts/FormattedWordsContext";

export default function CenterPanel() {
  return (
    <main className="flex-1 h-full bg-muted/50 text-foreground overflow-auto">
      <div className="max-w-3xl mx-auto w-full p-4"> {/* Adjusted padding */}
        <FormattedWordsProvider>
          <Editor />
        </FormattedWordsProvider>
      </div>
    </main>
  );
}