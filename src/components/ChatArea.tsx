'use client'

import { Send, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const ChatArea = () => {
  // Empty messages array to show empty state
  const messages: Array<{
    id: number
    role: string
    content: string
  }> = []

  return (
    <div className="flex h-screen flex-1 flex-col">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Bravi AI Assistant</h1>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
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
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left">
                <p className="text-sm font-medium mb-1">Analyze Video Performance</p>
                <p className="text-xs text-muted-foreground">
                  Get insights on views, engagement, and audience retention
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left">
                <p className="text-sm font-medium mb-1">Content Strategy Ideas</p>
                <p className="text-xs text-muted-foreground">
                  Discover trending topics and optimization tips
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left">
                <p className="text-sm font-medium mb-1">SEO Optimization</p>
                <p className="text-xs text-muted-foreground">
                  Improve titles, descriptions, and tags for better reach
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left">
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
                      B
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
                  <p className="text-sm">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-secondary">U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <form className="flex gap-2">
            <Input placeholder="Ask Bravi anything..." className="flex-1" />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
