import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect } from "react";
import { $isElementNode, ElementNode, $getSelection, $createParagraphNode, $isRangeSelection, $getRoot } from "lexical";
import { $createPaperCutCursorNode, $isPaperCutCursorNode } from '@/app/nodes/PaperCutCursorNode';

export function PaperCutCursorPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeCursors = () => {
      editor.update(() => {
        const root = $getRoot();
        root.getChildren().forEach(node => {
          if ($isPaperCutCursorNode(node)) {
            node.remove();
          }
        });
      });
    };

    const insertCursor = () => {
        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;
      
          const cursorNode = $createPaperCutCursorNode();
          const node = selection.anchor.getNode();
          const root = $getRoot();
      
          if (node) {
            const offset = selection.anchor.offset;
      
            if (node === root) {
              // Ensure we have a valid ElementNode within the root
              let targetNode = root.getFirstChild();
              if (!$isElementNode(targetNode)) {
                const paragraph = $createParagraphNode();
                root.append(paragraph);
                targetNode = paragraph;
              }
      
              // Append the cursor node to the target element
              (targetNode as ElementNode).append(cursorNode);
            } else if ($isElementNode(node)) {
              // For an ElementNode, we can append or insert directly
              if (offset === 0) {
                node.insertBefore(cursorNode);
              } else {
                node.insertAfter(cursorNode);
              }
            } else {
              // Handle TextNode or other nodes
              const parent = node.getParent();
              if (parent && $isElementNode(parent)) {
                parent.insertAfter(cursorNode);
              }
            }
          }
        });
      };
      

    // Clear cursors when any content changes or when editor is interacted with
    const updateUnregister = editor.registerUpdateListener(() => {
      removeCursors();
    });

    // Add cursor when clicking away
    const handleClick = (e: MouseEvent) => {
      const editorElement = editor.getRootElement();
      if (editorElement && !editorElement.contains(e.target as Node)) {
        insertCursor();
      }
    };

    document.addEventListener('mousedown', handleClick);

    return () => {
      updateUnregister();
      document.removeEventListener('mousedown', handleClick);
    };
  }, [editor]);

  return null;
}