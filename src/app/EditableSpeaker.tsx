import React, { useState, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createTextNode } from 'lexical';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2, Check, X } from 'lucide-react';
import { useFileSystem } from "@/app/contexts/FileSystemContext";

const EditableSpeaker = ({ speaker, fileId, startTime }) => {
  const [editor] = useLexicalComposerContext();
  const [isEditing, setIsEditing] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState(speaker);
  const { files, updateFile } = useFileSystem();

  const handleSave = useCallback(() => {
    if (newSpeakerName === speaker) {
      setIsEditing(false);
      return;
    }

    // Update the file content
    const file = files[fileId];
    if (!file) return;

    const fileContent = JSON.parse(file.content);
    const transcript = 'processed_data' in fileContent 
      ? fileContent.processed_data.transcript 
      : fileContent.transcript;

    // Update speaker name in segments
    transcript.segments.forEach(segment => {
      if (segment.speaker === speaker) {
        segment.speaker = newSpeakerName;
      }
    });

    // Update the file with new content
    const updatedContent = 'processed_data' in fileContent
      ? {
          ...fileContent,
          processed_data: {
            ...fileContent.processed_data,
            transcript
          }
        }
      : {
          ...fileContent,
          transcript
        };

    updateFile(fileId, {
      ...file,
      content: JSON.stringify(updatedContent)
    });

    // Update nodes in editor
    editor.update(() => {
      const root = $getRoot();
      const nodes = root.getChildren();
      
      nodes.forEach(node => {
        if (node.getType() === 'paragraph') {
          const children = node.getChildren();
          children.forEach(child => {
            if (child.getType() === 'text' && 
                child.getTextContent().includes(`${speaker}:`)) {
              child.setTextContent(`${newSpeakerName}: `);
              child.setFormat('bold');
            }
          });
        }
        
        if (node.getType() === 'segment') {
          if (node.__speaker === speaker) {
            node.__speaker = newSpeakerName;
          }
          
          const wordNodes = node.getChildren();
          wordNodes.forEach(wordNode => {
            if (wordNode.getType() === 'word' && 
                wordNode.__speaker === speaker) {
              wordNode.__speaker = newSpeakerName;
            }
          });
        }
      });
    });

    setIsEditing(false);
  }, [editor, fileId, files, newSpeakerName, speaker, updateFile]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={newSpeakerName}
          onChange={(e) => setNewSpeakerName(e.target.value)}
          className="h-6 w-40"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          className="h-6 w-6 p-0"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setNewSpeakerName(speaker);
            setIsEditing(false);
          }}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="font-bold">{speaker}:</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </span>
  );
};

export default EditableSpeaker;