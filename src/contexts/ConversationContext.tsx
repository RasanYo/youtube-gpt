'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getConversationsByUserId,
  createConversation,
} from '@/lib/supabase/conversations'
import type { ConversationRaw } from '@/lib/supabase/types'

interface ConversationContextType {
  conversations: ConversationRaw[]
  activeConversationId: string | null
  setActiveConversationId: (id: string | null) => void
  isLoading: boolean
  error: string | null
  loadConversations: () => Promise<void>
  createNewConversation: () => Promise<void>
  refreshConversations: () => Promise<void>
}

const ConversationContext = createContext<
  ConversationContextType | undefined
>(undefined)

export const ConversationProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<ConversationRaw[]>([])
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Load all conversations for the current user
   */
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getConversationsByUserId(user.id)
      setConversations(data)

      // Auto-load the most recent conversation if none is active
      setActiveConversationId((currentActiveId) => {
        if (!currentActiveId && data.length > 0) {
          return data[0].id
        }
        return currentActiveId
      })
    } catch (error) {
      console.error('Error loading conversations:', error)
      setError(error instanceof Error ? error.message : 'Failed to load conversations')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  /**
   * Create a new conversation
   */
  const createNewConversation = useCallback(async () => {
    if (!user) {
      console.error('Cannot create conversation: user not authenticated')
      setError('Please log in to create a conversation')
      return
    }

    // Prevent duplicate creation
    if (isCreating) {
      return
    }

    setIsCreating(true)
    setError(null)
    try {
      const newConversation = await createConversation(user.id)
      
      // Add new conversation to the list (most recent first)
      setConversations((prev) => [newConversation, ...prev])
      
      // Automatically switch to the new conversation
      setActiveConversationId(newConversation.id)
    } catch (error) {
      console.error('Error creating conversation:', error)
      setError(error instanceof Error ? error.message : 'Failed to create conversation')
    } finally {
      setIsCreating(false)
    }
  }, [user, isCreating])

  // Load conversations when component mounts and user is authenticated
  useEffect(() => {
    if (user) {
      loadConversations()
    } else {
      setConversations([])
      setActiveConversationId(null)
    }
  }, [user, loadConversations])

  // Auto-create first conversation if user has no conversations
  useEffect(() => {
    const shouldCreateFirstConversation =
      user &&
      !isLoading &&
      conversations.length === 0 &&
      !activeConversationId &&
      !isCreating

    if (shouldCreateFirstConversation) {
      createNewConversation()
    }
  }, [user, isLoading, conversations.length, activeConversationId, isCreating, createNewConversation])

  // Expose refreshConversations as an alias to loadConversations
  // This can be called after saving messages to update the conversation list
  const refreshConversations = useCallback(async () => {
    await loadConversations()
  }, [loadConversations])

  const value: ConversationContextType = {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    error,
    loadConversations,
    createNewConversation,
    refreshConversations,
  }

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  )
}

export const useConversation = () => {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}

