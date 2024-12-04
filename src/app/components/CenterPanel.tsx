"use client"

import React from "react";
import { Editor } from "@/app/text-editor";
import { FormattedWordsProvider } from "@/app/contexts/FormattedWordsContext";
import { usePaperCutOperations } from '@/app/components/RightPanel/ActiveEditorContext';

export default function CenterPanel() {
  const paperCutOperations = usePaperCutOperations();

  return (
    <main className="flex-1 h-full flex flex-col bg-[#0F0F0F]">
      <div className="flex-1 flex flex-col">
        <div className="bg-[#161616] px-6 py-4 border-b border-[#2A2A2A]">
          <h2 className="text-[#E1E1E1] text-lg">Source</h2>
        </div>
        <div className="flex-1">
          <FormattedWordsProvider>
            <Editor paperCutOperations={paperCutOperations} />
          </FormattedWordsProvider>
        </div>
      </div>
    </main>
  );
}