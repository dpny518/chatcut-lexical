// src/types/transcript.ts

export interface Word {
    word: string;
    word_id: string;
    word_index: string;
  }
  
  export interface Segment {
    segment_id: string;
    speaker: string;
    start_time: number;
    end_time: number;
    text: string;
    words: Word[];
  }
  
    export interface Transcript {
      segments: Segment[];
    }
  
    export interface ProcessedData {
      project_id: string;
      media: {
        id: string;
        source: string;
        duration: number;
        uploaded_on: string;
      };
      transcript: Transcript;
    }
  
    export interface FileContent {
      file_info: {
        file_id: string;
        original_path: string;
        processed_path: string;
      };
      processed_data: ProcessedData;
    }