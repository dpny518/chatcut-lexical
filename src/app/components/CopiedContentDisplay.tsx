//src/app/components/CopiedContentDisplay.tsx
import React, { useState, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COPY_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';

export function CopiedContentDisplay() {
  const [editor] = useLexicalComposerContext();
  const [copiedContent, setCopiedContent] = useState('');

  useEffect(() => {
    return editor.registerCommand(
      COPY_COMMAND,
      (event: ClipboardEvent) => {
        const content = event.clipboardData?.getData('text/plain') || '';
        setCopiedContent(content);
        return false; // Don't prevent default copy behavior
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);

  if (!copiedContent) return null;

  return (
    <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
      <h3>Last Copied Content:</h3>
      <pre>{copiedContent}</pre>
    </div>
  );
}