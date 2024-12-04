# Lexical DraggableBlockPlugin Implementation Guide

## Overview

The DraggableBlockPlugin enables drag-and-drop functionality for block-level nodes in a Lexical editor. It provides:
- A draggable handle menu that appears next to blocks
- A visual indicator line showing where blocks will be dropped
- Smooth reordering of editor content

## Basic Implementation

### 1. Setup the Plugin

```tsx
import { DraggableBlockPlugin } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useRef } from 'react';

function Editor() {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);

  return (
    <LexicalComposer initialConfig={...}>
      {/* Other plugins */}
      <DraggableBlockPlugin 
        menuRef={menuRef}
        targetLineRef={targetLineRef}
        menuComponent={
          <div ref={menuRef} className="draggable-block-menu">
            <div className="icon" />
          </div>
        }
        targetLineComponent={
          <div ref={targetLineRef} className="draggable-block-target-line" />
        }
        isOnMenu={(element) => {
          return element.closest('.draggable-block-menu') !== null;
        }}
      />
    </LexicalComposer>
  );
}
```

### 2. Required CSS

```css
.draggable-block-menu {
  border-radius: 4px;
  padding: 2px 1px;
  cursor: grab;
  opacity: 0;
  position: absolute;
  left: 0;
  top: 0;
  will-change: transform;
}

.draggable-block-menu .icon {
  width: 16px;
  height: 16px;
  opacity: 0.3;
  background-image: url('/drag-handle-icon.svg');
}

.draggable-block-menu:active {
  cursor: grabbing;
}

.draggable-block-target-line {
  pointer-events: none;
  background: deepskyblue;
  height: 4px;
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  will-change: transform;
}
```

## Plugin Props

```typescript
interface DraggableBlockPluginProps {
  // The container element for the editor (defaults to document.body)
  anchorElem?: HTMLElement;
  
  // Refs for the menu and target line elements
  menuRef: React.RefObject<HTMLElement>;
  targetLineRef: React.RefObject<HTMLElement>;
  
  // React components for the menu and target line
  menuComponent: ReactNode;
  targetLineComponent: ReactNode;
  
  // Function to determine if an element is part of the menu
  isOnMenu: (element: HTMLElement) => boolean;
}
```

## How It Works

### 1. Block Detection

The plugin tracks mouse movement to detect block-level nodes:

```typescript
// Inside your editor component
const [editor] = useLexicalComposerContext();

useEffect(() => {
  return editor.registerNodeTransform(BlockNode, (node) => {
    // Make your block nodes draggable by adding necessary attributes
    if ($isBlockNode(node)) {
      node.setDraggable(true);
    }
  });
}, [editor]);
```

### 2. Drag Data Management

The plugin uses HTML5 drag and drop API with custom data format:

```typescript
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block';

// When drag starts
function onDragStart(event: DragEvent) {
  const node = $getNearestNodeFromDOMNode(event.target);
  if (!node) return;
  
  event.dataTransfer?.setData(DRAG_DATA_FORMAT, node.getKey());
}

// When dropping
function onDrop(event: DragEvent) {
  const dragData = event.dataTransfer?.getData(DRAG_DATA_FORMAT);
  const draggedNode = $getNodeByKey(dragData);
  
  if (!draggedNode) return;
  
  // Get target position and reorder
  const targetNode = $getNearestNodeFromDOMNode(event.target);
  if (targetNode) {
    draggedNode.insertAfter(targetNode);
  }
}
```

### 3. Visual Feedback

The plugin provides two types of visual feedback:

1. Drag Handle Menu:
```typescript
function DragHandle({ nodeKey }: { nodeKey: string }) {
  return (
    <div 
      className="draggable-block-menu"
      draggable
      data-drag-handle
      data-block-key={nodeKey}
    >
      <div className="icon" />
    </div>
  );
}
```

2. Drop Target Line:
```typescript
function DropLine() {
  return <div className="draggable-block-target-line" />;
}
```

## Advanced Usage

### 1. Custom Drag Handle Styling

You can customize the drag handle appearance:

```tsx
function CustomDragHandle() {
  return (
    <div className="custom-drag-handle">
      <svg width="24" height="24">
        <path d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"/>
      </svg>
    </div>
  );
}
```

### 2. Custom Drop Validation

Add custom validation logic for drop targets:

```typescript
function canDropAt(draggedNode: LexicalNode, targetNode: LexicalNode): boolean {
  // Example: Only allow dropping paragraphs between other paragraphs
  if ($isParagraphNode(draggedNode)) {
    return $isParagraphNode(targetNode);
  }
  return true;
}

// In your drop handler
function onDrop(event: DragEvent) {
  const draggedNode = $getNodeByKey(dragData);
  const targetNode = $getNearestNodeFromDOMNode(event.target);
  
  if (draggedNode && targetNode && canDropAt(draggedNode, targetNode)) {
    draggedNode.insertAfter(targetNode);
  }
}
```

### 3. Handling Nested Blocks

For nested block structures, implement custom logic:

```typescript
function findNearestDraggableBlock(node: LexicalNode): LexicalNode | null {
  let current = node;
  while (current) {
    if (current.isDraggable()) {
      return current;
    }
    current = current.getParent();
  }
  return null;
}
```

## Best Practices

1. **Performance**: Use `will-change` CSS property for smooth animations:
```css
.draggable-block-menu,
.draggable-block-target-line {
  will-change: transform;
}
```

2. **Accessibility**: Add ARIA attributes:
```tsx
<div 
  role="button"
  aria-label="Drag handle"
  className="draggable-block-menu"
  {...props}
>
  {/* ... */}
</div>
```

3. **Mobile Support**: Add touch event handlers:
```typescript
function onTouchStart(event: TouchEvent) {
  // Implement touch drag logic
}
```

## Common Issues and Solutions

1. **Menu Positioning**: If the menu position is incorrect, check the anchor element:
```typescript
// Ensure anchor element covers the entire editor area
const anchorElem = editorRef.current?.querySelector('.editor-container');
```

2. **Drop Line Visibility**: If the drop line isn't visible, check z-index:
```css
.draggable-block-target-line {
  z-index: 1;
}
```

3. **Drag Preview**: For custom drag previews:
```typescript
function setDragImage(dataTransfer: DataTransfer, elem: HTMLElement) {
  const clone = elem.cloneNode(true) as HTMLElement;
  clone.style.transform = 'translateZ(0)';
  dataTransfer.setDragImage(clone, 0, 0);
}
```

## Example: Complete Implementation

Here's a complete example showing how to implement the plugin with all the features:

```tsx
import { DraggableBlockPlugin } from '@lexical/react/LexicalDraggableBlockPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, useCallback } from 'react';

function EditorWithDraggableBlocks() {
  const [editor] = useLexicalComposerContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  
  const handleIsOnMenu = useCallback((element: HTMLElement) => {
    return element.closest('.draggable-block-menu') !== null;
  }, []);
  
  const DragHandle = () => (
    <div 
      ref={menuRef}
      className="draggable-block-menu"
      role="button"
      aria-label="Drag handle"
    >
      <div className="icon" />
    </div>
  );
  
  const DropLine = () => (
    <div 
      ref={targetLineRef}
      className="draggable-block-target-line"
      role="presentation"
    />
  );
  
  return (
    <div className="editor-container">
      <DraggableBlockPlugin
        menuRef={menuRef}
        targetLineRef={targetLineRef}
        menuComponent={<DragHandle />}
        targetLineComponent={<DropLine />}
        isOnMenu={handleIsOnMenu}
      />
      {/* Other editor content */}
    </div>
  );
}
```

The key thing that made the drag handle finally show up was using draggable={true} directly on the menu component. Here's the specific part that made it work:
typescriptCopymenuComponent={
  <div 
    ref={menuRef} 
    className={DRAGGABLE_BLOCK_MENU_CLASSNAME}
    draggable={true}  // This was crucial!
  >
    <div className="icon" />
  </div>
}
And these CSS properties were essential:
cssCopy.draggable-block-menu {
  opacity: 1 !important; // Force visibility
  position: absolute !important;
  left: 8px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  z-index: 10;
}
The original implementation had the menu with opacity: 0 by default, and it was supposed to show on hover. By forcing opacity: 1 with !important and making sure the positioning was absolute with proper z-index, we made the menu visible.
For getting multiple handles to show up, we need to make sure each draggable section (paragraph + segments) is properly identified to the Lexical plugin as a draggable block. We can do this by:

Adding proper positioning context:

cssCopy.papercut-speaker-group {
  position: relative !important;
  margin: 8px 0;
}

Marking the sections as draggable in the DOM:

typescriptCopyconst group = document.createElement('div');
group.className = 'papercut-speaker-group';
group.setAttribute('data-draggable', 'true'); // Tell Lexical this is draggable
Would you like me to explain any other aspects of how the drag handle implementation works?