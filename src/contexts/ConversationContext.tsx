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
  updateConversationTitle as updateConversationTitleInDB,
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
  refreshConversationOrder: (conversationId: string, newUpdatedAt: string) => void
  updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>
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
  const [isInitialized, setIsInitialized] = useState(false)

  /**
   * Load all conversations for the current user
   */
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setError(null)
      setIsInitialized(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getConversationsByUserId(user.id)
      console.log("Loading conversations", data.length)
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
      // Mark as initialized after load completes
      setIsInitialized(true)
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

  /**
   * Refresh conversation order after an update
   * This keeps the list sorted by most recent activity (updatedAt)
   */
  const refreshConversationOrder = useCallback((conversationId: string, newUpdatedAt: string) => {
    setConversations((prevConversations) => {
      // Find and update the conversation with new updatedAt
      const updatedConversations = prevConversations.map((conv) => {
        if (conv.id === conversationId) {
          return { ...conv, updatedAt: newUpdatedAt }
        }
        return conv
      })

      // Sort by updatedAt descending (most recent first)
      return updatedConversations.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
        return dateB - dateA
      })
    })
  }, [])

  /**
   * Update a conversation's title
   * Updates both database and local state
   */
  const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
    if (!user) {
      console.error('Cannot update title: user not authenticated')
      return
    }

    try {
      // Update in database
      await updateConversationTitleInDB(conversationId, newTitle)

      // Update in local state
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        )
      )
    } catch (error) {
      console.error('Error updating conversation title:', error)
      throw error
    }
  }, [user])

  // Load conversations when component mounts and user is authenticated
  useEffect(() => {
    if (user) {
      loadConversations()
    } else {
      setConversations([])
      setActiveConversationId(null)
      setIsInitialized(false)
    }
  }, [user, loadConversations])

  // Auto-create first conversation if user has no conversations (only after initialization)
  useEffect(() => {
    const shouldCreateFirstConversation =
      user &&
      isInitialized &&  // Only check after initial load is complete
      !isLoading &&
      conversations.length === 0 &&
      !activeConversationId &&
      !isCreating

    if (shouldCreateFirstConversation) {
      console.log("Creating first conversation")
      createNewConversation()
    }
  }, [user, isInitialized, isLoading, conversations.length, activeConversationId, isCreating, createNewConversation])

  const value: ConversationContextType = {
    conversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    error,
    loadConversations,
    createNewConversation,
    refreshConversationOrder,
    updateConversationTitle,
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

