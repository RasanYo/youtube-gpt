import { useCallback } from 'react'
import { saveMessage, updateConversationUpdatedAt } from '@/lib/supabase/messages'

interface UseChatMessagePersistenceProps {
  activeConversationId: string | null
  refreshConversationOrder: (conversationId: string, updatedAt: string) => void
}

export const useChatMessagePersistence = ({
  activeConversationId,
  refreshConversationOrder
}: UseChatMessagePersistenceProps) => {
  const saveUserMessage = useCallback(async (content: string) => {
    if (!activeConversationId) {
      console.warn('❌ Cannot save message: no active conversation')
      return
    }

    try {
      await saveMessage({
        conversationId: activeConversationId,
        role: 'USER',
        content: content.trim()
      })
      
      // Update conversation updatedAt timestamp
      const updatedAt = new Date().toISOString()
      await updateConversationUpdatedAt(activeConversationId)
      console.log('✅ User message saved to database')
      
      // Refresh conversation order in the list
      refreshConversationOrder(activeConversationId, updatedAt)
    } catch (error) {
      console.error('Error saving user message:', error)
      // TODO: Add user-facing error notification
    }
  }, [activeConversationId, refreshConversationOrder])

  return { saveUserMessage }
}

