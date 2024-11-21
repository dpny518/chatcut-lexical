import { useEffect, useState } from "react";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createTextNode, $getSelection, $isRangeSelection } from 'lexical';
import { COPY_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import { useFileSystem } from "@/app/contexts/FileSystemContext";
import { FileContent, ParsedContent, Segment, Word } from '@/app/types/transcript';
import { $createWordNode, $isWordNode, WordNode } from "./nodes/WordNode";
import { $createSegmentNode, $isSegmentNode, SegmentNode } from "./nodes/SegmentNode";
import { $createSpeakerNode, $isSpeakerNode, SpeakerNode } from "./nodes/SpeakerNode";

function EditorContent() {
    const [editor] = useLexicalComposerContext();
    const { files, selectedItems } = useFileSystem();
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    useEffect(() => {
        // Update selectedFiles state when selectedItems changes
        setSelectedFiles(prevSelected => {
            const newSelected = selectedItems.filter(id => files[id]?.type === 'file');
            // Keep previously selected files that are still in selectedItems
            const remainingPrevSelected = prevSelected.filter(id => selectedItems.includes(id));
            // Add newly selected files
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
                            transcript.segments.forEach((segment: Segment, segmentIndex: number) => {
                                const speakerNode = $createSpeakerNode(segment.speaker);
                                const speakerLabelNode = $createTextNode(`${segment.speaker}\n`);
                                speakerLabelNode.toggleFormat('bold');
                                speakerNode.append(speakerLabelNode);

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

                                speakerNode.append(segmentNode);
                                root.append(speakerNode);
                            });
                        }
                    } catch (error) {
                        console.error(`Error parsing file content for ${selectedFile.name}:`, error);
                    }
                }
            });

            console.log("Finished processing all files");
        });
    }, [editor, files, selectedFiles]);

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

export default EditorContent;