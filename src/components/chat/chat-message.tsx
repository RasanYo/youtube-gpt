'use client'

import { Loader2, Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { VideoReferenceCard } from './video-reference-card'
import { Response } from '@/components/ai-elements/response'
import { CitationResponse } from './citation-response'
import type { UIMessage } from 'ai'

interface ChatMessageProps {
  message: UIMessage
  isLoading: boolean
  videos?: Array<{ id: string; title: string }>
}

export const ChatMessage = ({ message, isLoading, videos = [] }: ChatMessageProps) => {
  return (
    <div
      className={`flex gap-3 ${
        message.role === 'user' ? 'justify-end' : 'justify-start'
      }`}
    >
      {message.role === 'assistant' && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={`rounded-lg px-4 py-3 max-w-[80%] ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <div className="text-sm whitespace-pre-wrap">
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <CitationResponse key={`${message.id}-${i}`} text={part.text} videos={videos} />
              
              case 'tool-searchKnowledgeBase':
                // Show tool usage notification for searching state
                if (part.state === 'input-streaming' || part.state === 'input-available') {
                  return (
                    <div key={`${message.id}-${i}`} className="inline-flex items-center gap-2 text-xs text-muted-foreground italic">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Searching through videos...</span>
                    </div>
                  )
                }
                
                // Show video references when output is available
                if (part.state === 'output-available' && part.output && typeof part.output === 'object' && 'results' in part.output) {
                  const output = part.output as { results: Array<{ videoId: string; timestamp: string; videoTitle?: string }> }
                  const results = output.results
                  
                  // Deduplicate by videoId and timestamp
                  const uniqueRefs = Array.from(
                    new Map(
                      results.map(result => [
                        `${result.videoId}-${result.timestamp}`,
                        result
                      ])
                    ).values()
                  )
                  
                  if (uniqueRefs.length > 0) {
                    return (
                      <div key={`${message.id}-${i}`} className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Video References</p>
                        <div className="flex flex-wrap gap-2">
                          {uniqueRefs.map((ref, idx) => {
                            // Use videoTitle from search result, fallback to videos prop lookup, or generic
                            const videoTitle = ref.videoTitle || videos.find(v => v.id === ref.videoId)?.title || `Video ${ref.videoId}`
                            return (
                              <VideoReferenceCard
                                key={`${message.id}-${i}-${idx}`}
                                videoTitle={videoTitle}
                                timestamp={ref.timestamp}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  }
                }
                
                return null
              
              default:
                return null
            }
          })}
          {isLoading && message.role === 'assistant' && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
          )}
        </div>
      </div>
      
      {message.role === 'user' && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-secondary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
