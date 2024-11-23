// ChatbotAPI.ts
import axios from 'axios';
import { FormattedWordsType } from '@/app/contexts/FormattedWordsContext';

interface ChatResponse {
  message: string;
  formatted_content: FormattedWordsType;
  selected_files: Record<string, any>;
}

export const sendMessage = async (
  prompt: string, 
  formattedWords: FormattedWordsType, 
  selectedFileIds: string[]
): Promise<ChatResponse> => {
  try {
    console.log('Sending request to API:', {
      prompt,
      formattedWords,
      selectedFileIds
    });

    const response = await axios.post<ChatResponse>('http://52.76.236.100:8000/api/v1/chat', {
      message: prompt,
      formatted_content: formattedWords,
      selected_files: Object.fromEntries(selectedFileIds.map(id => [id, {}]))
    });

    console.log('API response:', response.data);

    return response.data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
    }
    throw error;
  }
};