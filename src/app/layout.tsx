// src/app/layout.tsx
import { Metadata } from 'next'
import '@/app/globals.css'
import { Inter } from 'next/font/google'
import ClientLayout from '@/app/clientlayout'

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
      <ClientLayout className={inter.className}>
        {children}
      </ClientLayout>
    </html>
  )
}