// src/app/nodes/PaperCutWordNode.ts
import { TextNode, NodeKey, SerializedTextNode, LexicalNode, EditorConfig } from 'lexical';

export type SerializedPaperCutWordNode = SerializedTextNode & {
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  wordIndex: number;
  type: 'papercut-word';
  version: 1;
};

export class PaperCutWordNode extends TextNode {
  __startTime: number;
  __endTime: number;
  __segmentId: string;
  __speaker: string;
  __fileId: string;
  __wordIndex: number;

  static getType(): string {
    return 'papercut-word';
  }
  
  splitText(splitOffset: number): [PaperCutWordNode, PaperCutWordNode] {
    const [left, right] = super.splitText(splitOffset);
    const leftNode = new PaperCutWordNode(
      left.__text,
      this.__startTime,
      this.__startTime + (this.__endTime - this.__startTime) * (splitOffset / this.__text.length),
      this.__segmentId,
      this.__speaker,
      this.__fileId,
      this.__wordIndex
    );
    const rightNode = new PaperCutWordNode(
      right.__text,
      leftNode.__endTime,
      this.__endTime,
      this.__segmentId,
      this.__speaker,
      this.__fileId,
      this.__wordIndex + 1
    );
    return [leftNode, rightNode];
  }
  static clone(node: PaperCutWordNode): PaperCutWordNode {
    return new PaperCutWordNode(
      node.__text,
      node.__startTime,
      node.__endTime,
      node.__segmentId,
      node.__speaker,
      node.__fileId,
      node.__wordIndex,
      node.__key
    );
  }

  constructor(
    text: string,
    startTime: number,
    endTime: number,
    segmentId: string,
    speaker: string,
    fileId: string,
    wordIndex: number,
    key?: NodeKey,
  ) {
    super(text, key);
    this.__startTime = startTime;
    this.__endTime = endTime;
    this.__segmentId = segmentId;
    this.__speaker = speaker;
    this.__fileId = fileId;
    this.__wordIndex = wordIndex;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.classList.add('papercut-word');
    return dom;
  }

  updateDOM(prevNode: PaperCutWordNode, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    // Add any additional update logic here if needed
    return updated;
  }

  // Add getters and setters as needed
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

  getWordIndex(): number {
    return this.__wordIndex;
  }

  exportJSON(): SerializedPaperCutWordNode {
    return {
      ...super.exportJSON(),
      startTime: this.__startTime,
      endTime: this.__endTime,
      segmentId: this.__segmentId,
      speaker: this.__speaker,
      fileId: this.__fileId,
      wordIndex: this.__wordIndex,
      type: 'papercut-word',
      version: 1,
    };
  }
  
  static importJSON(serializedNode: SerializedPaperCutWordNode): PaperCutWordNode {
    const node = $createPaperCutWordNode(
      serializedNode.text,
      serializedNode.startTime,
      serializedNode.endTime,
      serializedNode.segmentId,
      serializedNode.speaker,
      serializedNode.fileId,
      serializedNode.wordIndex
    );
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }
  

}


export function $createPaperCutWordNode(
  text: string,
  startTime: number,
  endTime: number,
  segmentId: string,
  speaker: string,
  fileId: string,
  wordIndex: number
): PaperCutWordNode {
  return new PaperCutWordNode(text, startTime, endTime, segmentId, speaker, fileId, wordIndex);
}

export function $isPaperCutWordNode(node: any): node is PaperCutWordNode {
  return node instanceof PaperCutWordNode;
}