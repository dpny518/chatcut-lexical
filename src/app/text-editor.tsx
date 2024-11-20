'use client';

import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";

import TreeViewPlugin from "@/app/plugins/TreeViewPlugin";
import ToolbarPlugin from "@/app/plugins/ToolbarPlugin";
import AutoLinkPlugin from "@/app/plugins/AutoLinkPlugin";
import CodeHighlightPlugin from "@/app/plugins/CodeHighlightPlugin";

import ExampleTheme from "@/app/themes/ExampleTheme";
import { WordNode } from "./nodes/WordNode";
import { SegmentNode } from "./nodes/SegmentNode";
import { SpeakerNode } from "./nodes/SpeakerNode";
import EditorContent from "./editorcontent";

function Placeholder() {
    return <div className="editor-placeholder">Enter some rich text...</div>;
}

const editorConfig = {
    theme: ExampleTheme,
    namespace: "daily-standup-editor",
    onError(error: unknown) {
        console.error(error);
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

    useEffect(() => {
        setIsMounted(true);
        console.log("Editor: Component mounted");
    }, []);

    if (!isMounted) return null;

    console.log("Editor: Rendering component");
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
                    <ListPlugin />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <CodeHighlightPlugin />
                    <LinkPlugin />
                    <TabIndentationPlugin />
                    <AutoLinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <EditorContent />
                </div>
            </div>
        </LexicalComposer>
    );
}