import React from 'react';
import { TypingIndicator } from "@/components/ui/typing-indicator";

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isTyping }) => {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3/4 p-2 rounded ${role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
        {isTyping ? <TypingIndicator /> : content}
      </div>
    </div>
  );
};

export default ChatMessage;