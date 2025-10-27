'use client'

import { MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useConversation } from '@/contexts/ConversationContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationItem } from './conversation-item'
import { ConversationSidebarProfile } from './conversation-sidebar-profile'

export const ConversationSidebar = () => {
  const { user, logout } = useAuth()
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
    updateConversationTitle,
    isLoading,
    error,
  } = useConversation()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar">
      {/* Header with New Chat Button */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold text-sidebar-foreground">
          Conversations
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="New Chat"
          onClick={createNewConversation}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 p-3">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-1 font-medium">
              No conversations yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                onEditTitle={updateConversationTitle}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <ConversationSidebarProfile />
    </div>
  )
}
