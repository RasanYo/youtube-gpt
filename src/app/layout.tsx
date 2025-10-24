import type { Metadata } from 'next'
import { Providers } from './providers'
import '@/index.css'

export const metadata: Metadata = {
  title: 'YouTube GPT - AI Knowledge Base',
  description: 'Transform YouTube videos into an intelligent knowledge base',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
