# PaperCut Transcript Editor

PaperCut is an advanced transcript editing tool built with Next.js 13 and the Lexical rich text editor. It provides a powerful environment for managing and editing transcripts with a user-friendly interface, supporting multiple file formats including SRT, JSON, and DOCX.

## Features

- Three-panel layout for efficient workflow
- File system management with create, delete, rename, and update capabilities
- Rich text editing with Lexical editor
- Support for SRT, JSON, and DOCX transcript formats
- Custom nodes for preserving transcript metadata
- Real-time content updates
- Hover cards for displaying word-level metadata
- Read-only mode with word-level selection and movement
- Copy and paste functionality preserving transcript metadata
## Project Structure
src/ app/ # Next.js 13 app directory components/ # Reusable components typing-animation.tsx AppSidebar.tsx # Left panel for file management RightPanel.tsx # Right panel for additional features LexicalEditor.tsx # Main editor component WordHoverCard.tsx # Hover card for word metadata contexts/ # React contexts FileSystemContext.tsx # Manages file system state plugins/ # Lexical editor plugins CopyPastePlugin.tsx # Custom copy and paste functionality WordHoverPlugin.tsx # Plugin for word hover functionality nodes/ # Custom Lexical nodes PaperCutWordNode.ts PaperCutSpeakerNode.ts PaperCutSegmentNode.ts themes/ # Editor theming ExampleTheme.ts types/ # TypeScript type definitions transcript.ts page.tsx # Main page component layout.tsx # Root layout globals.css # Global styles


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
- Hover over words to see metadata
- Use copy and paste to preserve transcript metadata
- Use the right panel for additional features (PaperCut tabs)
## Technologies Used

- Next.js 13
- React
- TypeScript
- Lexical Rich Text Editor
- shadcn/ui components
## Custom Nodes

The project uses custom Lexical nodes to preserve transcript metadata:

- `PaperCutWordNode`: Represents individual words with metadata
- `PaperCutSpeakerNode`: Represents speaker segments
- `PaperCutSegmentNode`: Represents transcript segments
## Plugins

- `CopyPastePlugin`: Handles custom copy and paste functionality to preserve metadata
- `WordHoverPlugin`: Implements hover cards for displaying word metadata
## File Format Support

The editor supports multiple transcript formats:

- SRT
- JSON
- DOCX

Each format has its own processor to convert the data into the custom Lexical nodes.

## Read-Only Mode

The editor implements a custom read-only mode that allows for word-level selection and movement while preventing character-level edits.

## Main Editor (EditorContent)
- Location: Middle panel
- Purpose: Display and interact with transcript files
- Source: Files selected from file system
- State Management: 
  - useFileSystem() for file data
  - useEditorContent() for selection state
- Node Types:
  - WordNode
  - SegmentNode
  - SpeakerNode
- Features:
  - Read-only display of transcripts
  - Drag and drop support
  - Copy functionality
  - Multi-file display

## PaperCut Editor (LexicalEditor)
- Location: Right panel tabs
- Purpose: Edit and create PaperCuts
- Source: User input and dragged content
- State Management:
  - useEditors() for editor instances
  - usePaperCut() for tab state
- Node Types:
  - PaperCutWordNode
  - PaperCutSpeakerNode
  - PaperCutSegmentNode
- Features:
  - Editable content
  - Multiple independent instances (one per tab)
  - Custom toolbar
  - Auto-focus
  - Copy/paste support
  - Word hovering
  - Edit restrictions

  EditorContentContext.tsx (Provider)
├── Maintains State:
│   ├── selectedFileIds[]
│   ├── lastSelectedFileId
│   ├── paperCutSelectedIds[]
│   └── paperCutLastSelectedId
│
└── Provides Methods:
    ├── setSelectedFileIds()
    ├── setLastSelectedFileId()
    ├── setPaperCutSelectedIds()
    └── setPaperCutLastSelectedId()

                ↓ (provides state via context)

editorcontent.tsx (Consumer)
├── Uses State:
│   └── { selectedFileIds } = useEditorContent()
│
├── Renders Content:
│   ├── Processes selected files
│   ├── Creates editor nodes
│   └── Handles drag & drop
│
└── Updates Editor:
    ├── Clears/updates content
    └── Manages copy commands

ooking at the input data format from paste-4.txt, it's structured like this:
word|startTime|endTime|segmentId|speaker|fileId|wordIndex
The key pieces I can see are:

Data Format Parsing:
Each line contains word timing information in a pipe-delimited format. For example:

CopyI|23.196|23.236|5|SPEAKER_00|f3c9dec6-a533-42ec-b8e7-3a81b6edf9c5|0
This contains:

Word: "I"
Start time: 23.196
End time: 23.236
Segment ID: 5
Speaker: "SPEAKER_00"
File ID: f3c9dec6-...
Word Index: 0


Node Structure:


PaperCutWordNode stores individual word timing info
PaperCutSpeakerNode groups words by speaker
PaperCutSegmentNode groups words into segments/paragraphs


Node Creation Flow:
When content is pasted:
The text is parsed into individual word entries
For each segment:

A PaperCutSegmentNode is created with the segment metadata
A PaperCutSpeakerNode is created for the speaker
Multiple PaperCutWordNode instances are created for each word with their timing info


Hierarchy:

CopyPaperCutSegmentNode
  └─ PaperCutSpeakerNode
       └─ PaperCutWordNode (multiple)