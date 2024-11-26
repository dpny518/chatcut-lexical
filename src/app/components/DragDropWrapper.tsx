'use client'

import React, { useState } from 'react'
import { useFileSystem } from '@/app/contexts/FileSystemContext'

interface DragDropWrapperProps {
  children: React.ReactNode
}

const ALLOWED_TYPES = [
  'application/json',                    // .json files
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx files
  '.srtx'                               // .srtx files
]

export function DragDropWrapper({ children }: DragDropWrapperProps) {
  const { addFiles } = useFileSystem()
  const [isDragging, setIsDragging] = useState(false)

  const isValidFileType = (file: File): boolean => {
    if (file.name.toLowerCase().endsWith('.srtx')) {
      return true
    }
    return ALLOWED_TYPES.includes(file.type)
  }

  const isFromFileSystem = (e: React.DragEvent): boolean => {
    if (!e.dataTransfer.types) return false
    
    return (
      e.dataTransfer.types.includes('Files') &&
      !e.dataTransfer.types.includes('text/plain') &&
      !e.dataTransfer.types.includes('text/html')
    )
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isFromFileSystem(e)) {
      setIsDragging(true)
    } else {
      setIsDragging(false)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (!isFromFileSystem(e)) {
      return
    }
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = files.filter(file => isValidFileType(file))
    
    if (validFiles.length > 0) {
      try {
        // Create a DataTransfer object to convert the array back to FileList
        const dataTransfer = new DataTransfer()
        validFiles.forEach(file => dataTransfer.items.add(file))
        await addFiles(dataTransfer.files, null)
      } catch (err) {
        console.error('Error adding files:', err)
      }
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isFromFileSystem(e)) {
      setIsDragging(true)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragEnter={handleDragEnter}
      onDrop={handleDrop}
      className="min-h-screen relative"
    >
      {isDragging && (
        <div className="fixed inset-0 bg-primary/10 flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-lg shadow-lg text-center">
            <p className="text-lg font-medium">Drop files here</p>
            <p className="text-sm text-muted-foreground mt-2">
              Only .srtx, .json, and .docx files are allowed
            </p>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}