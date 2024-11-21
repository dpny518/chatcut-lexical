// src/app/components/RightPanel.tsx
import React from 'react';
import { PaperCutPanel } from './PaperCutPanel';

const RightPanel: React.FC = () => {
  return (
    <div className="right-panel">
      <PaperCutPanel />
    </div>
  );
};

export default RightPanel;