import React, { useState, useEffect } from 'react';
import { sendMessage } from './ChatbotAPI';
import { generatePrompt } from './PromptTemplates';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatbotProps {
  formattedContent: {
    all_content: string[];
    bold_content: string[];
    italic_content: string[];
    strikethrough_content: string[];
    green_content: string[];
    red_content: string[];
  };
  mergedContent: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ formattedContent, mergedContent }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsTyping(true);

    const prompt = generatePrompt(message, formattedContent, mergedContent);
    try {
      const response = await sendMessage(prompt);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-auto p-4 space-y-4">
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