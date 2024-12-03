'use client'

import { useEffect } from 'react'
import { FileSystemProvider } from '@/app/contexts/FileSystemContext'
import { EditorContentProvider } from '@/app/contexts/EditorContentContext'
import { DynamicFormattedWordsProvider } from '@/app/components/DynamicFormattedWordsProvider'
import { PaperCutProvider } from '@/app/contexts/PaperCutContext'
import { EditorProvider } from '@/app/contexts/EditorContext'
import { DragDropWrapper } from '@/app/components/DragDropWrapper'
import { ActiveEditorProvider } from '@/app/components/RightPanel/ActiveEditorContext'

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

    window.addEventListener('dragover', preventDefault)
    window.addEventListener('drop', preventDefault)

    return () => {
      window.removeEventListener('dragover', preventDefault)
      window.removeEventListener('drop', preventDefault)
    }
  }, [])

  return (
    <body className={`${className} dark overflow-hidden bg-background text-foreground`}>
      <FileSystemProvider>
        <EditorContentProvider>
          <EditorProvider>
            <PaperCutProvider>
              <DynamicFormattedWordsProvider>
                <ActiveEditorProvider>
                  <DragDropWrapper>
                    {children}
                  </DragDropWrapper>
                </ActiveEditorProvider>
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