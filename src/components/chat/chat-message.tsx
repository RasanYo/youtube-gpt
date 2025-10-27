'use client'

import { Loader2, Bot, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
                
                // Don't display tool output - citations are now inline in the text response
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
