// PaperCutCursorNode.ts
import { TextNode, EditorConfig, NodeKey, SerializedTextNode } from 'lexical';

export interface SerializedPaperCutCursorNode extends SerializedTextNode {
  type: 'cursor';
  version: 1;
}

export class PaperCutCursorNode extends TextNode {
  static override getType(): string {
    return 'cursor';
  }

  static override clone(node: PaperCutCursorNode): PaperCutCursorNode {
    return new PaperCutCursorNode("|", node.__key);
  }

  constructor(text: string, key?: NodeKey) {
    super("|", key);
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config);
    dom.style.cssText = `
      color: black;
      font-weight: bold;
      pointer-events: none;
    `;
    dom.classList.add('papercut-cursor');
    return dom;
  }

  override updateDOM(): boolean {
    return false;
  }

  exportJSON(): SerializedPaperCutCursorNode {
    return {
      ...super.exportJSON(),
      type: 'cursor',
      version: 1,
    };
  }

  static importJSON(serializedNode: any): PaperCutCursorNode {
    return new PaperCutCursorNode(serializedNode.text || '');
  }
}

export function $createPaperCutCursorNode(): PaperCutCursorNode {
  return new PaperCutCursorNode("|");
}

export function $isPaperCutCursorNode(node: any): node is PaperCutCursorNode {
  return node instanceof PaperCutCursorNode;
}