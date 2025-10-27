'use client'

import { MessageSquare, LogOut, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { useConversation } from '@/contexts/ConversationContext'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ConversationItemProps {
  conversation: { id: string; title: string; updatedAt: string | null }
  isActive: boolean
  onClick: () => void
}

const ConversationItem = ({ conversation, isActive, onClick }: ConversationItemProps) => {
  return (
    <Button
      variant="ghost"
      className={cn(
        'w-full justify-start text-left h-auto py-3 px-3 hover:bg-accent',
        isActive && 'bg-gray-100 dark:bg-white/5'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2 w-full">
        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-sidebar-foreground">
            {conversation.title}
          </div>
          <div className="text-xs text-muted-foreground">
            {conversation.updatedAt
              ? formatDistanceToNow(new Date(conversation.updatedAt), {
                  addSuffix: true,
                })
              : 'Unknown'}
          </div>
        </div>
      </div>
    </Button>
  )
}

interface ConversationSidebarProfileProps {
  user: ReturnType<typeof useAuth>['user']
  logout: () => void
}

const ConversationSidebarProfile = ({ user, logout }: ConversationSidebarProfileProps) => {
  return (
    <div className="border-t bg-sidebar-accent/50">
      <Separator />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">
              {user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex-1 justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ConversationSidebar = () => {
  const { user, logout } = useAuth()
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createNewConversation,
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
      <ScrollArea className="flex-1 p-2">
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
          <div className="space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversationId === conv.id}
                onClick={() => setActiveConversationId(conv.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <ConversationSidebarProfile user={user} logout={logout} />
    </div>
  )
}
