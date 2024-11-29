import {
  EditorConfig,
  ElementNode,
  LexicalNode,
  NodeKey,
  SerializedElementNode,
} from 'lexical';

export interface SerializedPaperCutSegmentNode extends SerializedElementNode {
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  isManualSplit: boolean;
}

export class PaperCutSegmentNode extends ElementNode {
  __startTime: number;
  __endTime: number;
  __segmentId: string;
  __speaker: string;
  __fileId: string;
  __isManualSplit: boolean;

  constructor(
    startTime: number,
    endTime: number,
    segmentId: string,
    speaker: string,
    fileId: string,
    isManualSplit: boolean = false,
    key?: NodeKey
  ) {
    super(key);
    this.__startTime = startTime;
    this.__endTime = endTime;
    this.__segmentId = segmentId;
    this.__speaker = speaker;
    this.__fileId = fileId;
    this.__isManualSplit = isManualSplit;
  }

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
      node.__isManualSplit,
      node.__key
    );
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    element.classList.add('papercut-segment');
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  exportJSON(): SerializedPaperCutSegmentNode {
    return {
      ...super.exportJSON(),
      type: 'papercut-segment',
      startTime: this.__startTime,
      endTime: this.__endTime,
      segmentId: this.__segmentId,
      speaker: this.__speaker,
      fileId: this.__fileId,
      isManualSplit: this.__isManualSplit,
    };
  }

  static importJSON(serializedNode: SerializedPaperCutSegmentNode): PaperCutSegmentNode {
    const node = new PaperCutSegmentNode(
      serializedNode.startTime,
      serializedNode.endTime,
      serializedNode.segmentId,
      serializedNode.speaker,
      serializedNode.fileId,
      serializedNode.isManualSplit
    );
    return node;
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

  getSpeaker(): string {
    return this.__speaker;
  }

  getFileId(): string {
    return this.__fileId;
  }

  isManualSplit(): boolean {
    return this.__isManualSplit;
  }

  setManualSplit(value: boolean): void {
    this.__isManualSplit = value;
  }
}

export function $createPaperCutSegmentNode(
  startTime: number,
  endTime: number,
  segmentId: string,
  speaker: string,
  fileId: string,
  isManualSplit: boolean = false
): PaperCutSegmentNode {
  return new PaperCutSegmentNode(startTime, endTime, segmentId, speaker, fileId, isManualSplit);
}

export function $isPaperCutSegmentNode(
  node: LexicalNode | null | undefined
): node is PaperCutSegmentNode {
  return node instanceof PaperCutSegmentNode;
}