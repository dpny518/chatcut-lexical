'use client';

import { useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";

import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { ListItemNode, ListNode } from "@lexical/list";
import { AutoLinkNode, LinkNode } from "@lexical/link";


import ToolbarPlugin from "@/app/plugins/ToolbarPlugin";
import {FormattedWordsPlugin} from "@/app/plugins/FormattedWordsPlugin"

import ExampleTheme from "@/app/themes/ExampleTheme";
import { WordNode } from "./nodes/WordNode";
import { SegmentNode } from "./nodes/SegmentNode";
import { SpeakerNode } from "./nodes/SpeakerNode";
import EditorContent from "./editorcontent";

import { useEditorContent } from "@/app/contexts/EditorContentContext";

function Placeholder() {
    return <div className="editor-placeholder">Upload and Select Some Transcripts.</div>;
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
    const { selectedFileIds } = useEditorContent();

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
                    <HistoryPlugin />
                    <TabIndentationPlugin />
                    <FormattedWordsPlugin />
                    <EditorContent />
                </div>
            </div>
        </LexicalComposer>
    );
}