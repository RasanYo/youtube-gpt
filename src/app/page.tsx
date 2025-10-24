import { ConversationSidebar } from '@/components/ConversationSidebar'
import { ChatArea } from '@/components/ChatArea'
import { KnowledgeBase } from '@/components/KnowledgeBase'

export default function HomePage() {
  // TODO: Add server-side auth check in Phase 4 with Supabase server client
  // For now, AuthContext in providers handles client-side auth

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Conversation Sidebar - Hidden on mobile, shown from md up */}
      <div className="hidden md:block">
        <ConversationSidebar />
      </div>

      {/* Chat Area - Full width on mobile, flex-1 on larger screens */}
      <ChatArea />

      {/* Knowledge Base - Hidden on mobile and tablet, shown from lg up */}
      <div className="hidden lg:block">
        <KnowledgeBase />
      </div>
    </div>
  )
}
