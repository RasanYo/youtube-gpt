import { useCallback } from 'react'
import { type UIMessage } from 'ai'

interface UseChatTitleGeneratorProps {
  conversations: Array<{ id: string; title: string }>
  activeConversationId: string | null
  animateTitleUpdate: (conversationId: string, newTitle: string) => Promise<void>
  isGeneratingTitle: boolean
  setIsGeneratingTitle: (generating: boolean) => void
}

export const useChatTitleGenerator = ({
  conversations,
  activeConversationId,
  animateTitleUpdate,
  isGeneratingTitle,
  setIsGeneratingTitle
}: UseChatTitleGeneratorProps) => {
  const generateTitleIfNeeded = useCallback(async (
    messages: UIMessage[],
    assistantContent: string
  ) => {
    if (!activeConversationId) return

    // Generate title if this is the first message pair
    const currentConversation = conversations.find(c => c.id === activeConversationId)
    const isFirstMessage = messages.length === 2 // user + assistant
    const shouldGenerateTitle = isFirstMessage && currentConversation?.title === 'New Chat' && !isGeneratingTitle

    if (shouldGenerateTitle) {
      try {
        setIsGeneratingTitle(true)
        console.log('📝 Generating title for first message pair...')
        
        // Extract user and assistant messages
        const userMessage = messages[0]?.parts?.find(p => p.type === 'text')?.text || ''
        const assistantMessage = assistantContent.substring(0, 300) // Use first 300 chars for context

        if (userMessage && assistantMessage) {
          // Call title generation API
          const response = await fetch('/api/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userMessage, assistantMessage })
          })

          if (!response.ok) throw new Error('Failed to generate title')

          const { title } = await response.json()
          console.log('✅ Generated title:', title)

          // Update with typing animation
          await animateTitleUpdate(activeConversationId, title)
        }
      } catch (error) {
        console.error('❌ Error generating title:', error)
        // Don't block the UI, just log the error
      } finally {
        setIsGeneratingTitle(false)
      }
    }
  }, [activeConversationId, conversations, isGeneratingTitle, animateTitleUpdate, setIsGeneratingTitle])

  return { generateTitleIfNeeded }
}

