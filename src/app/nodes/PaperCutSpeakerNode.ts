// src/app/nodes/PaperCutSpeakerNode.ts
import { ElementNode, NodeKey, SerializedElementNode } from 'lexical';

export type SerializedPaperCutSpeakerNode = SerializedElementNode & {
  speaker: string;
};

export class PaperCutSpeakerNode extends ElementNode {
  __speaker: string;

  static getType(): string {
    return 'papercut-speaker';
  }

  static clone(node: PaperCutSpeakerNode): PaperCutSpeakerNode {
    return new PaperCutSpeakerNode(node.__speaker, node.__key);
  }

  constructor(speaker: string, key?: NodeKey) {
    super(key);
    this.__speaker = speaker;
  }

  getSpeaker(): string {
    return this.__speaker;
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('papercut-speaker');
    return dom;
  }

  updateDOM(): boolean {
    return false;
  }
  exportJSON(): SerializedPaperCutSpeakerNode {
    return {
      ...super.exportJSON(),
      speaker: this.__speaker,
      type: 'papercut-speaker',
      version: 1,
    };
  }
  
  static importJSON(serializedNode: SerializedPaperCutSpeakerNode): PaperCutSpeakerNode {
    const node = $createPaperCutSpeakerNode(serializedNode.speaker);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
  
}

export function $createPaperCutSpeakerNode(speaker: string): PaperCutSpeakerNode {
  return new PaperCutSpeakerNode(speaker);
}

export function $isPaperCutSpeakerNode(node: any): node is PaperCutSpeakerNode {
  return node instanceof PaperCutSpeakerNode;
}