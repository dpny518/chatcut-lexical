// SpeakerNode.ts
import { ElementNode, NodeKey, LexicalNode, SerializedElementNode } from 'lexical';

export type SerializedSpeakerNode = SerializedElementNode & {
  speaker: string;
};

export class SpeakerNode extends ElementNode {
  __speaker: string;

  static getType(): string {
    return 'speaker';
  }

  static clone(node: SpeakerNode): SpeakerNode {
    return new SpeakerNode(node.__speaker, node.__key);
  }

  constructor(speaker: string, key?: NodeKey) {
    super(key);
    this.__speaker = speaker;
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('div');
    dom.classList.add('speaker-section');
    return dom;
}

  updateDOM(): boolean {
    return false;
  }

  getSpeaker(): string {
    return this.__speaker;
  }

  exportJSON(): SerializedSpeakerNode {
    return {
      ...super.exportJSON(),
      speaker: this.__speaker,
      type: 'speaker',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedSpeakerNode): SpeakerNode {
    const node = $createSpeakerNode(serializedNode.speaker);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }
}

export function $createSpeakerNode(speaker: string): SpeakerNode {
  return new SpeakerNode(speaker);
}

export function $isSpeakerNode(node: LexicalNode | null | undefined): node is SpeakerNode {
  return node instanceof SpeakerNode;
}