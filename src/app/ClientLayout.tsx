'use client'

import { useEffect } from 'react'
import { FileSystemProvider } from '@/app/contexts/FileSystemContext'
import { EditorContentProvider } from '@/app/contexts/EditorContentContext'
import { DynamicFormattedWordsProvider } from '@/app/components/DynamicFormattedWordsProvider'
import { PaperCutProvider } from '@/app/contexts/PaperCutContext'
import { EditorProvider } from '@/app/contexts/EditorContext'
import { DragDropWrapper } from '@/app/components/DragDropWrapper'

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

    // Add event listeners to prevent default file drops
    window.addEventListener('dragover', preventDefault)
    window.addEventListener('drop', preventDefault)

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('dragover', preventDefault)
      window.removeEventListener('drop', preventDefault)
    }
  }, [])

  return (
    <body className={`${className} overflow-hidden`}>
      <FileSystemProvider>
        <EditorContentProvider>
          <EditorProvider>
            <PaperCutProvider>
              <DynamicFormattedWordsProvider>
                <DragDropWrapper>
                  {children}
                </DragDropWrapper>
              </DynamicFormattedWordsProvider>
            </PaperCutProvider>
          </EditorProvider>
        </EditorContentProvider>
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