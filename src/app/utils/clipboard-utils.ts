import { ContentItem } from '@/app/contexts/PaperCutContext';

export function parseClipboardData(data: string): ContentItem[] {
  if (!data) {
    console.warn('No data provided to parseClipboardData');
    return [];
  }

  // Split by space while preserving metadata structure
  // Look for the pattern: word,number,number,number|
  const words = data.trim().split(/(?<=\|[^|]+\|[^|]+\|[^|]+)\s+/);
  const processedItems: ContentItem[] = [];

  for (const wordData of words) {
    if (!wordData.includes('|')) continue;

    try {
      // Find the pipe separators
      const lastPipeIndex = wordData.lastIndexOf('|');
      const secondLastPipeIndex = wordData.lastIndexOf('|', lastPipeIndex - 1);

      // Split into three main parts
      const wordPart = wordData.substring(0, secondLastPipeIndex);
      const segmentPart = wordData.substring(secondLastPipeIndex + 1, lastPipeIndex);
      const filePart = wordData.substring(lastPipeIndex + 1);

      // Parse word information
      const [word = '', startTime = '-1', endTime = '-1', wordIndex = '-1'] = wordPart.split(',');

      // Parse segment information
      const [segmentId = '', segmentStartTime = '0', segmentEndTime = '0', speaker = ''] = segmentPart.split(',');

      // Parse file information
      const lastCommaIndex = filePart.lastIndexOf(',');
      const fileName = filePart.substring(0, lastCommaIndex);
      const fileId = filePart.substring(lastCommaIndex + 1);

      const item: ContentItem = {
        word,
        startTime: parseFloat(startTime),
        endTime: parseFloat(endTime),
        wordIndex: parseInt(wordIndex),
        segmentId,
        segmentStartTime: parseFloat(segmentStartTime),
        segmentEndTime: parseFloat(segmentEndTime),
        speaker,
        fileName,
        fileId
      };

      processedItems.push(item);
    } catch (error) {
      console.error('Error parsing word data:', wordData, error);
    }
  }

  return processedItems;
}

export function formatWordMetadata(item: ContentItem): string {
  return `${item.word}|${item.startTime},${item.endTime},${item.wordIndex}|${item.segmentId},${item.segmentStartTime},${item.segmentEndTime},${item.speaker}|${item.fileName},${item.fileId}`;
}