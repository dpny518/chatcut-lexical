// src/app/components/PaperCutToolbarPlugin.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  CAN_REDO_COMMAND, 
  CAN_UNDO_COMMAND, 
  REDO_COMMAND, 
  UNDO_COMMAND,
  $getRoot,
  LexicalNode,
  $createParagraphNode
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { $createPaperCutSpeakerNode, $isPaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';
import { $isPaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { Undo, Redo, RefreshCw } from 'lucide-react'; // Import icons

const LowPriority = 1;

function Divider() {
  return <div className="divider" />;
}

const PaperCutToolbarPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);


  const syncSpeakers = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();
      const children = root.getChildren();
      
      let currentSpeaker = '';
      let currentParagraph = $createParagraphNode();
      const newContent: LexicalNode[] = [];
  
      children.forEach((child) => {
        if ($isPaperCutWordNode(child)) {
          const speaker = child.getSpeaker();
          if (speaker !== currentSpeaker) {
            // If we have content in the current paragraph, add it to newContent
            if (currentParagraph.getChildrenSize() > 0) {
              newContent.push(currentParagraph);
              currentParagraph = $createParagraphNode();
            }
            
            currentSpeaker = speaker;
            const speakerNode = $createPaperCutSpeakerNode(speaker);
            currentParagraph.append(speakerNode);
          }
          currentParagraph.append(child.constructor.clone(child));
        } else if ($isPaperCutSpeakerNode(child)) {
          // Ignore existing speaker nodes, as we're creating new ones
        } else {
          // Handle other node types (like spaces)
          currentParagraph.append(child.constructor.clone(child));
        }
      });
  
      // Add the last paragraph if it has content
      if (currentParagraph.getChildrenSize() > 0) {
        newContent.push(currentParagraph);
      }
  
      // Clear the root and insert the new content
      root.clear();
      newContent.forEach((node) => root.append(node));
    });
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload: boolean) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload: boolean) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      )
    );
  }, [editor]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      <button
        disabled={!canUndo}
        onClick={() => {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
        }}
        className="toolbar-item spaced"
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        disabled={!canRedo}
        onClick={() => {
          editor.dispatchCommand(REDO_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </button>
      <Divider />
      <button
        onClick={syncSpeakers}
        className="toolbar-item spaced"
        aria-label="Sync Speakers"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
      <div className="toolbar-item">
        {/* Placeholder for future functionality */}
      </div>
      <div className="toolbar-item">
        {/* Placeholder for future functionality */}
      </div>
    </div>
  );
};

export default PaperCutToolbarPlugin;