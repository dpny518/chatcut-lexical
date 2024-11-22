//src/app/contexts/FormattedWordsContext.tsx
'use client'
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export type FormattedWordsProviderProps = { children: React.ReactNode };

export type FormattedWordsType = {
  all_content: string[];
  bold_content: string[];
  italic_content: string[];
  strikethrough_content: string[];
  green_content: string[];
  red_content: string[];
};

type FormattedWordsContextType = {
  formattedWords: FormattedWordsType;
  setFormattedWords: React.Dispatch<React.SetStateAction<FormattedWordsType>>;
};

const FormattedWordsContext = createContext<FormattedWordsContextType | undefined>(undefined);

export const FormattedWordsProvider: React.FC<FormattedWordsProviderProps> = ({ children })  => {
  const [formattedWords, setFormattedWords] = useState<FormattedWordsType>({
    all_content: [],
    bold_content: [],
    italic_content: [],
    strikethrough_content: [],
    green_content: [],
    red_content: [],
  });

  useEffect(() => {
    console.log('Formatted Words State Updated:', formattedWords);
  }, [formattedWords]);

  const setFormattedWordsWithLogging = (newState: React.SetStateAction<FormattedWordsType>) => {
    setFormattedWords((prevState) => {
      const nextState = typeof newState === 'function' ? newState(prevState) : newState;
      console.log('Formatted Words State Change:', {
        prev: prevState,
        next: nextState,
        changes: Object.keys(nextState).reduce((acc, key) => {
          if (JSON.stringify(prevState[key as keyof FormattedWordsType]) !== JSON.stringify(nextState[key as keyof FormattedWordsType])) {
            acc[key as keyof FormattedWordsType] = nextState[key as keyof FormattedWordsType];
          }
          return acc;
        }, {} as Partial<FormattedWordsType>),
      });
      return nextState;
    });
  };

  return (
    <FormattedWordsContext.Provider value={{ formattedWords, setFormattedWords: setFormattedWordsWithLogging }}>
      {children}
    </FormattedWordsContext.Provider>
  );
};

export const useFormattedWords = () => {
    const context = useContext(FormattedWordsContext);
    if (context === undefined) {
      console.warn('useFormattedWords must be used within a FormattedWordsProvider');
      return {
        formattedWords: {
          all_content: [],
          bold_content: [],
          italic_content: [],
          strikethrough_content: [],
          green_content: [],
          red_content: [],
        },
        setFormattedWords: () => {},
      };
    }
    return context;
  };