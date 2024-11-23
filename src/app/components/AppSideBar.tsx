'use client'

import React, { useState, useCallback, DragEvent } from 'react'
import { Folder, File, Image, ChevronRight, ChevronDown, Plus, Trash2, Edit2 } from 'lucide-react'
import { useFileSystem, FileSystemItem, FileType } from '@/app/contexts/FileSystemContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEditorContent } from '@/app/contexts/EditorContentContext';

const FileIcon: React.FC<{ type: FileType }> = ({ type }) => {
  switch (type) {
    case 'folder': return <Folder className="w-4 h-4" />
    case 'image': return <Image className="w-4 h-4" />
    default: return <File className="w-4 h-4" />
  }
}

interface DropIndicator {
  targetId: string
  position: 'before' | 'after' | 'inside'
}

const FileSystemTree: React.FC<{ parentId: string | null }> = ({ parentId }) => {
  const { files, moveItem, deleteItem, renameItem, createFolder } = useFileSystem();
  const { selectedFileIds, setSelectedFileIds, lastSelectedId, setLastSelectedId } = useEditorContent();
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const toggleFolder = useCallback((folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenFolders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(folderId)) {
        newSet.delete(folderId)
      } else {
        newSet.add(folderId)
      }
      return newSet
    })
  }, [])

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData('text/plain', id)
    e.dataTransfer.effectAllowed = 'move'
  }

  
  const sortedItems = Object.values(files)
  .filter(file => file.parentId === parentId)
  .sort((a, b) => a.order - b.order);
  
const getAllContents = (folderId: string): string[] => {
  const contents: string[] = [];
  const queue = [folderId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const item = files[currentId];
    if (item.type === 'file') {
      contents.push(currentId);
    } else if (item.type === 'folder') {
      const childItems = Object.values(files)
        .filter(f => f.parentId === currentId)
        .sort((a, b) => a.order - b.order);
      childItems.forEach(child => queue.push(child.id));
    }
  }
  return contents;
};
const isAllContentsSelected = (folderId: string): boolean => {
  const contents = getAllContents(folderId);
  return contents.every(id => selectedFileIds.includes(id));
};

const handleItemClick = useCallback((itemId: string, event: React.MouseEvent) => {
  console.log("FileSystemTree: Item clicked", itemId);
  setLastSelectedId(itemId);
  setSelectedFileIds((prevSelectedIds: string[]) => {
    const clickedItem = files[itemId];
    
    // Handle Ctrl/Cmd key (multi-select)
    if (event.ctrlKey || event.metaKey) {
      if (prevSelectedIds.includes(itemId)) {
        // Unselect the item and its contents if it's a folder
        if (clickedItem.type === 'folder') {
          const folderContents = getAllContents(itemId);
          return prevSelectedIds.filter(id => !folderContents.includes(id));
        } else {
          return prevSelectedIds.filter(id => id !== itemId);
        }
      } else {
        // Select the item and its contents if it's a folder
        if (clickedItem.type === 'folder') {
          const folderContents = getAllContents(itemId);
          return Array.from(new Set([...prevSelectedIds, ...folderContents]));
        } else {
          return [...prevSelectedIds, itemId];
        }
      }
    }
    
    // Handle Shift key (range select)
    if (event.shiftKey && lastSelectedId) {
      const start = sortedItems.findIndex(item => item.id === lastSelectedId);
      const end = sortedItems.findIndex(item => item.id === itemId);
      const range = sortedItems.slice(Math.min(start, end), Math.max(start, end) + 1);
      return Array.from(new Set(range.flatMap(item => item.type === 'folder' ? getAllContents(item.id) : item.id)));
    }
    
    // Normal click (single select or unselect)
    if (prevSelectedIds.length === 1 && prevSelectedIds[0] === itemId) {
      // If the clicked item is the only selected item, unselect it
      return [];
    } else {
      // Otherwise, select only this item (or its contents if it's a folder)
      if (clickedItem.type === 'folder') {
        return getAllContents(itemId);
      } else {
        return [itemId];
      }
    }
  });
}, [files, setSelectedFileIds, setLastSelectedId, lastSelectedId, sortedItems]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>, targetId: string, type: FileType) => {
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    
    if (type === 'folder' && y > rect.height / 4 && y < (rect.height * 3) / 4) {
      setDropIndicator({ targetId, position: 'inside' })
      e.currentTarget.style.backgroundColor = 'rgba(0, 0, 255, 0.1)'
    } else {
      const position = y < rect.height / 2 ? 'before' : 'after'
      setDropIndicator({ targetId, position })
      e.currentTarget.style.borderTop = position === 'before' ? '2px solid blue' : ''
      e.currentTarget.style.borderBottom = position === 'after' ? '2px solid blue' : ''
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.backgroundColor = ''
    e.currentTarget.style.borderTop = ''
    e.currentTarget.style.borderBottom = ''
    setDropIndicator(null)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const draggedId = e.dataTransfer.getData('text/plain')
    if (!dropIndicator || draggedId === targetId) return

    const targetItem = files[targetId]
    
    if (dropIndicator.position === 'inside' && targetItem.type === 'folder') {
      moveItem(draggedId, targetId, null)
    } else {
      const nextId = dropIndicator.position === 'before' ? targetId : null
      moveItem(draggedId, targetItem.parentId, nextId)
    }

    setDropIndicator(null)
    e.currentTarget.style.backgroundColor = ''
    e.currentTarget.style.borderTop = ''
    e.currentTarget.style.borderBottom = ''
  }

  const handleDelete = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    deleteItem(itemId)
  }

  const handleRename = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    setEditingItemId(itemId)
    setNewFolderName(files[itemId].name)
  }

  const handleRenameSubmit = (itemId: string) => {
    if (newFolderName.trim()) {
      renameItem(itemId, newFolderName.trim())
      setEditingItemId(null)
      setNewFolderName('')
    }
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim(), parentId)
      setNewFolderName('')
      setIsCreatingFolder(false)
    }
  }

  const renderItem = (item: FileSystemItem) => {
    const isFolder = item.type === 'folder';
    const isSelected = selectedFileIds.includes(item.id);
    const isFullySelected = isFolder && isAllContentsSelected(item.id);
  
    return (
      <div
      key={item.id}
      className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        isSelected || isFullySelected ? 'bg-primary/10' : 'hover:bg-muted'
      } ${
        isFullySelected ? 'ring-2 ring-primary' : ''
      }`}
      draggable
      onDragStart={(e) => handleDragStart(e, item.id)}
      onDragOver={(e) => handleDragOver(e, item.id, item.type)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, item.id)}
      onClick={(e) => handleItemClick(item.id, e)}
      >
        {isFolder && (
          <span onClick={(e) => toggleFolder(item.id, e)} className="text-muted-foreground">
            {openFolders.has(item.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        )}
        <FileIcon type={item.type} />
        {editingItemId === item.id ? (
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => handleRenameSubmit(item.id)}
            onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit(item.id)}
            className="h-7 text-sm"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className={`text-sm truncate flex-grow ${isFullySelected ? 'font-semibold' : ''}`}>{item.name}</span>
        )}
        <Button variant="ghost" size="icon" onClick={(e) => handleRename(e, item.id)} className="h-7 w-7">
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, item.id)} className="h-7 w-7">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    );
  };

 

  return (
    <div className="pl-4 space-y-2">
      {sortedItems.map(item => (
        <React.Fragment key={item.id}>
          {renderItem(item)}
          {item.type === 'folder' && openFolders.has(item.id) && (
            <div className="ml-4">
              <FileSystemTree parentId={item.id} />
            </div>
          )}
        </React.Fragment>
      ))}
      {isCreatingFolder ? (
        <div className="flex items-center space-x-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name"
            className="h-8 text-sm flex-grow"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder} className="h-8 px-3">
            Create
          </Button>
        </div>
      ) : (
        <div 
          onClick={() => setIsCreatingFolder(true)}
          className="flex items-center px-2 py-1 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="text-sm">New Folder</span>
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const { addFiles } = useFileSystem();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await addFiles(files, null);
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Button 
        onClick={() => document.getElementById('file-upload')?.click()} 
        className="w-full"
        variant="default"
      >
        Upload Files
      </Button>
      <input
        id="file-upload"
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
      <FileSystemTree parentId={null} />
    </div>
  );
}