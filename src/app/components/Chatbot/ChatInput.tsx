import React, { useState } from 'react';
import { MessageInput } from "@/components/ui/message-input";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <MessageInput
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onSubmit={handleSubmit}
      placeholder="Type your message..."
    />
  );
};

export default ChatInput;