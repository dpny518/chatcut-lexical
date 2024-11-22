import { Metadata } from 'next'
import '@/app/globals.css'
import { Inter } from 'next/font/google'
import { FileSystemProvider } from '@/app/contexts/FileSystemContext'
import { EditorContentProvider } from '@/app/contexts/EditorContentContext'
import { FormattedWordsProvider } from '@/app/contexts/FormattedWordsContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ChatCut PaperCut | Transcript Editor',
  description: 'Advanced transcript editing tool for papercuts',
  keywords: ["ChatCut", "PaperCut", "transcript editor", "audio transcription", "video transcription", "next.js"]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FileSystemProvider>
          <EditorContentProvider>
            <FormattedWordsProvider>
              {children}
            </FormattedWordsProvider>
          </EditorContentProvider>
        </FileSystemProvider>
      </body>
    </html>
  )
}