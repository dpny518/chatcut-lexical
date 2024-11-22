// ChatbotAPI.ts
import axios from 'axios';

export const sendMessage = async (prompt: string, formattedWords: any, selectedFiles: any): Promise<string> => {
  try {
    const response = await axios.post('http://52.76.236.100:8000/api/v1/chat', {
      message: prompt,
      formatted_content: formattedWords,
      selected_files: selectedFiles
    });
    return response.data.acknowledgement;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};