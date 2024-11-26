// src/app/commands/paperCutCommands.ts

import { createCommand, LexicalCommand } from 'lexical';

export interface PaperCutContent {
  content: Array<{
    text: string;
    startTime: number;
    endTime: number;
    segmentId: string;
    speaker: string;
    fileId: string;
    wordIndex: number;
  }>;
}

export const RECEIVE_PAPERCUT_CONTENT: LexicalCommand<PaperCutContent> = 
  createCommand('RECEIVE_PAPERCUT_CONTENT');