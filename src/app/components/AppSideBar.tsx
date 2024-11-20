'use client'

import React, { useState, useCallback, DragEvent } from 'react'
import { Folder, File, Image, ChevronRight, ChevronDown, Plus, Trash2, Edit2 } from 'lucide-react'
import { useFileSystem, FileSystemItem, FileType } from '@/app/contexts/FileSystemContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Editor } from '@/app/text-editor'

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
  const { files, selectedItems, moveItem, deleteItem, renameItem, createFolder, toggleItemSelection } = useFileSystem()
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

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

  const handleItemClick = (itemId: string) => {
    console.log("FileSystemTree: Item clicked", itemId);
    toggleItemSelection(itemId);
  }
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

  const renderItem = (item: FileSystemItem) => (
    <div
      key={item.id}
      className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer ${
        selectedItems.includes(item.id) ? 'bg-blue-100' : 'hover:bg-gray-100'
      }`}
      draggable
      onDragStart={(e) => handleDragStart(e, item.id)}
      onDragOver={(e) => handleDragOver(e, item.id, item.type)}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, item.id)}
      onClick={() => handleItemClick(item.id)}
    >
      {item.type === 'folder' && (
        <span onClick={(e) => toggleFolder(item.id, e)}>
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
          className="h-6 text-sm"
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span className="text-sm truncate flex-grow">{item.name}</span>
      )}
      <Button variant="ghost" size="sm" onClick={(e) => handleRename(e, item.id)}>
        <Edit2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={(e) => handleDelete(e, item.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )

  const sortedItems = Object.values(files)
    .filter(file => file.parentId === parentId)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="pl-4">
      {sortedItems.map(item => (
        <React.Fragment key={item.id}>
          {renderItem(item)}
          {item.type === 'folder' && openFolders.has(item.id) && (
            <FileSystemTree parentId={item.id} />
          )}
        </React.Fragment>
      ))}
      {isCreatingFolder ? (
        <div className="flex items-center mt-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name"
            className="h-8 text-sm mr-2"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <Button size="sm" onClick={handleCreateFolder}>Create</Button>
        </div>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsCreatingFolder(true)}
          className="mt-2"
        >
          <Plus className="w-4 h-4 mr-2" /> New Folder
        </Button>
      )}
    </div>
  )
}

export function AppSidebar() {
  const { addFile } = useFileSystem();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log("AppSidebar: File upload started", file.name);
      await addFile(file, null) // null indicates root level
      console.log("AppSidebar: File upload completed", file.name);
    }
  }

  return (
    <div className="w-64 h-screen overflow-auto bg-white border-r border-gray-200">
      <div className="p-4">
        <Button 
          onClick={() => {
            console.log("AppSidebar: Upload button clicked");
            document.getElementById('file-upload')?.click();
          }} 
          className="w-full mb-4"
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
    </div>
  )
}
