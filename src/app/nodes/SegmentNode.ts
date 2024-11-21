// SegmentNode.ts
import { ElementNode, NodeKey, LexicalNode, SerializedElementNode } from 'lexical';
import { $createTextNode } from 'lexical';

export type SerializedSegmentNode = SerializedElementNode & {
  startTime: number;
  endTime: number;
  segmentId: string;
  speaker: string;
  fileId: string;
};

export class SegmentNode extends ElementNode {
  __startTime: number;
  __endTime: number;
  __segmentId: string;
  __speaker: string;
  __fileId: string;

  static getType(): string {
    return 'segment';
  }

  static clone(node: SegmentNode): SegmentNode {
    return new SegmentNode(
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

  // ... getter and setter methods for all properties

  createDOM(): HTMLElement {
    const dom = document.createElement('span');
    dom.classList.add('segment');
    return dom;
}

  updateDOM(): boolean {
    return false;
  }

  exportJSON(): SerializedSegmentNode {
    return {
      ...super.exportJSON(),
      startTime: this.__startTime,
      endTime: this.__endTime,
      segmentId: this.__segmentId,
      speaker: this.__speaker,
      fileId: this.__fileId,
      type: 'segment',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedSegmentNode): SegmentNode {
    const node = $createSegmentNode(
      '',
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

export function $createSegmentNode(
  text: string,
  startTime: number,
  endTime: number,
  segmentId: string,
  speaker: string,
  fileId: string
): SegmentNode {
  const segment = new SegmentNode(startTime, endTime, segmentId, speaker, fileId);
  segment.append($createTextNode(text));
  return segment;
}

export function $isSegmentNode(node: LexicalNode | null | undefined): node is SegmentNode {
  return node instanceof SegmentNode;
}