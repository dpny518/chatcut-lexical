// FormattedWordsPlugin.tsx
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isTextNode, TextNode, LexicalNode, ElementNode } from 'lexical';
import { $isWordNode, WordNode } from '@/app/nodes/WordNode';
import { useFormattedWords } from '@/app/contexts/FormattedWordsContext';

const HIGHLIGHT_GREEN = '#ADFF2F';
const HIGHLIGHT_RED = '#FF6347';

export function FormattedWordsPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const { setFormattedWords } = useFormattedWords();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const formattedWords = {
          all_content: [] as string[],
          bold_content: [] as string[],
          italic_content: [] as string[],
          strikethrough_content: [] as string[],
          green_content: [] as string[],
          red_content: [] as string[],
        };

        const traverseNodes = (node: LexicalNode) => {
          if ($isTextNode(node) || $isWordNode(node)) {
            const text = node.getTextContent();
            const format = node.getFormat();
            
            let wordData: string;
            if ($isWordNode(node)) {
              wordData = `${text}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getFileId()}|${node.getWordIndex()}`;
            } else {
              wordData = text;
            }

            formattedWords.all_content.push(wordData);

            if (format & 1) formattedWords.bold_content.push(wordData);
            if (format & 2) formattedWords.italic_content.push(wordData);
            if (format & 8) formattedWords.strikethrough_content.push(wordData);
            
            // Check for background color
            const styles = node.getStyle();
            if (styles) {
              const bgColor = styles.split(';').find(style => style.trim().startsWith('background-color:'));
              if (bgColor) {
                const color = bgColor.split(':')[1].trim();
                if (color === HIGHLIGHT_GREEN) {
                  formattedWords.green_content.push(wordData);
                } else if (color === HIGHLIGHT_RED) {
                  formattedWords.red_content.push(wordData);
                }
              }
            }
          }

          if (node instanceof ElementNode) {
            node.getChildren().forEach(traverseNodes);
          }
        };

        traverseNodes($getRoot());

        // Update the context with the new formatted words
        setFormattedWords(formattedWords);
      });
    });
  }, [editor, setFormattedWords]);

  return null;
}