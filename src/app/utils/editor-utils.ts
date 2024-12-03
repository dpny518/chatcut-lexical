import { ContentItem } from '@/app/contexts/PaperCutContext';
import { parseClipboardData } from '@/app/utils/clipboard-utils';

export const handlePaste = (
  clipboardData: string | undefined,
  existingContent: ContentItem[],
  cursorPosition: number | null,
  appendToEnd: boolean = false
): ContentItem[] => {
  if (!clipboardData) {
    console.warn('No clipboard data provided to handlePaste');
    return existingContent;
  }

  console.log('Clipboard data received:', clipboardData);

  try {
    const newWords = parseClipboardData(clipboardData);
    console.log('Parsed new words:', newWords);
    
    if (newWords.length === 0) {
      console.warn('No valid words parsed from clipboard data');
      return existingContent;
    }
    
    let insertIndex: number;
    
    if (appendToEnd) {
      insertIndex = existingContent.length;
    } else if (cursorPosition !== null) {
      insertIndex = cursorPosition;
    } else {
      insertIndex = existingContent.length; // Default to end if no cursor position
    }

    console.log('Insert index:', insertIndex);

    // Create a new array with the pasted content inserted at the right position
    const updatedContent = [
      ...existingContent.slice(0, insertIndex),
      ...newWords,
      ...existingContent.slice(insertIndex)
    ];

    // Adjust word indices for the entire content
    const finalContent = updatedContent.map((item, index) => ({
      ...item,
      wordIndex: index
    }));

    console.log('Final content:', finalContent);
    return finalContent;

  } catch (error) {
    console.error('Error parsing pasted content:', error);
    return existingContent;
  }
};