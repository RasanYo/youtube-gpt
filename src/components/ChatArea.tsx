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

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export const ChatArea = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const { selectedVideos, removeVideo, clearSelection } = useVideoSelection()
  const { videos } = useVideos()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])


  // Handle form submission and streaming
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Create assistant message for streaming
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      isStreaming: true
    }

    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userId: user.id,
          scope: { type: 'all' }
        })
      })

      if (!response.body) {
        throw new Error('No response body')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        assistantContent += chunk

        // Update the streaming message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: assistantContent }
              : msg
          )
        )
      }

      // Finalize the message
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, isStreaming: false }
            : msg
        )
      )

    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error. Please try again.',
                isStreaming: false 
              }
            : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Handle suggested prompt clicks
  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
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
                    {message.content}
                    {message.isStreaming && (
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
                Context ({selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''}):
              </span>
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
            
            <div className="w-full overflow-x-auto">
              <div className="flex gap-2 pb-2 min-w-max">
                {Array.from(selectedVideos).map((videoId) => {
                  const video = videos.find(v => v.id === videoId)
                  if (!video) return null
                  
                  return (
                    <Badge
                      key={videoId}
                      variant="secondary"
                      className="flex items-center gap-1 px-2 py-1 text-xs cursor-pointer hover:bg-secondary/80 flex-shrink-0"
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
          <form onSubmit={handleSubmit} className="flex gap-2">
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
