'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageCircle, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from '@/components/ChatMessage'
import { useAuth } from '@/contexts/AuthContext'
import { useVideoSelection } from '@/contexts/VideoSelectionContext'
import { useVideos } from '@/hooks/useVideos'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { VideoScopeBar } from '@/components/video-scope-bar'

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
              <ChatMessage 
                key={message.id} 
                message={message} 
                isLoading={isLoading}
                videos={videos}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Selected Videos Context */}
      <VideoScopeBar
        selectedVideos={selectedVideos}
        videos={videos}
        onRemoveVideo={removeVideo}
        onClearSelection={clearSelection}
      />

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
