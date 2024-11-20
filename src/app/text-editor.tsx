'use client';

import { useEffect, useState } from "react";


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
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import { EditorState } from "lexical";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import ExampleTheme from "@/app/themes/ExampleTheme";

/* Lexical Texts */
import { generatePaperCut } from "./text-papercut";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { $createListItemNode, $createListNode } from "@lexical/list";

/* Data */
import { useFileSystem } from "@/app/contexts/FileSystemContext";

function Placeholder() {
    return <div className="editor-placeholder">Enter some rich text...</div>;
}

interface EditorProps {
    selectedFileContent: string | null;
}

const editorConfig = {
    // The editor theme
    theme: ExampleTheme,
    namespace: "daily-standup-editor",
    editorState: generatePaperCut,
    // Handling of errors during update
    onError(error: unknown) {
        throw error;
    },
    // Any custom nodes go here
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

function EditorContent() {
    const [editor] = useLexicalComposerContext();
    const { files, selectedItems } = useFileSystem();

    useEffect(() => {
        if (selectedItems.length > 0) {
            const selectedFileId = selectedItems[0]; // Assuming single selection
            const selectedFile = files[selectedFileId];
            if (selectedFile && selectedFile.type === 'file') {
                console.log("EditorContent: Selected file changed", selectedFile.name);
                try {
                    const parsedContent = JSON.parse(selectedFile.content);
                    console.log("EditorContent: Parsed content", parsedContent);
                    let textContent = '';
                    if (parsedContent.transcript && parsedContent.transcript.segments) {
                        textContent = parsedContent.transcript.segments
                            .map((segment: any) => segment.text)
                            .join('\n');
                    } else {
                        textContent = JSON.stringify(parsedContent, null, 2);
                    }
                    console.log("EditorContent: Updating editor content");
                    editor.update(() => {
                        const root = $getRoot();
                        root.clear();
                        root.append($createParagraphNode().append($createTextNode(textContent)));
                        console.log("EditorContent: Editor content updated");
                    });
                } catch (error) {
                    console.error('EditorContent: Error parsing file content:', error);
                }
            }
        }
    }, [editor, files, selectedItems]);

    return null;
}

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