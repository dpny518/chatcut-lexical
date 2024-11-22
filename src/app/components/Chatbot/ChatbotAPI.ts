import axios from 'axios';

export const sendMessage = async (prompt: string): Promise<string> => {
  try {
    const response = await axios.post('/api/chat', { prompt });
    return response.data.message;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};