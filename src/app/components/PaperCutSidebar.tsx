'use client'

import React, { useState, useCallback, DragEvent } from 'react';
import { FileText, Folder, ChevronRight, ChevronDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { usePaperCut } from '@/app/contexts/PaperCutContext';
import { useEditorContent } from '@/app/contexts/EditorContentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DropIndicator {
  targetId: string;
  position: 'before' | 'after' | 'inside';
}

const PaperCutTree: React.FC<{ parentId: string | null }> = ({ parentId }) => {
  const { 
    getTabs, 
    setActiveTab,
    activeTabId,
    getAllContents,
    isAllContentsSelected,
    deleteTab,
    updateTabName,
    moveTab,
    createFolder
  } = usePaperCut();
  
  const { 
    selectedFileIds, 
    setSelectedFileIds, 
    lastSelectedId, 
    setLastSelectedId 
  } = useEditorContent();

  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set<string>());
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  


  const toggleFolder = useCallback((folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  const handleItemClick = useCallback((itemId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const items = getTabs();
    const clickedItem = items.find(item => item.id === itemId);
    if (!clickedItem) return;

    // Handle folder clicks separately
    if (clickedItem.type === 'folder') {
      toggleFolder(itemId, event);
      return;
    }

    // Update selection state first
    const updateSelection = () => {
      setLastSelectedId(itemId);
      if (event.ctrlKey || event.metaKey) {
        setSelectedFileIds(prev => 
          prev.includes(itemId) 
            ? prev.filter(id => id !== itemId)
            : [...prev, itemId]
        );
      } else if (event.shiftKey && lastSelectedId) {
        const sortedItems = items
          .filter(tab => tab.parentId === parentId && tab.type === 'file')
          .sort((a, b) => a.order - b.order);
        
        const start = sortedItems.findIndex(tab => tab.id === lastSelectedId);
        const end = sortedItems.findIndex(tab => tab.id === itemId);
        const range = sortedItems
          .slice(Math.min(start, end), Math.max(start, end) + 1)
          .map(tab => tab.id);
        setSelectedFileIds(range);
      } else {
        setSelectedFileIds([itemId]);
      }
    };

    // Update selection first, then activate tab
    updateSelection();
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      setActiveTab(itemId);
    }
  }, [getTabs, setSelectedFileIds, lastSelectedId, setLastSelectedId, parentId, setActiveTab]);


  const items = getTabs()
    .filter(tab => tab.parentId === parentId)
    .sort((a, b) => a.order - b.order);
    const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
    };
  
    const handleDragOver = (e: DragEvent<HTMLDivElement>, targetId: string, type: 'file' | 'folder') => {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      
      if (type === 'folder' && y > rect.height / 4 && y < (rect.height * 3) / 4) {
        setDropIndicator({ targetId, position: 'inside' });
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
      } else {
        const position = y < rect.height / 2 ? 'before' : 'after';
        setDropIndicator({ targetId, position });
        e.currentTarget.style.borderTop = position === 'before' ? '2px solid blue' : '';
        e.currentTarget.style.borderBottom = position === 'after' ? '2px solid blue' : '';
      }
    };
  
    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.currentTarget.style.backgroundColor = '';
      e.currentTarget.style.borderTop = '';
      e.currentTarget.style.borderBottom = '';
      setDropIndicator(null);
    };
  
    const handleDrop = (e: DragEvent<HTMLDivElement>, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
  
      const draggedId = e.dataTransfer.getData('text/plain');
      if (!dropIndicator || draggedId === targetId) return;
  
      const targetItem = getTabs().find(tab => tab.id === targetId);
      if (!targetItem) return;
      
      if (dropIndicator.position === 'inside' && targetItem.type === 'folder') {
        moveTab(draggedId, targetId);
      } else {
        moveTab(draggedId, parentId, dropIndicator.position === 'before' ? targetId : null);
      }
  
      setDropIndicator(null);
      e.currentTarget.style.backgroundColor = '';
      e.currentTarget.style.borderTop = '';
      e.currentTarget.style.borderBottom = '';
    };
  
    const handleDelete = (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      deleteTab(itemId);
    };
  
    const handleRename = (e: React.MouseEvent, itemId: string, currentName: string) => {
      e.stopPropagation();
      setEditingItemId(itemId);
      setNewName(currentName);
    };
  
    const handleRenameSubmit = (itemId: string) => {
      if (newName.trim()) {
        updateTabName(itemId, newName.trim());
        setEditingItemId(null);
        setNewName('');
      }
    };
  
    const handleCreateFolder = () => {
      if (newName.trim()) {
        createFolder(newName.trim(), parentId);
        setNewName('');
        setIsCreatingFolder(false);
      }
    };
  
 
    return (
      <div className="pl-4 space-y-2">
        {items.map(item => (
          <React.Fragment key={item.id}>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors 
                ${selectedFileIds.includes(item.id) ? 'bg-primary/10' : 'hover:bg-muted'}
                ${item.type === 'folder' && isAllContentsSelected(item.id) ? 'ring-2 ring-primary' : ''}
                ${item.active && item.type === 'file' ? 'font-medium' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id, item.type)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item.id)}
              onClick={(e) => handleItemClick(item.id, e)}
            >
              {item.type === 'folder' && (
                <span className="text-muted-foreground">
                  {openFolders.has(item.id) ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronRight className="w-4 h-4" />
                  }
                </span>
              )}
              {item.type === 'folder' ? 
                <Folder className="w-4 h-4" /> : 
                <FileText className="w-4 h-4" />
              }
              {editingItemId === item.id ? (
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={() => handleRenameSubmit(item.id)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRenameSubmit(item.id)}
                  className="h-7 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <span className="text-sm truncate flex-grow">
                  {item.name}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => handleRename(e, item.id, item.name)} 
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={(e) => handleDelete(e, item.id)} 
                className="h-7 w-7 opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            {item.type === 'folder' && openFolders.has(item.id) && (
              <PaperCutTree parentId={item.id} />
            )}
          </React.Fragment>
        ))}
  
        {isCreatingFolder ? (
          <div className="flex items-center space-x-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
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
    );
  };
  
  export function PaperCutSidebar() {
    return (
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-medium mb-3">PaperCuts</h3>
        <PaperCutTree parentId={null} />
      </div>
    );
  }