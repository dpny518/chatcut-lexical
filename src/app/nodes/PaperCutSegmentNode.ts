import { ElementNode, NodeKey, SerializedElementNode, $getSelection} from 'lexical';

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
    const container = document.createElement('div');
    container.className = 'PaperCutSegmentNode';
    container.setAttribute('data-segment', this.__key);
    
    // Create a wrapper for the content to maintain proper alignment
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'segment-content';
    container.appendChild(contentWrapper);
    
    return container;
  }
  updateDOM(prevNode: PaperCutSegmentNode, dom: HTMLElement): boolean {
    // Update any attributes that might affect dragging
    if (prevNode.__speaker !== this.__speaker) {
      dom.dataset.speaker = this.__speaker;
      return true;
    }
    return false;
  }

  // Add methods required for dragging
  canInsertAfter(node: ElementNode): boolean {
    return true;
  }

  canReplaceWith(replacement: ElementNode): boolean {
    return replacement instanceof PaperCutSegmentNode;
  }

  canMergeWith(node: ElementNode): boolean {
    return false; // Typically segments shouldn't merge
  }

  // Implement insertNewAfter for drag and drop support
  insertNewAfter(): ElementNode | null {
    const newElement = $createPaperCutSegmentNode(
      this.__startTime,
      this.__endTime,
      this.__segmentId,
      this.__speaker,
      this.__fileId
    );
    
    const selection = $getSelection();
    if (selection) {
      selection.insertNodes([newElement]);
    }
    return newElement;
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