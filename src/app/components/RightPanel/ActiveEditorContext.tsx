// ActiveEditorContext.tsx
"use client"
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveEditorContextType {
  activeEditor: string | null;
  setActiveEditor: React.Dispatch<React.SetStateAction<string | null>>;
}

const ActiveEditorContext = createContext<ActiveEditorContextType | null>(null);

interface ActiveEditorProviderProps {
  children: ReactNode;
}

export const ActiveEditorProvider = ({ children }: ActiveEditorProviderProps) => {
  const [activeEditor, setActiveEditor] = useState<string | null>(null);

  return (
    <ActiveEditorContext.Provider value={{ activeEditor, setActiveEditor }}>
      {children}
    </ActiveEditorContext.Provider>
  );
};

export const useActiveEditor = (): ActiveEditorContextType => {
  const context = useContext(ActiveEditorContext);
  if (context === null) {
    throw new Error('useActiveEditor must be used within an ActiveEditorProvider');
  }
  return context;
};