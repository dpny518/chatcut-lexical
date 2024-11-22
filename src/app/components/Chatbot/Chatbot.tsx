// Chatbot.tsx
import React, { useState } from 'react';
import { sendMessage } from './ChatbotAPI';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useEditorContent } from '@/app/contexts/EditorContentContext';
import { useFormattedWords } from '@/app/contexts/FormattedWordsContext';
import { useFileSystem, FileSystemItem } from "@/app/contexts/FileSystemContext";

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { selectedFileIds } = useEditorContent();
  const { formattedWords } = useFormattedWords();
  const { files } = useFileSystem();

  const handleSendMessage = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsTyping(true);

    // Get the selected files
    const selectedFiles = selectedFileIds.reduce((acc, id) => {
      if (files[id]) {
        acc[id] = files[id];
      }
      return acc;
    }, {} as { [id: string]: FileSystemItem });

    try {
      const response = await sendMessage(message, formattedWords, selectedFiles);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-64"> {/* Adjust height as needed */}
      <div className="flex-grow overflow-auto p-2 space-y-2">
        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}
        {isTyping && <ChatMessage role="assistant" content="Typing..." isTyping />}
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Chatbot;