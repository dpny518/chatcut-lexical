export const generatePrompt = (
    userMessage: string,
    formattedContent: {
      all_content: string[];
      bold_content: string[];
      italic_content: string[];
      strikethrough_content: string[];
      green_content: string[];
      red_content: string[];
    },
    mergedContent: string
  ): string => {
    return `
      User Message: ${userMessage}
  
      Document Content:
      ${mergedContent}
  
      Formatted Content:
      Bold: ${formattedContent.bold_content.join(', ')}
      Italic: ${formattedContent.italic_content.join(', ')}
      Strikethrough: ${formattedContent.strikethrough_content.join(', ')}
      Green Highlight: ${formattedContent.green_content.join(', ')}
      Red Highlight: ${formattedContent.red_content.join(', ')}
  
      Please provide a response based on the above information.
    `;
  };