import { TextNode, NodeKey, SerializedTextNode, LexicalNode, EditorConfig, BaseSelection, RangeSelection } from 'lexical';

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

  clone(): PaperCutWordNode {
    return PaperCutWordNode.clone(this);
  }
  

// Override remove to handle word-level deletion

remove(preserveEmptyParent?: boolean): void {
  const latest = this.getLatest();
  if (latest.__key === this.__key) {
    this.selectPrevious();
    super.remove(preserveEmptyParent);
  }
}

replace<N extends LexicalNode>(replaceWith: N): N {
  const latest = this.getLatest();
  if (latest.__key === this.__key) {
    return super.replace(replaceWith);
  }
  return replaceWith;
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
    // Ensure text is always a string
    super(text || '', key);
    this.__startTime = startTime || 0;
    this.__endTime = endTime || 0;
    this.__segmentId = segmentId || '';
    this.__speaker = speaker || '';
    this.__fileId = fileId || '';
    this.__wordIndex = wordIndex || 0;

    // Add validation in development
    if (process.env.NODE_ENV !== 'production') {
      if (text === undefined || text === null) {
        console.warn('PaperCutWordNode: text is required');
      }
      if (startTime === undefined || startTime === null) {
        console.warn('PaperCutWordNode: startTime is required');
      }
      if (endTime === undefined || endTime === null) {
        console.warn('PaperCutWordNode: endTime is required');
      }
      if (!segmentId) {
        console.warn('PaperCutWordNode: segmentId is required');
      }
      if (!speaker) {
        console.warn('PaperCutWordNode: speaker is required');
      }
      if (!fileId) {
        console.warn('PaperCutWordNode: fileId is required');
      }
    }
  }

  // Override clone with safety checks
  static clone(node: PaperCutWordNode): PaperCutWordNode {
    // Ensure we have a valid node
    if (!node || typeof node !== 'object') {
      throw new Error('PaperCutWordNode.clone: Invalid node provided');
    }

  
    return new PaperCutWordNode(
      node.__text || '',
      node.__startTime || 0,
      node.__endTime || 0,
      node.__segmentId || '',
      node.__speaker || '',
      node.__fileId || '',
      node.__wordIndex || 0,
      node.__key
    );
  }

  // Override splitText with safety checks
// Override splitText with more robust error handling
splitText(splitOffset: number): [TextNode, TextNode] {
  // First check if split is possible
  const text = this.getTextContent();
  if (!text || splitOffset < 0 || splitOffset >= text.length) {
    // Return safe fallback if split isn't possible
    return [this, this.clone()];
  }

  try {
    // First let TextNode handle the basic split
    const [left, right] = super.splitText(splitOffset);
    
    // Calculate the proportional time for split point
    const timeRatio = splitOffset / text.length;
    const splitTime = this.__startTime + (this.__endTime - this.__startTime) * timeRatio;
    
    // Create new left node
    const leftNode = $createPaperCutWordNode(
      text.slice(0, splitOffset),
      this.__startTime,
      splitTime,
      this.__segmentId,
      this.__speaker,
      this.__fileId,
      this.__wordIndex
    );

    // Create new right node
    const rightNode = $createPaperCutWordNode(
      text.slice(splitOffset),
      splitTime,
      this.__endTime,
      this.__segmentId,
      this.__speaker,
      this.__fileId,
      this.__wordIndex + 1
    );

    return [leftNode, rightNode];
  } catch (error) {
    console.error('Error in PaperCutWordNode.splitText:', error);
    // Return a safe fallback
    const clone = this.clone();
    return [this, clone];
  }
}

  // Add safety checks to exported JSON
  exportJSON(): SerializedPaperCutWordNode {
    try {
      const baseJSON = super.exportJSON();
      return {
        ...baseJSON,
        startTime: this.__startTime || 0,
        endTime: this.__endTime || 0,
        segmentId: this.__segmentId || '',
        speaker: this.__speaker || '',
        fileId: this.__fileId || '',
        wordIndex: this.__wordIndex || 0,
        type: 'papercut-word',
        version: 1,
      };
    } catch (error) {
      console.error('Error in PaperCutWordNode.exportJSON:', error);
      // Return a safe fallback
      return {
        ...super.exportJSON(),
        startTime: 0,
        endTime: 0,
        segmentId: '',
        speaker: '',
        fileId: '',
        wordIndex: 0,
        type: 'papercut-word',
        version: 1,
      };
    }
  }

  // Add safety checks to JSON import
  static importJSON(serializedNode: SerializedPaperCutWordNode): PaperCutWordNode {
    try {
      const node = $createPaperCutWordNode(
        serializedNode.text || '',
        serializedNode.startTime || 0,
        serializedNode.endTime || 0,
        serializedNode.segmentId || '',
        serializedNode.speaker || '',
        serializedNode.fileId || '',
        serializedNode.wordIndex || 0
      );

      if (serializedNode.format) node.setFormat(serializedNode.format);
      if (serializedNode.detail) node.setDetail(serializedNode.detail);
      if (serializedNode.mode) node.setMode(serializedNode.mode);
      if (serializedNode.style) node.setStyle(serializedNode.style);

      return node;
    } catch (error) {
      console.error('Error in PaperCutWordNode.importJSON:', error);
      // Return a safe fallback
      return new PaperCutWordNode('', 0, 0, '', '', '', 0);
    }
  }

  // Rest of your methods with added safety checks
  mergeWithSibling(target: TextNode): TextNode {
    return this;
  }

  insertText(): null {
    return null;
  }

  select(anchorOffset?: number, focusOffset?: number): RangeSelection {
    const selection = super.select(anchorOffset, focusOffset);
    if (typeof focusOffset === 'undefined') {
      selection.focus.offset = this.getTextContentSize();
    }
    return selection;
  }

  // Add getter safety checks
  getStartTime(): number {
    return this.__startTime || 0;
  }

  getEndTime(): number {
    return this.__endTime || 0;
  }

  getSegmentId(): string {
    return this.__segmentId || '';
  }

  getSpeaker(): string {
    return this.__speaker || '';
  }

  getFileId(): string {
    return this.__fileId || '';
  }

  getWordIndex(): number {
    return this.__wordIndex || 0;
  }

  setFileId(fileId: string): void {
    this.__fileId = fileId || '';
  }
  

  // Add a static method to create a new PaperCutWordNode
  static create(
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

  // Add a method to merge this word with another word
  mergeWith(otherWord: PaperCutWordNode): void {
    this.__text += otherWord.__text; // Concatenate the text of the two words
    this.__endTime = otherWord.__endTime; // Update the end time to the end time of the other word
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
  try {
    return new PaperCutWordNode(
      text || '',
      startTime || 0,
      endTime || 0,
      segmentId || '',
      speaker || '',
      fileId || '',
      wordIndex || 0
    );
  } catch (error) {
    console.error('Error creating PaperCutWordNode:', error);
    // Return a safe fallback node
    return new PaperCutWordNode('', 0, 0, '', '', '', 0);
  }
}


export function $isPaperCutWordNode(node: LexicalNode | null | undefined): node is PaperCutWordNode {
  return node instanceof PaperCutWordNode;
}
