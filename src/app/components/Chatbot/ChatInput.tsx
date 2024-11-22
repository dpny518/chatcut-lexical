// ChatInput.tsx
"use client"

import React, { useRef, useState, useEffect } from 'react';
import { ChatForm } from "@/components/ui/chat";
import { MessageInput } from "@/components/ui/message-input";
import { useEditorContent } from '@/app/contexts/EditorContentContext';
import { useFormattedWords, FormattedWordsType } from '@/app/contexts/FormattedWordsContext';

interface ChatInputProps {
  onSendMessage: (message: string, formattedWords: FormattedWordsType, selectedFileIds: string[]) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [value, setValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { selectedFileIds } = useEditorContent();
  const { formattedWords } = useFormattedWords();
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    console.log('FormattedWords updated in ChatInput:', formattedWords);
  }, [formattedWords]);

  console.log('FormattedWords in ChatInput:', formattedWords);

  const cancelTimeout = () => {
    if (timeout.current) {
      window.clearTimeout(timeout.current);
    }
  };

  const setNewTimeout = (callback: () => void, ms: number) => {
    cancelTimeout();
    const id = window.setTimeout(callback, ms);
    timeout.current = id;
  };

  const handleSubmit = () => {
    if (value.trim()) {
      onSendMessage(value.trim(), formattedWords, selectedFileIds);
      setValue("");
      setIsGenerating(true);
      setNewTimeout(() => {
        setIsGenerating(false);
      }, 2000);
    }
  };

  return (
    <ChatForm
      className="w-full"
      isPending={false}
      handleSubmit={(event) => {
        event?.preventDefault?.();
        handleSubmit();
      }}
    >
      {() => (
        <MessageInput
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
          onSubmit={handleSubmit}
          placeholder="Type your message..."
          stop={() => {
            setIsGenerating(false);
            cancelTimeout();
          }}
          isGenerating={isGenerating}
        />
      )}
    </ChatForm>
  );
};

export default ChatInput;