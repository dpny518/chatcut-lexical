// src/app/components/DragDropWrapper.tsx
'use client'

import React, { useState } from 'react'
import { useFileSystem } from '@/app/contexts/FileSystemContext'

interface DragDropWrapperProps {
  children: React.ReactNode
}

export function DragDropWrapper({ children }: DragDropWrapperProps) {
  const { addFiles } = useFileSystem()
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
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

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await addFiles(files, null)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen"
    >
      {isDragging && (
        <div className="fixed inset-0 bg-primary/10 flex items-center justify-center z-50">
          <div className="bg-background p-8 rounded-lg shadow-lg">
            <p className="text-xl font-semibold">Drop files here</p>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}