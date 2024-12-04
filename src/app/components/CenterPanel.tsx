"use client"

import React from "react";
import { Editor } from "@/app/text-editor";
import { FormattedWordsProvider } from "@/app/contexts/FormattedWordsContext";
import { usePaperCutOperations } from '@/app/components/RightPanel/ActiveEditorContext';

export default function CenterPanel() {
  const paperCutOperations = usePaperCutOperations();

  return (
    <main className="flex-1 h-full bg-gray-900 text-gray-200">
      <div className="max-w-3xl mx-auto py-8">
        <div className="p-6 bg-gray-800 rounded shadow-md">
          <h2 className="text-xl font-semibold">Source</h2>
          <FormattedWordsProvider>
            <Editor paperCutOperations={paperCutOperations} />
          </FormattedWordsProvider>
        </div>
      </div>
    </main>
  );
}