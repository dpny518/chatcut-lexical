import { ElementNode, NodeKey, SerializedElementNode } from 'lexical';

export type SerializedPaperCutSegmentNode = SerializedElementNode & {
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
};

export class PaperCutSegmentNode extends ElementNode {
  __startTime: number;
  __endTime: number;
  __segmentId: string;
  __speaker: string;
  __fileId: string;

  static getType(): string {
    return 'papercut-segment';
  }

  static clone(node: PaperCutSegmentNode): PaperCutSegmentNode {
    return new PaperCutSegmentNode(
      node.__startTime,
      node.__endTime,
      node.__segmentId,
      node.__speaker,
      node.__fileId,
      node.__key
    );
  }

  constructor(
    startTime: number,
    endTime: number,
    segmentId: string,
    speaker: string,
    fileId: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__startTime = startTime;
    this.__endTime = endTime;
    this.__segmentId = segmentId;
    this.__speaker = speaker;
    this.__fileId = fileId;
  }

  // Getter methods
  getStartTime(): number {
    return this.__startTime;
  }

  getEndTime(): number {
    return this.__endTime;
  }

  // Add setter methods
  setStartTime(time: number): void {
    const writable = this.getWritable();
    writable.__startTime = time;
  }

  setEndTime(time: number): void {
    const writable = this.getWritable();
    writable.__endTime = time;
  }

  getSegmentId(): string {
    return this.__segmentId;
  }

  getSpeaker(): string {
    return this.__speaker;
  }

  getFileId(): string {
    return this.__fileId;
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('papercut-segment');
    
    const timestampWrapper = document.createElement('div');
    timestampWrapper.classList.add('timestamp-wrapper');
    
    const timestamp = document.createElement('span');
    timestamp.classList.add('segment-timestamp');
    const time = this.__startTime;
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    timestamp.textContent = `[${minutes}:${String(seconds).padStart(2, '0')}]`;
    
    timestampWrapper.appendChild(timestamp);
    dom.appendChild(timestampWrapper);
    
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }

  exportJSON(): SerializedPaperCutSegmentNode {
    return {
      ...super.exportJSON(),
      startTime: this.__startTime,
      endTime: this.__endTime,
      segmentId: this.__segmentId,
      speaker: this.__speaker,
      fileId: this.__fileId,
      type: 'papercut-segment',
      version: 1,
    };
  }
  
  static importJSON(serializedNode: SerializedPaperCutSegmentNode): PaperCutSegmentNode {
    const node = $createPaperCutSegmentNode(
      serializedNode.startTime,
      serializedNode.endTime,
      serializedNode.segmentId,
      serializedNode.speaker,
      serializedNode.fileId
    );
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
}

export function $createPaperCutSegmentNode(
  startTime: number,
  endTime: number,
  segmentId: string,
  speaker: string,
  fileId: string
): PaperCutSegmentNode {
  return new PaperCutSegmentNode(startTime, endTime, segmentId, speaker, fileId);
}

export function $isPaperCutSegmentNode(node: any): node is PaperCutSegmentNode {
  return node instanceof PaperCutSegmentNode;
}