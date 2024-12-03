import React from "react";
import { Editor } from "@/app/text-editor";
import { FormattedWordsProvider } from "@/app/contexts/FormattedWordsContext";
import { cn } from "@/lib/utils";

export default function CenterPanel() {
  return (
    <main className={cn(
      "flex-1 h-full overflow-auto",
      "bg-background text-foreground"
    )}>
      <div className="w-full px-2">
        <FormattedWordsProvider>
          <Editor />
        </FormattedWordsProvider>
      </div>
    </main>
  );
}