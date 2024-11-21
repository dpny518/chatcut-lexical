// src/app/plugins/WordHoverPlugin.tsx
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { WordHoverCard } from '@/app/components/WordHoverCard';
import { PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';

export function WordHoverPlugin() {
  const [editor] = useLexicalComposerContext();
  const rootsRef = useRef<Map<string, ReactDOM.Root>>(new Map());

  useEffect(() => {
    const editorElement = editor.getRootElement();
    if (!editorElement) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement && node.classList.contains('papercut-word')) {
            const key = node.getAttribute('data-lexical-node-key');
            if (key) {
              editor.getEditorState().read(() => {
                const lexicalNode = $getNodeByKey(key);
                if (lexicalNode instanceof PaperCutWordNode) {
                  let root = rootsRef.current.get(key);
                  if (!root) {
                    root = ReactDOM.createRoot(node);
                    rootsRef.current.set(key, root);
                  }

                  root.render(
                    <WordHoverCard
                      word={lexicalNode.getTextContent()}
                      startTime={lexicalNode.getStartTime()}
                      endTime={lexicalNode.getEndTime()}
                      segmentId={lexicalNode.getSegmentId()}
                      speaker={lexicalNode.getSpeaker()}
                      fileId={lexicalNode.getFileId()}
                      wordIndex={lexicalNode.getWordIndex()}
                    >
                      <span>{lexicalNode.getTextContent()}</span>
                    </WordHoverCard>
                  );
                }
              });
            }
          }
        });
      });
    });

    observer.observe(editorElement, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      rootsRef.current.forEach((root) => {
        root.unmount();
      });
    };
  }, [editor]);

  return null;
}