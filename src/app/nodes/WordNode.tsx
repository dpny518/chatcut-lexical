import { TextNode, NodeKey, SerializedTextNode, LexicalNode, EditorConfig } from 'lexical';

export type SerializedWordNode = SerializedTextNode & {
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
  wordIndex: number;
};

export class WordNode extends TextNode {
  __startTime: number;
  __endTime: number;
  __segmentId: string;
  __speaker: string;
  __fileId: string;
  __wordIndex: number;

  static getType(): string {
    return 'word';
  }

  static clone(node: WordNode): WordNode {
    return new WordNode(
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
    dom.style.borderBottom = '1px dotted #999';
    dom.title = `${this.__startTime} - ${this.__endTime}`;
    return dom;
  }

  updateDOM(prevNode: WordNode, dom: HTMLElement, config: EditorConfig): boolean {
    const updated = super.updateDOM(prevNode, dom, config);
    if (
      this.__startTime !== prevNode.__startTime ||
      this.__endTime !== prevNode.__endTime
    ) {
      dom.title = `${this.__startTime} - ${this.__endTime}`;
      return true;
    }
    return updated;
  }

  setStartTime(startTime: number) {
    const self = this.getWritable();
    self.__startTime = startTime;
  }

  getStartTime(): number {
    const self = this.getLatest();
    return self.__startTime;
  }

  setEndTime(endTime: number) {
    const self = this.getWritable();
    self.__endTime = endTime;
  }

  getEndTime(): number {
    const self = this.getLatest();
    return self.__endTime;
  }

  setSegmentId(segmentId: string) {
    const self = this.getWritable();
    self.__segmentId = segmentId;
  }

  getSegmentId(): string {
    const self = this.getLatest();
    return self.__segmentId;
  }

  setSpeaker(speaker: string) {
    const self = this.getWritable();
    self.__speaker = speaker;
  }

  getSpeaker(): string {
    const self = this.getLatest();
    return self.__speaker;
  }

  setFileId(fileId: string) {
    const self = this.getWritable();
    self.__fileId = fileId;
  }

  getFileId(): string {
    const self = this.getLatest();
    return self.__fileId;
  }

  setWordIndex(wordIndex: number) {
    const self = this.getWritable();
    self.__wordIndex = wordIndex;
  }

  getWordIndex(): number {
    const self = this.getLatest();
    return self.__wordIndex;
  }

  exportJSON(): SerializedWordNode {
    return {
      ...super.exportJSON(),
      startTime: this.getStartTime(),
      endTime: this.getEndTime(),
      segmentId: this.getSegmentId(),
      speaker: this.getSpeaker(),
      fileId: this.getFileId(),
      wordIndex: this.getWordIndex(),
      type: 'word',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedWordNode): WordNode {
    const node = $createWordNode(
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

export function $createWordNode(
  text: string,
  startTime: number,
  endTime: number,
  segmentId: string,
  speaker: string,
  fileId: string,
  wordIndex: number
): WordNode {
  return new WordNode(text, startTime, endTime, segmentId, speaker, fileId, wordIndex);
}

export function $isWordNode(node: LexicalNode | null | undefined): node is WordNode {
  return node instanceof WordNode;
}