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
