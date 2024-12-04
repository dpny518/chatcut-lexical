import { ContentItem } from '@/app/types/papercut';

export function parseClipboardData(data: string): ContentItem[] {
  if (!data) {
    console.warn('No data provided to parseClipboardData');
    return [];
  }

  const words = data.trim().split(' ');
  const processedItems: ContentItem[] = [];

  for (const wordData of words) {
    const [wordPart, segmentPart, filePart] = wordData.split('|');

    if (!wordPart || !segmentPart || !filePart) continue;

    try {
      const [word, startTime, endTime, wordIndex] = wordPart.split(',');
      const [segmentId, segmentStartTime, segmentEndTime, speaker] = segmentPart.split(',');
      const [fileName, fileId] = filePart.split(',');

      const item: ContentItem = {
        word,
        startTime: parseFloat(startTime),
        endTime: parseFloat(endTime),
        wordIndex: parseInt(wordIndex),
        segmentId,
        segmentStartTime: parseFloat(segmentStartTime),
        segmentEndTime: parseFloat(segmentEndTime),
        speaker,
        fileName,
        fileId
      };

      processedItems.push(item);
    } catch (error) {
      console.error('Error parsing word data:', wordData, error);
    }
  }

  return processedItems;
}
  
  export function formatWordMetadata(item: ContentItem): string {
    return `${item.word},${item.startTime},${item.endTime},${item.wordIndex}|${item.segmentId},${item.segmentStartTime},${item.segmentEndTime},${item.speaker}|${item.fileName},${item.fileId}`;
  }
  
  export function handleClipboardCopy(event: ClipboardEvent, selection: Selection) {
    if (!selection || selection.rangeCount === 0) return;
  
    const range = selection.getRangeAt(0);
    const selectedWordElements = Array.from(document.querySelectorAll('[data-word-metadata]'))
      .filter(element => range.intersectsNode(element));
  
    if (selectedWordElements.length > 0) {
      const metadata = selectedWordElements
        .map(element => element.getAttribute('data-word-metadata'))
        .filter((meta): meta is string => meta !== null)
        .join(' ');
  
      if (metadata) {
        event.preventDefault();
        event.clipboardData?.setData('text/plain', metadata);
      }
    }
  }

export function findParentBlock(node: Node): HTMLElement | null {
    let current: Node | null = node;
    while (current && !(current instanceof HTMLElement && current.hasAttribute('data-block'))) {
      current = current.parentNode;
      if (!current || current === document.body) {
        return null;
      }
    }
    return current as HTMLElement;
  }
  
  function getSelectedWordElements(range: Range): Element[] {
    const selectedWords: Element[] = [];
    const containedWords = new Set<Element>();
    
    // Function to check if position is inside element
    const isPositionInside = (element: Element, container: Node, offset: number) => {
      const nodeRange = document.createRange();
      nodeRange.selectNode(element);
      
      const testRange = document.createRange();
      testRange.setStart(container, offset);
      
      return nodeRange.compareBoundaryPoints(Range.START_TO_START, testRange) <= 0;
    };
  
    // Get all word elements that intersect with selection
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node instanceof Element && node.hasAttribute('data-word-metadata')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
  
    let node;
    while (node = walker.nextNode()) {
      if (node instanceof Element && range.intersectsNode(node)) {
        containedWords.add(node);
      }
    }
  
    // Convert to array and sort by document position
    selectedWords.push(...Array.from(containedWords));
    selectedWords.sort((a, b) => {
      const position = a.compareDocumentPosition(b);
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
  
    return selectedWords;
  }
  
  
  function findSelectedElements(range: Range): Element[] {
    const selectedElements: Element[] = [];
    
    // Get the common ancestor that contains all selected content
    const container = range.commonAncestorContainer;
    if (!container) return selectedElements;
  
    const root = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
    if (!root) return selectedElements;
  
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node): number => {
          if (node instanceof Element && 
              node.hasAttribute('data-word-metadata') && 
              range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
  
    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode instanceof Element) {
        selectedElements.push(currentNode);
      }
      currentNode = walker.nextNode();
    }
  
    // Sort elements by document position
    return selectedElements.sort((a, b) => {
      const compare = a.compareDocumentPosition(b);
      if (compare & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1;
      }
      if (compare & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1;
      }
      return 0;
    });
  }