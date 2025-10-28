'use client'

import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { VideosProvider } from '@/contexts/VideosContext'
import { VideoSelectionProvider } from '@/contexts/VideoSelectionContext'
import { ConversationProvider } from '@/contexts/ConversationContext'
import { VideoPreviewProvider } from '@/contexts/VideoPreviewContext'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <VideosProvider>
            <ConversationProvider>
              <VideoSelectionProvider>
                <VideoPreviewProvider>
                  <Toaster />
                  <Sonner />
                  {children}
                </VideoPreviewProvider>
              </VideoSelectionProvider>
            </ConversationProvider>
          </VideosProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
