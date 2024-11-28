// src/hooks/useSegmentTimes.ts
import { useCallback } from 'react';
import { useFileSystem } from '@/app/contexts/FileSystemContext';

export function useSegmentTimes() {
  const { files } = useFileSystem();

  return useCallback((fileId: string, segmentId: string): { startTime: number, endTime: number } => {
    const fileItem = files[fileId];

    if (!fileItem) {
      console.error(`File with id ${fileId} not found`);
      return { startTime: -1, endTime: -1 };
    }

    try {
      const fileContent = JSON.parse(fileItem.content);
      
      if (!fileContent.processed_data || !fileContent.processed_data.transcript) {
        console.error(`File ${fileId} does not have the expected content structure`);
        return { startTime: -1, endTime: -1 };
      }

      const segments = fileContent.processed_data.transcript.segments;

      if (!Array.isArray(segments)) {
        console.error(`Invalid segments data for file ${fileId}`);
        return { startTime: -1, endTime: -1 };
      }

      // Find the segment by its ID
      const segment = segments.find(s => s.id === segmentId || s.segment_id === segmentId);

      if (segment) {
        return { 
          startTime: segment.start_time || segment.start || -1, 
          endTime: segment.end_time || segment.end || -1 
        };
      } else {
        console.error(`Segment with id ${segmentId} not found in file ${fileId}`);
        return { startTime: -1, endTime: -1 };
      }
    } catch (error) {
      console.error(`Error parsing file content for file ${fileId}:`, error);
      return { startTime: -1, endTime: -1 };
    }
  }, [files]);
}