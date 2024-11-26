// src/app/ClientLayout.tsx
'use client'

import { useEffect } from 'react'
import { FileSystemProvider } from '@/app/contexts/FileSystemContext'
import { EditorContentProvider } from '@/app/contexts/EditorContentContext'
import { DynamicFormattedWordsProvider } from '@/app/components/DynamicFormattedWordsProvider'
import { PaperCutProvider } from '@/app/contexts/PaperCutContext'

interface ClientLayoutProps {
  children: React.ReactNode
  className: string
}

export default function ClientLayout({ children, className }: ClientLayoutProps) {
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    // Add event listeners to prevent file drops
    window.addEventListener('dragover', preventDefault)
    window.addEventListener('drop', preventDefault)

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('dragover', preventDefault)
      window.removeEventListener('drop', preventDefault)
    }
  }, [])

  return (
    <body 
      className={`${className} overflow-hidden`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <FileSystemProvider>
        <PaperCutProvider>
          <EditorContentProvider>
            <DynamicFormattedWordsProvider>
              {children}
            </DynamicFormattedWordsProvider>
          </EditorContentProvider>
        </PaperCutProvider>
      </FileSystemProvider>

      <style jsx global>{`
        /* Disable file drop highlighting */
        *::before,
        *::after {
          pointer-events: none;
        }
      `}</style>
    </body>
  )
}