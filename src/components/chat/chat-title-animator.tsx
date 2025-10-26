'use client'

import { useConversation } from '@/contexts/ConversationContext'

export const useTitleAnimator = () => {
  const { updateConversationTitle } = useConversation()

  const animateTitleUpdate = async (conversationId: string, newTitle: string) => {
    const chunkSize = 4 // Display 4 characters at a time
    const chunkDelay = 25 // Delay between chunks in ms

    for (let i = 0; i < newTitle.length; i += chunkSize) {
      const currentChunk = newTitle.slice(i, i + chunkSize)
      const currentTitle = newTitle.slice(0, i + currentChunk.length)

      // Show chunk without cursor
      await updateConversationTitle(conversationId, currentTitle)

      // Add blinking cursor effect
      if (i + chunkSize < newTitle.length) {
        await updateConversationTitle(conversationId, currentTitle + '▊')
        await new Promise(resolve => setTimeout(resolve, chunkDelay))
        await updateConversationTitle(conversationId, currentTitle)
        await new Promise(resolve => setTimeout(resolve, chunkDelay))
      }
    }
  }

  return { animateTitleUpdate }
}

