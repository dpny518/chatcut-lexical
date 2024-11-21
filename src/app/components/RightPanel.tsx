// src/app/components/RightPanel.tsx
import React from 'react';
import { PaperCutPanel } from './PaperCutPanel';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const RightPanel: React.FC = () => {
  return (
    <Card className="h-full border-l border-border flex flex-col">
      <CardHeader className="border-b flex-shrink-0 py-3">
        <CardTitle className="text-lg">PaperCut Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto p-0">
        <div className="p-4">
          <PaperCutPanel />
        </div>
      </CardContent>
    </Card>
  );
};

export default RightPanel;