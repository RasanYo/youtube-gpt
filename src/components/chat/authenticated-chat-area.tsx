'use client'

import { useState, useRef, useEffect } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage } from './chat-message'
import { ChatEmptyState } from './chat-empty-state'
import { ChatInput } from './chat-input'
import { useTitleAnimator } from './chat-title-animator'
import { useChatMessagePersistence } from './use-chat-message-persistence'
import { useChatTitleGenerator } from './use-chat-title-generator'
import { useAuth } from '@/contexts/AuthContext'
import { useConversation } from '@/contexts/ConversationContext'
import { useVideoSelection } from '@/contexts/VideoSelectionContext'
import { useVideos } from '@/hooks/useVideos'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, type UIMessage } from 'ai'
import { VideoScopeBar } from '@/components/video/video-scope-bar'
import { saveMessage, updateConversationUpdatedAt } from '@/lib/supabase/messages'

interface AuthenticatedChatAreaProps {
  user: NonNullable<ReturnType<typeof useAuth>['user']>
  initialMessages: UIMessage[]
}

export const AuthenticatedChatArea = ({ 
  user, 
  initialMessages 
}: AuthenticatedChatAreaProps) => {
  const { selectedVideos, removeVideo, clearSelection } = useVideoSelection()
  const { activeConversationId, refreshConversationOrder, conversations } = useConversation()
  const { videos } = useVideos()
  const { animateTitleUpdate } = useTitleAnimator()
  const { saveUserMessage } = useChatMessagePersistence({ 
    activeConversationId, 
    refreshConversationOrder 
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const { generateTitleIfNeeded } = useChatTitleGenerator({
    conversations,
    activeConversationId,
    animateTitleUpdate,
    isGeneratingTitle,
    setIsGeneratingTitle
  })

  // Helper: Build scope body for sending messages
  const getScopeBody = () => ({
    scope: selectedVideos.size > 0 
      ? { type: 'selected' as const, videoIds: Array.from(selectedVideos) }
      : { type: 'all' as const }
  })

  // Helper: Extract text content from message parts
  const extractTextFromMessage = (message: UIMessage): string => {
    let content = ''
    const parts = message.parts || []
    for (const part of parts) {
      if (part.type === 'text') {
        content += part.text
      }
    }
    return content
  }

  // Helper: Handle assistant message completion
  const handleAssistantMessageFinish = async (message: UIMessage, messages: UIMessage[]) => {
    if (!activeConversationId) {
      console.warn('❌ Cannot save assistant message: no active conversation')
      return
    }

    try {
      // Extract text content from message
      const assistantContent = extractTextFromMessage(message)

      // Save assistant message to database
      await saveMessage({
        conversationId: activeConversationId,
        role: 'ASSISTANT',
        content: assistantContent,
        citations: null // TODO: Extract citations from streaming response
      })

      // Update conversation timestamp
      const updatedAt = new Date().toISOString()
      await updateConversationUpdatedAt(activeConversationId)
      refreshConversationOrder(activeConversationId, updatedAt)

      // Generate title if needed
      await generateTitleIfNeeded(messages, assistantContent)
    } catch (error) {
      console.error('❌ Error saving assistant message:', error)
      console.error('❌ Error details:', error instanceof Error ? error.stack : String(error))
      // TODO: Add user-facing error notification
    }
  }

  // Use the useChat hook from AI SDK - receives messages from parent
  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { userId: user.id }
    }),
    onFinish: async ({message, messages}) => {
      await handleAssistantMessageFinish(message, messages)
    }
  })

  const isLoading = status === 'streaming'

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      await saveUserMessage(input)
      sendMessage({ text: input }, { body: getScopeBody() })
      setInput('')
    }
  }

  // Handle suggested prompt clicks
  const handleSuggestedPrompt = async (prompt: string) => {
    if (!isLoading) {
      await saveUserMessage(prompt)
      sendMessage({ text: prompt }, { body: getScopeBody() })
    }
  }

  return (
    <div className="flex h-screen flex-1 flex-col">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Bravi AI Assistant</h1>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
        {messages.length === 0 ? (
          <ChatEmptyState onPromptClick={handleSuggestedPrompt} />
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isLoading={isLoading}
                videos={videos}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Selected Videos Context */}
      <VideoScopeBar
        selectedVideos={selectedVideos}
        videos={videos}
        onRemoveVideo={removeVideo}
        onClearSelection={clearSelection}
      />

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={onSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}

