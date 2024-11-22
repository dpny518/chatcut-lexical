// Chatbot.tsx
import React, { useState } from 'react';
import { sendMessage } from './ChatbotAPI';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { FormattedWordsType } from '@/app/contexts/FormattedWordsContext';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (message: string, formattedWords: FormattedWordsType, selectedFileIds: string[]) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsTyping(true);
    console.log('FormattedWords in handleSendMessage:', formattedWords);
    console.log('Sending message:', {
      message,
      formattedWords,
      selectedFileIds
    });

    try {
      const response = await sendMessage(message, formattedWords, selectedFileIds);
      console.log('Received response:', response);
      
      // Create a formatted response string
      const formattedResponse = `
        Message: ${response.message}
        Formatted Content: ${JSON.stringify(response.formatted_content, null, 2)}
        Selected Files: ${JSON.stringify(response.selected_files, null, 2)}
      `;
      
      setMessages(prev => [...prev, { role: 'assistant', content: formattedResponse }]);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-64">
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