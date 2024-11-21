// src/app/plugins/SpeakerSyncPlugin.tsx

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, LexicalNode } from 'lexical';
import { $createPaperCutWordNode, $isPaperCutWordNode, PaperCutWordNode } from '@/app/nodes/PaperCutWordNode';
import { $createPaperCutSpeakerNode, PaperCutSpeakerNode } from '@/app/nodes/PaperCutSpeakerNode';

export function SpeakerSyncPlugin() {
  const [editor] = useLexicalComposerContext();

  const syncSpeakers = () => {
    editor.update(() => {
      const root = $getRoot();
      const children = root.getChildren();
      
      let currentSpeaker = '';
      const newContent: LexicalNode[] = [];

      children.forEach((child) => {
        if ($isPaperCutWordNode(child)) {
          const speaker = child.getSpeaker();
          if (speaker !== currentSpeaker) {
            currentSpeaker = speaker;
            const speakerNode = $createPaperCutSpeakerNode(speaker);
            newContent.push(speakerNode);
          }
          newContent.push(child);
        } else {
          // Handle other node types if necessary
          newContent.push(child);
        }
      });

      // Clear the root and insert the new content
      root.clear();
      newContent.forEach((node) => root.append(node));
    });
  };

  return (
    <button onClick={syncSpeakers}>Sync Speakers</button>
  );
}