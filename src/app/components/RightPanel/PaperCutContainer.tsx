import React, { useState } from 'react';
import { PaperCutSidebar } from '@/app/components/PaperCutSidebar';
import { PaperCutPanel } from '@/app/components/RightPanel/PaperCutPanel';
import { usePaperCut } from '@/app/contexts/PaperCutContext';

export const PaperCutContainer: React.FC = () => {
  const { tabs } = usePaperCut();
  const [, setUpdateTrigger] = useState(0);

  const forceUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-full">
      <PaperCutSidebar forceUpdate={forceUpdate} />
      <PaperCutPanel forceUpdate={forceUpdate} />
    </div>
  );
};