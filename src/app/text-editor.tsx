'use client';

import { useCallback, useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { $getSelection, $isRangeSelection, LexicalEditor } from 'lexical';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorState } from 'lexical';

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";

import ToolbarPlugin from "@/app/plugins/ToolbarPlugin";
import { FormattedWordsPlugin } from "@/app/plugins/FormattedWordsPlugin";

import ExampleTheme from "@/app/themes/ExampleTheme";
import { WordNode } from "./nodes/WordNode";
import { SegmentNode } from "./nodes/SegmentNode";
import { SpeakerNode } from "./nodes/SpeakerNode";
import EditorContent from "./editorcontent";

import { useEditorContent } from "@/app/contexts/EditorContentContext";
import { useFileSystem } from "@/app/contexts/FileSystemContext";

import { FileIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Undo, Redo, RefreshCw, Trash2 } from 'lucide-react';

function Placeholder() {
    return <div className="editor-placeholder">Upload and Select Some Transcripts.</div>;
}

  interface CurrentFileIndicatorProps {
    selectedFileIds: string[];
    files: Record<string, { name: string }>;
  }

function CurrentFileIndicator({ selectedFileIds, files }: CurrentFileIndicatorProps) {
  const getDisplayText = () => {
    if (selectedFileIds.length === 0) return 'No file selected';
    if (selectedFileIds.length === 1) {
      return files[selectedFileIds[0]]?.name || 'Unknown File';
    }
    return 'Multiple Selection';
  };

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex items-center gap-2 border-b px-4 py-2">
      <FileIcon className="h-4 w-4 text-muted-foreground" />
      <Badge variant="secondary" className="font-mono text-xs">
        {getDisplayText()}
      </Badge>
    </div>
  );
}

const editorConfig = {
    theme: ExampleTheme,
    editable: false,
    namespace: "daily-standup-editor",
    onError(error: unknown) {
        console.error(error);
    },
    nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        TableNode,
        TableCellNode,
        TableRowNode,
        AutoLinkNode,
        LinkNode,
        {
            replace: WordNode,
            with: (node: WordNode) => {
                return new WordNode(
                    node.__text,
                    node.__startTime,
                    node.__endTime,
                    node.__segmentId,
                    node.__speaker,
                    node.__fileId,
                    node.__wordIndex,
                    node.__key
                );
            },
        },
        {
            replace: SegmentNode,
            with: (node: SegmentNode) => {
                return new SegmentNode(
                    node.__startTime,
                    node.__endTime,
                    node.__segmentId,
                    node.__speaker,
                    node.__fileId,
                    node.__key
                );
            },
        },
        {
            replace: SpeakerNode,
            with: (node: SpeakerNode) => {
                return new SpeakerNode(node.__speaker, node.__key);
            },
        },
    ],
};

export function Editor(): JSX.Element | null {
    const [isMounted, setIsMounted] = useState(false);
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const { selectedFileIds } = useEditorContent();
    const { files } = useFileSystem();

    const getFileNameFromId = useCallback((fileId: string): string => {
        const file = files[fileId];
        return file ? file.name : 'Unknown File';
    }, [files]);

    const updateCurrentFile = useCallback((editorState: EditorState) => {
        editorState.read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();
                console.log('Anchor node:', anchorNode);
                if (anchorNode instanceof WordNode) {
                    const fileId = anchorNode.getFileId();
                    console.log('File ID:', fileId);
                    console.log('Selected File IDs:', selectedFileIds);
                    if (selectedFileIds.includes(fileId)) {
                        const fileName = getFileNameFromId(fileId);
                        console.log('Updating current file to:', fileName);
                        setCurrentFile(fileName);
                    }
                }
            }
        });
    }, [getFileNameFromId, selectedFileIds]);

    useEffect(() => {
        setIsMounted(true);
        console.log("Editor: Component mounted");
    }, []);

    useEffect(() => {
        if (selectedFileIds.length > 0) {
            const editor = (window as any).lexicalEditor as LexicalEditor;
            if (editor) {
                updateCurrentFile(editor.getEditorState());
            }
        } else {
            setCurrentFile(null);
        }
    }, [selectedFileIds, updateCurrentFile]);

    if (!isMounted) return null;

    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div className="editor-container flex flex-col">
                <ToolbarPlugin />
                <CurrentFileIndicator selectedFileIds={selectedFileIds} files={files} />
                <div className="editor-inner flex-grow overflow-auto">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input min-h-[500px] p-4" />}
                        placeholder={<Placeholder />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <TabIndentationPlugin />
                    <FormattedWordsPlugin />
                    <EditorContent />
                </div>
            </div>
        </LexicalComposer>
    );
}