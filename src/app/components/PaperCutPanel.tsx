import React from 'react';
import { PaperCutSidebar } from './PaperCutSidebar';

interface Props {
  forceUpdate: () => void;
}

export const PaperCutPanel: React.FC<Props> = ({ forceUpdate }) => {
  return (
    <div>
      <PaperCutSidebar forceUpdate={forceUpdate} />
    </div>
  );
}; 