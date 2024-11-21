# Lexical Editor Development Guide

## Core Concepts

### Editor Setup
The basic setup requires three main components:
```tsx
<LexicalComposer initialConfig={editorConfig}>
  <div className="editor-container">
    <RichTextPlugin
      contentEditable={<ContentEditable />}
      placeholder={<div>Enter some text...</div>}
    />
  </div>
</LexicalComposer>
```

Basic editor config:
```tsx
const editorConfig = {
  namespace: 'MyEditor',
  onError: (error) => console.error(error),
  nodes: [], // Register custom nodes here
  theme: {}, // Custom theme classes
};
```

### Node Types
Lexical has several base node types you can extend:

1. ElementNode - For block-level elements like paragraphs
2. TextNode - For text content with formatting
3. DecoratorNode - For React components or custom views
4. LineBreakNode - For line breaks
5. RootNode - The top-level node (one per editor)

Example custom node:
```tsx
class CustomParagraph extends ElementNode {
  static getType(): string {
    return 'custom-paragraph';
  }

  static clone(node: CustomParagraph): CustomParagraph {
    return new CustomParagraph(node.__key);
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('p');
    return dom;
  }

  updateDOM(): boolean {
    return false; 
  }
}
```

### Plugins
Plugins are React components that can:
- Listen to editor events
- Add commands
- Transform content
- Add UI elements

Basic plugin template:
```tsx
function MyPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    // Register listeners/commands here
    return () => {
      // Cleanup
    };
  }, [editor]);

  return null;
}
```

### Text Selection & Commands
Working with selection:
```tsx
editor.update(() => {
  // Get current selection
  const selection = $getSelection();
  
  // Create a range selection
  const node = $getNodeByKey('some-key');
  node.select(0, node.getTextContent().length);
  
  // Format text
  if ($isRangeSelection(selection)) {
    selection.formatText('bold');
  }
});
```

Common commands:
```tsx
// Register command
editor.registerCommand(
  FORMAT_TEXT_COMMAND,
  (payload) => {
    // Handle command
    return true; // Prevent further handling
  },
  COMMAND_PRIORITY_EDITOR
);

// Dispatch command
editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
```

### Editor Updates
Making changes to editor content:
```tsx
editor.update(() => {
  const root = $getRoot();
  const paragraph = $createParagraphNode();
  const text = $createTextNode('Hello world');
  paragraph.append(text);
  root.append(paragraph);
});
```

### Listening to Changes
```tsx
editor.registerUpdateListener(({editorState}) => {
  // Called on every change
  editorState.read(() => {
    const root = $getRoot();
    const text = root.getTextContent();
    console.log(text);
  });
});
```

## Best Practices

1. Always make changes within editor.update()
2. Use commands for user actions
3. Extend base nodes rather than creating from scratch
4. Register custom nodes in the editor config
5. Use plugins for complex functionality
6. Handle cleanup in plugin useEffect returns

## Common Patterns

### Custom Formatting
```tsx
class CustomTextNode extends TextNode {
  static getType(): string {
    return 'custom-text';
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    // Add custom styles/classes
    return element;
  }
}
```

### Decorator Components
```tsx
class ComponentNode extends DecoratorNode<React.Node> {
  decorate(): React.Node {
    return <MyComponent />;
  }
}
```

### Toolbar Integration
```tsx
function Toolbar() {
  const [editor] = useLexicalComposerContext();
  
  const onBoldClick = useCallback(() => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
  }, [editor]);

  return (
    <button onClick={onBoldClick}>Bold</button>
  );
}
```

## Resources

- [Lexical Documentation](https://lexical.dev/)
- [GitHub Repository](https://github.com/facebook/lexical)
- Package Version: 0.20.0
