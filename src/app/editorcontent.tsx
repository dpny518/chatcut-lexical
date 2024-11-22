// src/app/components/EditorContent.tsx
import { useEffect, useState } from "react";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createTextNode, $getSelection, $isRangeSelection } from 'lexical';
import { COPY_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { useFileSystem } from "@/app/contexts/FileSystemContext";
import { FileContent, ParsedContent, Segment, Word } from '@/app/types/transcript';
import { $createWordNode, $isWordNode, WordNode } from "./nodes/WordNode";
import { $createSegmentNode, $isSegmentNode, SegmentNode } from "./nodes/SegmentNode";
import { $createSpeakerNode, $isSpeakerNode, SpeakerNode } from "./nodes/SpeakerNode";
import { $createParagraphNode } from 'lexical';
import { useEditorContent } from "@/app/contexts/EditorContentContext";
function EditorContent() {
    const [editor] = useLexicalComposerContext();
    const { files, selectedItems } = useFileSystem();
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const { setSelectedFileIds } = useEditorContent();

    useEffect(() => {
        setSelectedFiles(prevSelected => {
            const newSelected = selectedItems.filter(id => files[id]?.type === 'file');
            const remainingPrevSelected = prevSelected.filter(id => selectedItems.includes(id));
            const newlySelected = newSelected.filter(id => !prevSelected.includes(id));
            return [...remainingPrevSelected, ...newlySelected];
        });
    }, [selectedItems, files]);

    useEffect(() => {
        if (selectedFiles.length === 0) {
            editor.update(() => {
                const root = $getRoot();
                root.clear();
            });
            return;
        }

        editor.update(() => {
            const root = $getRoot();
            root.clear();

            console.log("Processing files:", selectedFiles);

            selectedFiles.forEach((itemId) => {
                const selectedFile = files[itemId];
                if (selectedFile && selectedFile.type === 'file') {
                    try {
                        const fileContent = JSON.parse(selectedFile.content) as FileContent | ParsedContent;
                        const transcript = 'processed_data' in fileContent 
                            ? fileContent.processed_data.transcript 
                            : fileContent.transcript;

                        console.log(`Processing file ${itemId}:`, transcript);

                        if (transcript && transcript.segments) {
                            let lastSpeaker = '';
                            transcript.segments.forEach((segment: Segment, segmentIndex: number) => {
                                if (segment.speaker !== lastSpeaker) {
                                    // Add a blank line before new speaker (except for the first one)
                                    if (lastSpeaker !== '') {
                                        root.append($createParagraphNode());
                                    }

                                    // Create a new paragraph for each speaker change
                                    const paragraphNode = $createParagraphNode();
                                    
                                    // Add time label with custom styling
                                    const timeLabel = $createTextNode(`[${formatTime(segment.start_time)}] `);
                                    timeLabel.setStyle('color: #888; font-size: 0.8em;');
                                    paragraphNode.append(timeLabel);

                                    // Add speaker label
                                    const speakerLabel = $createTextNode(`${segment.speaker}: `);
                                    speakerLabel.setFormat('bold');
                                    paragraphNode.append(speakerLabel);

                                    root.append(paragraphNode);
                                    lastSpeaker = segment.speaker;
                                }

                                const segmentNode = $createSegmentNode(
                                    '',
                                    segment.start_time,
                                    segment.end_time,
                                    segmentIndex.toString(),
                                    segment.speaker,
                                    itemId
                                );

                                segment.words.forEach((word: Word, wordIndex: number) => {
                                    const wordNode = $createWordNode(
                                        word.word,
                                        word.start || -1,
                                        word.end || -1,
                                        segmentIndex.toString(),
                                        segment.speaker,
                                        itemId,
                                        wordIndex
                                    );
                                    segmentNode.append(wordNode);
                                    
                                    if (wordIndex < segment.words.length - 1) {
                                        segmentNode.append($createTextNode(' '));
                                    }
                                });

                                root.append(segmentNode);
                            });
                        }
                    } catch (error) {
                        console.error(`Error parsing file content for ${selectedFile.name}:`, error);
                    }
                }
            });

            console.log("Finished processing all files");
            setSelectedFileIds(selectedFiles);
        });
    }, [editor, files, selectedFiles, setSelectedFileIds]);

    useEffect(() => {
        return editor.registerCommand(
            COPY_COMMAND,
            (event: ClipboardEvent) => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return false;

                const nodes = selection.getNodes();
                const clipboardData = nodes
                    .filter($isWordNode)
                    .map((node: WordNode) => {
                        return `${node.getTextContent()}|${node.getStartTime()}|${node.getEndTime()}|${node.getSegmentId()}|${node.getSpeaker()}|${node.getFileId()}|${node.getWordIndex()}`;
                    })
                    .join(' ');

                if (clipboardData) {
                    event.clipboardData?.setData('text/plain', clipboardData);
                    console.log('Copied content:', clipboardData);
                    event.preventDefault();
                    return true;
                }

                // If no WordNodes were found, prevent the default copy behavior
                event.preventDefault();
                return false;
            },
            COMMAND_PRIORITY_LOW
        );
    }, [editor]);

    return null;
}

function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default EditorContent;