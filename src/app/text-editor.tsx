'use client';

import { useEffect, useState } from "react";
import { useFileSystem } from '@/app/contexts/FileSystemContext'
import { FileContent, Segment } from '@/app/types/transcript'
/* Lexical Design System */
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";

/* Lexical Plugins Local */
import TreeViewPlugin from "@/app/plugins/TreeViewPlugin";
import ToolbarPlugin from "@/app/plugins/ToolbarPlugin";
import AutoLinkPlugin from "@/app/plugins/AutoLinkPlugin";
import CodeHighlightPlugin from "@/app/plugins/CodeHighlightPlugin";

/* Lexical Plugins Remote */
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";

/* Lexical Others */
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import ExampleTheme from "@/app/themes/ExampleTheme";

import { $getRoot, $createParagraphNode, $createTextNode, EditorState } from 'lexical';

function Placeholder() {
    return <div className="editor-placeholder">Enter some rich text...</div>;
}

export function Editor(): JSX.Element | null {
    const [isMounted, setIsMounted] = useState(false)
    const { files, selectedItems, updateFileContent } = useFileSystem()
    const [editorState, setEditorState] = useState<EditorState | null>(null)
    const [content, setContent] = useState<FileContent[]>([])

    const selectedFileId = selectedItems[0]
    const selectedFile = selectedFileId ? files[selectedFileId] : null

    useEffect(() => {
        setIsMounted(true);
    }, [])

    useEffect(() => {
        if (selectedFile) {
            const parsedContent: FileContent = JSON.parse(selectedFile.content);
            setContent([parsedContent]);

            const editorContent = parsedContent.processed_data.transcript.segments
                .map((segment: Segment) => segment.text)
                .join('\n\n')
            
            setEditorState((prevState) => {
                if (prevState) {
                    prevState.read(() => {
                        const root = $getRoot()
                        root.clear()
                        const paragraph = $createParagraphNode()
                        paragraph.append($createTextNode(editorContent))
                        root.append(paragraph)
                    })
                    return prevState
                }
                return null
            })
        }
    }, [selectedFile])

    if (!isMounted) return null

    const editorConfig = {
        theme: ExampleTheme,
        namespace: "daily-standup-editor",
        editorState: editorState,
        onError(error: unknown) {
            throw error;
        },
        nodes: [
            HeadingNode,
            ListNode,
            ListItemNode,
            QuoteNode,
            CodeNode,
            CodeHighlightNode,
            TableNode,
            TableCellNode,
            TableRowNode,
            AutoLinkNode,
            LinkNode
        ],
    };

    const onChange = (editorState: EditorState) => {
        editorState.read(() => {
            const root = $getRoot()
            const newContent = root.getTextContent()
            if (selectedFileId && content.length > 0) {
                const updatedContent = {
                    ...content[0],
                    processed_data: {
                        ...content[0].processed_data,
                        transcript: {
                            ...content[0].processed_data.transcript,
                            segments: [
                                {
                                    ...content[0].processed_data.transcript.segments[0],
                                    text: newContent
                                }
                            ]
                        }
                    }
                };
                setContent([updatedContent]);
                updateFileContent(selectedFileId, JSON.stringify(updatedContent));
            }
        })
    }

    return (
        <LexicalComposer initialConfig={editorConfig}>
            <div className="editor-container">
                <ToolbarPlugin />
                <div className="editor-inner">
                    <RichTextPlugin
                        contentEditable={<ContentEditable className="editor-input" />}
                        placeholder={<Placeholder />}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <OnChangePlugin onChange={onChange} />
                    <ListPlugin />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <CodeHighlightPlugin />
                    <LinkPlugin />
                    <TabIndentationPlugin />
                    <AutoLinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    {/* <TreeViewPlugin /> */}
                </div>
            </div>
        </LexicalComposer>
    );
}