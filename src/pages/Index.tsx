import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { ConversationSidebar } from '@/components/ConversationSidebar'
import { ChatArea } from '@/components/ChatArea'
import { KnowledgeBase } from '@/components/KnowledgeBase'

const Index = () => {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login')
    }
  }, [user, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

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

export default Index
