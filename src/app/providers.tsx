'use client'

import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { VideoSelectionProvider } from '@/contexts/VideoSelectionContext'
import { ConversationProvider } from '@/contexts/ConversationContext'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ConversationProvider>
            <VideoSelectionProvider>
              <Toaster />
              <Sonner />
              {children}
            </VideoSelectionProvider>
          </ConversationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
