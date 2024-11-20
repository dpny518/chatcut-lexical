# PaperCut Transcript Editor

PaperCut is an advanced transcript editing tool built with Next.js 13 and the Lexical rich text editor. It provides a powerful environment for managing and editing transcripts with a user-friendly interface.

## Features

- Three-panel layout for efficient workflow
- File system management with create, delete, rename, and update capabilities
- Rich text editing with Lexical editor
- Real-time content updates
- Customizable right panel for additional functionality
## Project Structure
src/ app/ # Next.js 13 app directory components/ # Reusable components typing-animation.tsx AppSidebar.tsx # Left panel for file management RightPanel.tsx # Right panel for additional features contexts/ # React contexts FileSystemContext.tsx # Manages file system state plugins/ # Lexical editor plugins AutoLinkPlugin.js CodeHighlightPlugin.js ListMaxIndentLevelPlugin.js ToolbarPlugin.js # Toolbar UI and functionality TreeViewPlugin.js themes/ # Editor theming ExampleTheme.js types/ # TypeScript type definitions transcript.ts text-editor.tsx # Main editor component page.tsx # Main page component layout.tsx # Root layout styles.css # Global styles


## Getting Started

1. Clone the repository
2. Install dependencies:
npm install

3. Run the development server:
npm run dev

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- Use the left panel to manage your transcript files
- Select a file to load it into the main editor
- Edit the transcript in the central panel
- Use the right panel for additional features (customizable)
## Technologies Used

- Next.js 13
- React
- TypeScript
- Lexical Rich Text Editor

## Structure
src/
 app/                    # Next.js 13 app directory
  components/            # Reusable components
   typing-animation.tsx
   AppSidebar.tsx        # Left panel for file management
   RightPanel.tsx        # Right panel for additional features
  contexts/              # React contexts
   FileSystemContext.tsx # Manages file system state
  plugins/               # Lexical editor plugins
   AutoLinkPlugin.js
   CodeHighlightPlugin.js
   ListMaxIndentLevelPlugin.js
   ToolbarPlugin.js      # Toolbar UI and functionality
   TreeViewPlugin.js
  themes/                # Editor theming
   ExampleTheme.js
  types/                 # TypeScript type definitions
   transcript.ts
  text-editor.tsx        # Main editor component
  page.tsx               # Main page component
  layout.tsx             # Root layout
  styles.css             # Global styles

  SRT Node
  First, let's create a custom node:
import { TextNode } from 'lexical';

class SRTSegmentNode extends TextNode {
  __index: number;
  __startTime: number;
  __endTime: number;
  __speaker: string;
  __words: Array<{ start: number; end: number; word: string }>;

  static getType(): string {
    return 'srt-segment';
  }

  static clone(node: SRTSegmentNode): SRTSegmentNode {
    return new SRTSegmentNode(
      node.__index,
      node.__startTime,
      node.__endTime,
      node.__speaker,
      node.__words,
      node.__text,
      node.__key
    );
  }

  constructor(
    index: number,
    startTime: number,
    endTime: number,
    speaker: string,
    words: Array<{ start: number; end: number; word: string }>,
    text: string,
    key?: string
  ) {
    super(text, key);
    this.__index = index;
    this.__startTime = startTime;
    this.__endTime = endTime;
    this.__speaker = speaker;
    this.__words = words;
  }

  getIndex(): number {
    return this.__index;
  }

  getStartTime(): number {
    return this.__startTime;
  }

  getEndTime(): number {
    return this.__endTime;
  }

  getSpeaker(): string {
    return this.__speaker;
  }

  getWords(): Array<{ start: number; end: number; word: string }> {
    return this.__words;
  }
}
Now, let's create utility functions:
function $createSRTSegmentNode(
  index: number,
  startTime: number,
  endTime: number,
  speaker: string,
  words: Array<{ start: number; end: number; word: string }>,
  text: string
): SRTSegmentNode {
  return new SRTSegmentNode(index, startTime, endTime, speaker, words, text);
}

function $isSRTSegmentNode(
  node: LexicalNode | null | undefined
): node is SRTSegmentNode {
  return node instanceof SRTSegmentNode;
}
Now, let's create a function to process the SRT data and populate the editor:
function processSRTData(editor: LexicalEditor, srtData: any) {
  editor.update(() => {
    const root = $getRoot();

    srtData.processed_data.transcript.segments.forEach((segment: any) => {
      const segmentNode = $createSRTSegmentNode(
        segment.index,
        segment.start_time,
        segment.end_time,
        segment.speaker,
        segment.words,
        segment.text
      );

      const paragraphNode = $createParagraphNode();
      paragraphNode.append(segmentNode);
      root.append(paragraphNode);
    });
  });
}
Register the custom node:
const nodes = [SRTSegmentNode];

<LexicalComposer initialConfig={{nodes}}>
  {/* ... */}
</LexicalComposer>
Use the processor:
// Assuming you have your SRT data in a variable called srtData
processSRTData(editor, srtData);
This setup will create a custom node for each segment in your SRT file. The node will store all the metadata (index, start time, end time, speaker, and words), but only display the text content to the user.

To retrieve the data later, you could do something like:

editor.getEditorState().read(() => {
  const root = $getRoot();
  root.getChildren().forEach(paragraph => {
    paragraph.getChildren().forEach(node => {
      if ($isSRTSegmentNode(node)) {
        console.log(
          node.getTextContent(),
          node.getIndex(),
          node.getStartTime(),
          node.getEndTime(),
          node.getSpeaker(),
          node.getWords()
        );
      }
    });
  });
});
This approach allows you to maintain all the rich metadata of your SRT file while presenting a clean, text-only interface to the user in the Lexical editor.

json processor
First, let's create a custom node:
import { TextNode } from 'lexical';

class TranscriptSegmentNode extends TextNode {
  __speaker: string;
  __startTime: number;
  __endTime: number;
  __words: Array<{
    start: number;
    end: number;
    word: string;
    score: number;
    speaker: string;
  }>;

  static getType(): string {
    return 'transcript-segment';
  }

  static clone(node: TranscriptSegmentNode): TranscriptSegmentNode {
    return new TranscriptSegmentNode(
      node.__speaker,
      node.__startTime,
      node.__endTime,
      node.__words,
      node.__text,
      node.__key
    );
  }

  constructor(
    speaker: string,
    startTime: number,
    endTime: number,
    words: Array<{
      start: number;
      end: number;
      word: string;
      score: number;
      speaker: string;
    }>,
    text: string,
    key?: string
  ) {
    super(text, key);
    this.__speaker = speaker;
    this.__startTime = startTime;
    this.__endTime = endTime;
    this.__words = words;
  }

  getSpeaker(): string {
    return this.__speaker;
  }

  getStartTime(): number {
    return this.__startTime;
  }

  getEndTime(): number {
    return this.__endTime;
  }

  getWords(): Array<{
    start: number;
    end: number;
    word: string;
    score: number;
    speaker: string;
  }> {
    return this.__words;
  }
}
Now, let's create utility functions:
function $createTranscriptSegmentNode(
  speaker: string,
  startTime: number,
  endTime: number,
  words: Array<{
    start: number;
    end: number;
    word: string;
    score: number;
    speaker: string;
  }>,
  text: string
): TranscriptSegmentNode {
  return new TranscriptSegmentNode(speaker, startTime, endTime, words, text);
}

function $isTranscriptSegmentNode(
  node: LexicalNode | null | undefined
): node is TranscriptSegmentNode {
  return node instanceof TranscriptSegmentNode;
}
Now, let's create a function to process the JSON data and populate the editor:
function processTranscriptData(editor: LexicalEditor, transcriptData: any) {
  editor.update(() => {
    const root = $getRoot();

    transcriptData.transcription.forEach((item: any) => {
      const { segment, words } = item;
      const segmentNode = $createTranscriptSegmentNode(
        segment.speaker,
        segment.start,
        segment.end,
        words,
        segment.text
      );

      const paragraphNode = $createParagraphNode();
      paragraphNode.append(segmentNode);
      root.append(paragraphNode);
    });
  });
}
Register the custom node:
const nodes = [TranscriptSegmentNode];

<LexicalComposer initialConfig={{nodes}}>
  {/* ... */}
</LexicalComposer>
Use the processor:
// Assuming you have your JSON data in a variable called transcriptData
processTranscriptData(editor, transcriptData);
This setup will create a custom node for each segment in your transcript. The node will store all the metadata (speaker, start time, end time, and words with their individual data), but only display the text content to the user.

To retrieve the data later, you could do something like:

editor.getEditorState().read(() => {
  const root = $getRoot();
  root.getChildren().forEach(paragraph => {
    paragraph.getChildren().forEach(node => {
      if ($isTranscriptSegmentNode(node)) {
        console.log(
          node.getTextContent(),
          node.getSpeaker(),
          node.getStartTime(),
          node.getEndTime(),
          node.getWords()
        );
      }
    });
  });
});
This approach allows you to maintain all the rich metadata of your transcript while presenting a clean, text-only interface to the user in the Lexical editor. The user will see only the text, but all the additional data (timing, speaker information, word-level data) is preserved within the editor's state.

First, let's create a custom node:
import { TextNode } from 'lexical';

class DocxSegmentNode extends TextNode {
  __index: number;
  __startTime: number;
  __endTime: number;
  __speaker: string;
  __words: Array<{ start: number; end: number; word: string }>;

  static getType(): string {
    return 'docx-segment';
  }

  static clone(node: DocxSegmentNode): DocxSegmentNode {
    return new DocxSegmentNode(
      node.__index,
      node.__startTime,
      node.__endTime,
      node.__speaker,
      node.__words,
      node.__text,
      node.__key
    );
  }

  constructor(
    index: number,
    startTime: number,
    endTime: number,
    speaker: string,
    words: Array<{ start: number; end: number; word: string }>,
    text: string,
    key?: string
  ) {
    super(text, key);
    this.__index = index;
    this.__startTime = startTime;
    this.__endTime = endTime;
    this.__speaker = speaker;
    this.__words = words;
  }

  getIndex(): number {
    return this.__index;
  }

  getStartTime(): number {
    return this.__startTime;
  }

  getEndTime(): number {
    return this.__endTime;
  }

  getSpeaker(): string {
    return this.__speaker;
  }

  getWords(): Array<{ start: number; end: number; word: string }> {
    return this.__words;
  }
}
Now, let's create utility functions:
function $createDocxSegmentNode(
  index: number,
  startTime: number,
  endTime: number,
  speaker: string,
  words: Array<{ start: number; end: number; word: string }>,
  text: string
): DocxSegmentNode {
  return new DocxSegmentNode(index, startTime, endTime, speaker, words, text);
}

function $isDocxSegmentNode(
  node: LexicalNode | null | undefined
): node is DocxSegmentNode {
  return node instanceof DocxSegmentNode;
}
Now, let's create a function to process the DOCX data and populate the editor:
function processDocxData(editor: LexicalEditor, docxData: any) {
  editor.update(() => {
    const root = $getRoot();

    docxData.transcript.segments.forEach((segment: any) => {
      const segmentNode = $createDocxSegmentNode(
        segment.index,
        segment.start_time,
        segment.end_time,
        segment.speaker,
        segment.words,
        segment.text
      );

      const paragraphNode = $createParagraphNode();
      paragraphNode.append(segmentNode);
      root.append(paragraphNode);
    });
  });
}
Register the custom node:
const nodes = [DocxSegmentNode];

<LexicalComposer initialConfig={{nodes}}>
  {/* ... */}
</LexicalComposer>
Use the processor:
// Assuming you have your DOCX data in a variable called docxData
processDocxData(editor, docxData);
This setup will create a custom node for each segment in your DOCX file. The node will store all the metadata (index, start time, end time, speaker, and words), but only display the text content to the user.

To retrieve the data later, you could do something like:

editor.getEditorState().read(() => {
  const root = $getRoot();
  root.getChildren().forEach(paragraph => {
    paragraph.getChildren().forEach(node => {
      if ($isDocxSegmentNode(node)) {
        console.log(
          node.getTextContent(),
          node.getIndex(),
          node.getStartTime(),
          node.getEndTime(),
          node.getSpeaker(),
          node.getWords()
        );
      }
    });
  });
});
This approach allows you to maintain all the rich metadata of your DOCX file while presenting a clean, text-only interface to the user in the Lexical editor. The user will see only the text, but all the additional data (timing, speaker information, word-level data) is preserved within the editor's state.