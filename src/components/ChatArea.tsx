'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, Sparkles, Loader2, Bot, User, Video, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { useVideoSelection } from '@/contexts/VideoSelectionContext'
import { useVideos } from '@/hooks/useVideos'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

export const ChatArea = () => {
  const { user } = useAuth()

  // Check if user is authenticated
  if (!user) {
    return (
      <div className="flex h-screen flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Bravi AI Assistant</h1>
        </div>
        
        {/* Authentication Required Message */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="relative mb-6">
              <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto" />
              <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">
              Authentication Required
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Please log in to access the AI assistant and start chatting about your YouTube videos.
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2"
            >
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <AuthenticatedChatArea user={user} />
}

// Separate component for authenticated chat
const AuthenticatedChatArea = ({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) => {
  const { selectedVideos, removeVideo, clearSelection } = useVideoSelection()
  const { videos } = useVideos()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    console.log('selectedVideos', selectedVideos)
  }, [user, selectedVideos])

  // Use the useChat hook from AI SDK - only runs when user is authenticated
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        userId: user.id // Only userId in transport body - scope passed per message
      }
    })
  })

  const isLoading = status === 'streaming'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle form submission
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      console.log('Sending message:', input)
      sendMessage(
        { text: input },
        {
          body: {
            scope: selectedVideos.size > 0 
              ? { type: 'selected', videoIds: Array.from(selectedVideos) }
              : { type: 'all' }
          }
        }
      )
      setInput('')
    }
  }

  // Handle suggested prompt clicks
  const handleSuggestedPrompt = (prompt: string) => {
    if (!isLoading) {
      sendMessage(
        { text: prompt },
        {
          body: {
            scope: selectedVideos.size > 0 
              ? { type: 'selected', videoIds: Array.from(selectedVideos) }
              : { type: 'all' }
          }
        }
      )
    }
  }

  return (
    <div className="flex h-screen flex-1 flex-col">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Bravi AI Assistant</h1>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="relative mb-6">
              <MessageCircle className="h-16 w-16 text-muted-foreground/30" />
              <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground">
              Welcome to Bravi AI
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Your intelligent YouTube assistant. Ask me anything about your
              videos, content strategy, or get insights from your knowledge base.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
              <div 
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
                onClick={() => handleSuggestedPrompt("Analyze my video performance and engagement metrics")}
              >
                <p className="text-sm font-medium mb-1">Analyze Video Performance</p>
                <p className="text-xs text-muted-foreground">
                  Get insights on views, engagement, and audience retention
                </p>
              </div>
              <div 
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
                onClick={() => handleSuggestedPrompt("What content strategy ideas should I explore?")}
              >
                <p className="text-sm font-medium mb-1">Content Strategy Ideas</p>
                <p className="text-xs text-muted-foreground">
                  Discover trending topics and optimization tips
                </p>
              </div>
              <div 
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
                onClick={() => handleSuggestedPrompt("How can I improve my video SEO and discoverability?")}
              >
                <p className="text-sm font-medium mb-1">SEO Optimization</p>
                <p className="text-xs text-muted-foreground">
                  Improve titles, descriptions, and tags for better reach
                </p>
              </div>
              <div 
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
                onClick={() => handleSuggestedPrompt("What insights can you provide about my audience?")}
              >
                <p className="text-sm font-medium mb-1">Audience Insights</p>
                <p className="text-xs text-muted-foreground">
                  Understand your viewers and grow your channel
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div
                key={message.id}
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
                          return <div key={`${message.id}-${i}`}>{part.text}</div>
                        
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
                          // Don't show output as per user request
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
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Selected Videos Context */}
      {selectedVideos.size > 0 && (
        <div className="border-t bg-muted/30 px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Search Scope ({selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''}):
              </span>
              <Badge variant="outline" className="text-xs">
                Limited to selected videos
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-6 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="w-full">
              <div className="flex flex-wrap gap-2 pb-2">
                {Array.from(selectedVideos).map((videoId) => {
                  const video = videos.find(v => v.id === videoId)
                  if (!video) return null
                  
                  return (
                    <Badge
                      key={videoId}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1 text-xs cursor-pointer hover:bg-secondary/80"
                      onClick={() => removeVideo(videoId)}
                    >
                      <Video className="h-3 w-3" />
                      <span className="max-w-32 truncate">{video.title}</span>
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input 
              placeholder="Ask Bravi anything..." 
              className="flex-1" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
