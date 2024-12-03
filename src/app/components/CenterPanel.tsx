import React from "react";
import { Editor } from "@/app/text-editor";
import { FormattedWordsProvider } from "@/app/contexts/FormattedWordsContext";

export default function CenterPanel() {
  return (
    <main className="flex-1 h-full bg-editor-bg text-editor-text overflow-auto">
      <div className="w-full px-2">
        <FormattedWordsProvider>
          <Editor />
        </FormattedWordsProvider>
      </div>
    </main>
  );
}