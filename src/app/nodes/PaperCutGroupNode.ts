import { EditorConfig, ElementNode, LexicalNode, NodeKey } from 'lexical';
import { $isPaperCutSegmentNode, PaperCutSegmentNode, SerializedPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { SerializedElementNode, SerializedLexicalNode } from 'lexical';

export interface SerializedPaperCutGroupNode extends SerializedElementNode {
  id: string;
  fileId: string;
  startTime: number;
  endTime: number;
  speaker: string;
  type: 'papercut-group';
  version: 1;
}

export class PaperCutGroupNode extends ElementNode {
  __id: string;
  __fileId: string;
  __startTime: number;
  __endTime: number;
  __speaker: string;

  static getType(): string {
    return 'papercut-group';
  }

  static clone(node: PaperCutGroupNode): PaperCutGroupNode {
    return new PaperCutGroupNode(
      node.__id,
      node.__fileId,
      node.__startTime,
      node.__endTime,
      node.__speaker,
      node.__key
    );
  }

  constructor(
    id: string,
    fileId: string,
    startTime: number,
    endTime: number,
    speaker: string,
    key?: NodeKey
  ) {
    super(key);
    this.__id = id;
    this.__fileId = fileId;
    this.__startTime = startTime;
    this.__endTime = endTime;
    this.__speaker = speaker;
  }

  static isValidChild(node: LexicalNode): boolean {
    return $isPaperCutSegmentNode(node);
  }

  getId(): string {
    return this.__id;
  }

  getFileId(): string {
    return this.__fileId;
  }

  getSpeaker(): string {
    return this.__speaker;
  }

  getStartTime(): number {
    return this.__startTime;
  }

  getEndTime(): number {
    return this.__endTime;
  }

  getSegments(): PaperCutSegmentNode[] {
    return this.getChildren()
      .filter((child): child is PaperCutSegmentNode => $isPaperCutSegmentNode(child));
  }

  exportJSON(): SerializedPaperCutGroupNode {
    return {
      ...super.exportJSON(),
      type: 'papercut-group',
      version: 1,
      id: this.__id,
      fileId: this.__fileId,
      startTime: this.__startTime,
      endTime: this.__endTime,
      speaker: this.__speaker,
    };
  }

  static importJSON(serializedNode: SerializedPaperCutGroupNode): PaperCutGroupNode {
    const node = new PaperCutGroupNode(
      serializedNode.id,
      serializedNode.fileId,
      serializedNode.startTime,
      serializedNode.endTime,
      serializedNode.speaker
    );

    const children = serializedNode.children.map((child: SerializedLexicalNode) => {
      if (child.type === 'papercut-segment') {
        return PaperCutSegmentNode.importJSON(child as SerializedPaperCutSegmentNode);
      }
      return null;
    }).filter((child): child is PaperCutSegmentNode => child !== null);

    if (children.length > 0) {
      node.append(...children);
    }

    return node;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('div');
    element.className = 'papercut-group-node';
    element.dataset.speaker = this.__speaker;
    element.dataset.groupId = this.__id;
    return element;
  }

  updateDOM(prevNode: PaperCutGroupNode, dom: HTMLElement): boolean {
    if (
      prevNode.__id !== this.__id ||
      prevNode.__speaker !== this.__speaker
    ) {
      dom.dataset.speaker = this.__speaker;
      dom.dataset.groupId = this.__id;
      return true;
    }
    return false;
  }

  static create(
    fileId: string,
    startTime: number,
    endTime: number,
    speaker: string
  ): PaperCutGroupNode {
    const id = `group-${speaker}-${Date.now()}`;
    return new PaperCutGroupNode(id, fileId, startTime, endTime, speaker);
  }

  updateTimeRange(startTime: number, endTime: number): void {
    this.__startTime = startTime;
    this.__endTime = endTime;
  }

  mergeWith(otherGroup: PaperCutGroupNode): void {
    this.__startTime = Math.min(this.__startTime, otherGroup.__startTime);
    this.__endTime = Math.max(this.__endTime, otherGroup.__endTime);
    this.append(...otherGroup.getChildren());
  }
}

export function $createPaperCutGroupNode(
  id: string,
  fileId: string,
  startTime: number,
  endTime: number,
  speaker: string
): PaperCutGroupNode {
  return new PaperCutGroupNode(id, fileId, startTime, endTime, speaker);
}

export function $isPaperCutGroupNode(
  node: LexicalNode | null | undefined
): node is PaperCutGroupNode {
  return node instanceof PaperCutGroupNode;
}