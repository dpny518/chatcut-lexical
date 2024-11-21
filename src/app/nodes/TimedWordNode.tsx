import { TextNode } from 'lexical';

export interface TimedWordData {
  text: string;
  startTime: number;
  endTime: number;
  segmentId: string;
  fileRef: string;
}

export class TimedWordNode extends TextNode {
  __startTime: number;
  __endTime: number;
  __segmentId: string;
  __fileRef: string;

  static getType(): string {
    return 'timed-word';
  }

  static clone(node: TimedWordNode): TimedWordNode {
    return new TimedWordNode(
      node.__text,
      {
        startTime: node.__startTime,
        endTime: node.__endTime,
        segmentId: node.__segmentId,
        fileRef: node.__fileRef
      }
    );
  }

  constructor(text: string, data?: Partial<TimedWordData>) {
    super(text);
    this.__startTime = data?.startTime ?? -1;
    this.__endTime = data?.endTime ?? -1;
    this.__segmentId = data?.segmentId ?? '';
    this.__fileRef = data?.fileRef ?? '';
  }

  getStartTime(): number {
    return this.__startTime;
  }

  getEndTime(): number {
    return this.__endTime;
  }

  getSegmentId(): string {
    return this.__segmentId;
  }

  getFileRef(): string {
    return this.__fileRef;
  }
}

export function $createTimedWordNode(text: string, data?: Partial<TimedWordData>): TimedWordNode {
  return new TimedWordNode(text, data);
}

export function $isTimedWordNode(node: any): node is TimedWordNode {
  return node instanceof TimedWordNode;
}
