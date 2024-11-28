import { useEffect, useCallback } from "react";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $getSelection, 
  $isRangeSelection,
  PASTE_COMMAND, 
  COPY_COMMAND, 
  COMMAND_PRIORITY_LOW,
  $createRangeSelection,
  RangeSelection,
  LexicalNode
} from 'lexical';
import { useFileSystem } from "@/app/contexts/FileSystemContext";
import { $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $isPaperCutSegmentNode } from '@/app/nodes/PaperCutSegmentNode';
import { 
  parseClipboardData, 
  getAllWordNodes,
  formatTime,
  formatDragData,
  WordData 
} from '@/app/utils/clipboard-utils';
import { createSegmentWithWords, handlePaste as handlePasteUtil } from '@/app/utils/editor-utils';

function PaperCutPastePlugin() {
  const [editor] = useLexicalComposerContext();
  const { files } = useFileSystem();

  const handlePaste = useCallback((clipboardData: string): boolean => {
    if (!clipboardData) return false;
    // Pass false for appendToEnd to maintain natural cursor-based insertion
    return handlePasteUtil(clipboardData, editor, files, false);
  }, [editor, files]);
  
  const handleDragStart = useCallback((event: DragEvent): boolean => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const nodes = selection.getNodes();
      const wordNodes = nodes.filter($isPaperCutWordNode);

      if (wordNodes.length === 0) return false;

      const dragData = wordNodes
        .map((node) => {
          const segment = node.getParent();
          if (!$isPaperCutSegmentNode(segment)) return '';
          return formatDragData(node, files, segment);
        })
        .filter(Boolean)
        .join(' ');

      if (dragData) {
        event.dataTransfer?.setData('text/plain', dragData);
        event.dataTransfer!.effectAllowed = 'copyMove';
      }
    });
    return true;
  }, [editor, files]);

  const handleDrop = useCallback((event: DragEvent): boolean => {
    event.preventDefault();
    const droppedText = event.dataTransfer?.getData('text/plain');
    
    if (droppedText) {
      const doc = event.target instanceof Node ? event.target.ownerDocument : document;
      if (doc) {
        let caretPosition: any = null;
        if ('caretPositionFromPoint' in doc) {
          caretPosition = (doc as any).caretPositionFromPoint(event.clientX, event.clientY);
        } else if ('caretRangeFromPoint' in doc) {
          caretPosition = (doc as any).caretRangeFromPoint(event.clientX, event.clientY);
        }
  
        if (caretPosition) {
          const range = doc.createRange();
          if ('offsetNode' in caretPosition && 'offset' in caretPosition) {
            range.setStart(caretPosition.offsetNode, caretPosition.offset);
          } else if (caretPosition instanceof Range) {
            range.setStart(caretPosition.startContainer, caretPosition.startOffset);
          }
          range.collapse(true);
          
          const selection = window.getSelection();
          selection?.removeAllRanges();
          selection?.addRange(range);
          
          return handlePaste(droppedText);
        } else {
          // Fallback if caretPositionFromPoint and caretRangeFromPoint are not supported
          return handlePaste(droppedText);
        }
      }
    }
    return false;
  }, [handlePaste]);

  const handleDragOver = useCallback((event: DragEvent): boolean => {
    event.preventDefault();
    return true;
  }, []);

  const handleCopy = useCallback((event: ClipboardEvent): boolean => {
    event.preventDefault();
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const nodes = selection.getNodes();
      const wordNodes = nodes.filter($isPaperCutWordNode);

      if (wordNodes.length === 0) return false;

      const clipboardData = wordNodes
        .map((node) => {
          const segment = node.getParent();
          if (!$isPaperCutSegmentNode(segment)) return '';

          const fileId = node.getFileId();
          const fileName = files[fileId]?.name || 'unknown';

          const wordInfo = [
            node.getTextContent(),
            node.getStartTime(),
            node.getEndTime(),
            node.getWordIndex()
          ].join(',');

          const segmentInfo = [
            node.getSegmentId(),
            segment.getStartTime(),
            segment.getEndTime(),
            node.getSpeaker()
          ].join(',');

          const fileInfo = [
            fileName,
            fileId
          ].join(',');

          return [wordInfo, segmentInfo, fileInfo].join('|');
        })
        .filter(Boolean)
        .join(' ');

      event.clipboardData?.setData('text/plain', clipboardData);
      return true;
    });
    return true;
  }, [editor, files]);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    // Add native event listeners for drag and drop
    const dragOverHandler = (e: DragEvent) => e.preventDefault();
    const dragStartHandler = (e: DragEvent) => handleDragStart(e);
    const dropHandler = (e: DragEvent) => handleDrop(e);
    
    rootElement.addEventListener('dragstart', dragStartHandler);
    rootElement.addEventListener('dragover', dragOverHandler);
    rootElement.addEventListener('drop', dropHandler);

    // Register Lexical commands for copy and paste
    const removeList: Array<() => void> = [
      editor.registerCommand(
        COPY_COMMAND,
        handleCopy,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        PASTE_COMMAND,
        (event: ClipboardEvent) => {
          event.preventDefault();
          const clipboardData = event.clipboardData?.getData('text/plain');
          return handlePaste(clipboardData || '');
        },
        COMMAND_PRIORITY_LOW
      )
    ];

    // Cleanup function
    return () => {
      rootElement.removeEventListener('dragstart', dragStartHandler);
      rootElement.removeEventListener('dragover', dragOverHandler);
      rootElement.removeEventListener('drop', dropHandler);
      removeList.forEach((remove) => remove());
    };
  }, [
    editor, 
    handleCopy, 
    handlePaste, 
    handleDragStart, 
    handleDrop
  ]);

  return null;
}

export default PaperCutPastePlugin;