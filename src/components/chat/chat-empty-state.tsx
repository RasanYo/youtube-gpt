'use client'

import { MessageCircle, Sparkles } from 'lucide-react'

interface ChatEmptyStateProps {
  onPromptClick: (prompt: string) => void
}

export const ChatEmptyState = ({ onPromptClick }: ChatEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="relative mb-6">
        <MessageCircle className="h-16 w-16 text-muted-foreground/30" />
        <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
      </div>
      <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome to Bravi AI</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Your intelligent YouTube assistant. Ask me anything about your videos, content strategy, or get insights
        from your knowledge base.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
        <div
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
          onClick={() => onPromptClick('Analyze my video performance and engagement metrics')}
        >
          <p className="text-sm font-medium mb-1">Analyze Video Performance</p>
          <p className="text-xs text-muted-foreground">Get insights on views, engagement, and audience retention</p>
        </div>
        <div
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
          onClick={() => onPromptClick('What content strategy ideas should I explore?')}
        >
          <p className="text-sm font-medium mb-1">Content Strategy Ideas</p>
          <p className="text-xs text-muted-foreground">Discover trending topics and optimization tips</p>
        </div>
        <div
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
          onClick={() => onPromptClick('How can I improve my video SEO and discoverability?')}
        >
          <p className="text-sm font-medium mb-1">SEO Optimization</p>
          <p className="text-xs text-muted-foreground">Improve titles, descriptions, and tags for better reach</p>
        </div>
        <div
          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer text-left"
          onClick={() => onPromptClick('What insights can you provide about my audience?')}
        >
          <p className="text-sm font-medium mb-1">Audience Insights</p>
          <p className="text-xs text-muted-foreground">Understand your viewers and grow your channel</p>
        </div>
      </div>
    </div>
  )
}

