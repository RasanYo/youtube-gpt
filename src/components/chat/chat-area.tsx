'use client'

import { useState, useEffect } from 'react'
import { type UIMessage } from 'ai'
import { ChatAuthRequired } from './chat-auth-required'
import { ChatLoadingState } from './chat-loading-state'
import { AuthenticatedChatArea } from './authenticated-chat-area'
import { useAuth } from '@/contexts/AuthContext'
import { useConversation } from '@/contexts/ConversationContext'
import { getMessagesByConversationId } from '@/lib/supabase/messages'

export const ChatArea = () => {
  const { user } = useAuth()
  const { activeConversationId, isLoading: isConversationLoading } = useConversation()
  const [conversationMessages, setConversationMessages] = useState<UIMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Load messages for active conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId || !user) {
        setConversationMessages([])
        setIsLoadingMessages(false)
        return
      }

      setIsLoadingMessages(true)
      try {
        const dbMessages = await getMessagesByConversationId(activeConversationId)
        
        const convertedMessages: UIMessage[] = dbMessages.map(msg => ({
          id: msg.id,
          role: msg.role === 'USER' ? 'user' : 'assistant',
          parts: [
            {
              type: 'text',
              text: msg.content
            }
          ]
        }))
        
        setConversationMessages(convertedMessages)
        console.log(`✅ Loaded ${convertedMessages.length} messages for conversation ${activeConversationId}`)
      } catch (error) {
        console.error('Error loading messages:', error)
        setConversationMessages([])
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [activeConversationId, user])

  // Check if user is authenticated
  if (!user) {
    return <ChatAuthRequired />
  }

  // Show loading state while conversations are being loaded or created
  if (isConversationLoading || !activeConversationId || isLoadingMessages) {
    return <ChatLoadingState />
  }

  return <AuthenticatedChatArea 
    key={activeConversationId} 
    user={user} 
    initialMessages={conversationMessages}
  />
}
