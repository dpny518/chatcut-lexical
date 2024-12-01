import React from 'react';
import { PaperCutPanel } from './PaperCutPanel';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const RightPanel: React.FC = () => {
  return (
    <Card className="h-full border-none rounded-none flex flex-col flex-1">
      <CardHeader className="border-b flex-shrink-0 py-3 px-4">
        <CardTitle className="text-lg font-medium">PaperCut Panel</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 overflow-hidden">
        <PaperCutPanel />
      </CardContent>
    </Card>
  );
};

export default RightPanel;