// PromptTemplates.ts
import { FileSystemItem } from "@/app/contexts/FileSystemContext";

type FormattedWordsType = {
  all_content: string[];
  bold_content: string[];
  italic_content: string[];
  strikethrough_content: string[];
  green_content: string[];
  red_content: string[];
};

export const generatePrompt = (
  userMessage: string,
  formattedWords: FormattedWordsType,
  selectedFiles: { [id: string]: FileSystemItem }
): string => {
  const fileContents = Object.entries(selectedFiles)
    .map(([id, file]) => {
      let content;
      try {
        content = JSON.parse(file.content);
        // Assuming the parsed content has a structure like { file_info: { ... }, processed_data: { ... } }
        return `File ${id} (${file.name}):\n${JSON.stringify(content.processed_data, null, 2)}`;
      } catch (error) {
        console.error(`Error parsing content for file ${id}:`, error);
        return `File ${id} (${file.name}):\nError parsing content`;
      }
    })
    .join('\n\n');

  return `
    User Message: ${userMessage}

    Selected Files Content:
    ${fileContents}

    Formatted Content:
    Bold: ${formattedWords.bold_content.join(', ')}
    Italic: ${formattedWords.italic_content.join(', ')}
    Strikethrough: ${formattedWords.strikethrough_content.join(', ')}
    Green Highlight: ${formattedWords.green_content.join(', ')}
    Red Highlight: ${formattedWords.red_content.join(', ')}

    Please provide a response based on the above information, focusing on the content of the selected files and the formatted text.
  `;
};