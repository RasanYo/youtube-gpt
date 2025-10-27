/**
 * ConversationContext
 * 
 * Manages conversation state and operations for the YouTube-GPT chat interface.
 * Handles conversation list, active conversation selection, CRUD operations, and
 * automatic initialization of the first conversation for new users.
 * 
 * Features:
 * - Auto-loads conversations when user authenticates
 * - Auto-creates first conversation for new users
 * - Maintains conversations sorted by most recent activity
 * - Provides error states for all operations
 * - Race condition prevention for concurrent operations
 * 
 * @module ConversationContext
 */

'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getConversationsByUserId,
  createConversation,
  updateConversationTitle as updateConversationTitleInDB,
  deleteConversation as deleteConversationInDB,
} from '@/lib/supabase/conversations'
import type { ConversationRaw } from '@/lib/supabase/types'

/**
 * Type definition for the conversation context value
 */
interface ConversationContextType {
  /** List of all conversations for the current user, sorted by most recent activity */
  conversations: ConversationRaw[]
  /** ID of the currently active conversation */
  activeConversationId: string | null
  /** Set the active conversation by ID */
  setActiveConversationId: (id: string | null) => void
  /** Loading state for conversation operations */
  isLoading: boolean
  /** Error message if any operation fails */
  error: string | null
  /** Reload all conversations from the database */
  loadConversations: () => Promise<void>
  /** Create a new conversation and set it as active */
  createNewConversation: () => Promise<void>
  /** Update conversation order after a message is sent */
  refreshConversationOrder: (conversationId: string, newUpdatedAt: string) => void
  /** Update a conversation's title */
  updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>
  /** Delete a conversation */
  deleteConversation: (conversationId: string) => Promise<void>
  /** Clear the current error state */
  clearError: () => void
}

const ConversationContext = createContext<
  ConversationContextType | undefined
>(undefined)

/**
 * ConversationProvider component
 * 
 * Provides conversation state and operations to child components.
 * Automatically loads conversations when a user authenticates and creates
 * the first conversation for new users.
 * 
 * The provider uses a ref-based flag to track auto-creation attempts,
 * preventing race conditions and unnecessary re-renders in the dependency array.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the context
 */
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Use a ref to track if we've already attempted auto-creation for this user session
  // This prevents the flag from causing unnecessary re-renders in useEffect dependencies
  const hasAttemptedAutoCreate = useRef(false)

  /**
   * Load all conversations for the current user from the database
   * 
   * Automatically selects the most recent conversation if none is currently active.
   * Resets state when user is null (logged out).
   * 
   * @throws Sets error state if loading fails, but does not throw
   */
  const loadConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setError(null)
      setIsInitialized(false)
      hasAttemptedAutoCreate.current = false
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const data = await getConversationsByUserId(user.id)
      console.log('[ConversationContext] Loaded conversations:', data.length)
      setConversations(data)

      // Auto-load the most recent conversation if none is active
      setActiveConversationId((currentActiveId) => {
        if (!currentActiveId && data.length > 0) {
          return data[0].id
        }
        return currentActiveId
      })
    } catch (error) {
      console.error('[ConversationContext] Error loading conversations:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load conversations'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
      // Mark as initialized after load completes (success or failure)
      setIsInitialized(true)
    }
  }, [user])

  /**
   * Create a new conversation for the current user
   * 
   * Creates a conversation in the database, adds it to the local state,
   * and automatically sets it as the active conversation.
   * 
   * Includes race condition prevention - if a creation is already in progress,
   * subsequent calls will be ignored until the first completes.
   * 
   * @throws Sets error state if creation fails, but does not throw
   */
  const createNewConversation = useCallback(async () => {
    if (!user) {
      console.error('[ConversationContext] Cannot create conversation: user not authenticated')
      setError('Please log in to create a conversation')
      return
    }

    // Prevent duplicate creation (race condition guard)
    if (isCreating) {
      console.warn('[ConversationContext] Creation already in progress, ignoring duplicate request')
      return
    }

    setIsCreating(true)
    setError(null)
    try {
      const newConversation = await createConversation(user.id)
      console.log('[ConversationContext] Created new conversation:', newConversation.id)
      
      // Add new conversation to the list (most recent first)
      setConversations((prev) => [newConversation, ...prev])
      
      // Automatically switch to the new conversation
      setActiveConversationId(newConversation.id)
    } catch (error) {
      console.error('[ConversationContext] Error creating conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create conversation'
      setError(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }, [user, isCreating])

  /**
   * Refresh conversation order after an update
   * 
   * Updates the conversation's `updatedAt` timestamp in local state and
   * re-sorts the list to maintain most-recent-first ordering. This is called
   * after sending a message to bubble the conversation to the top of the list.
   * 
   * This operation is purely local (no database call) and wrapped in try-catch
   * for defensive programming.
   * 
   * @param {string} conversationId - ID of the conversation to update
   * @param {string} newUpdatedAt - ISO timestamp string for the new update time
   */
  const refreshConversationOrder = useCallback((conversationId: string, newUpdatedAt: string) => {
    try {
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
    } catch (error) {
      console.error('[ConversationContext] Error refreshing conversation order:', error)
      // Non-critical error - don't set error state or throw
    }
  }, [])

  /**
   * Update a conversation's title
   * 
   * Updates the title in both the database and local state.
   * The database update happens first, and only updates local state on success.
   * 
   * @param {string} conversationId - ID of the conversation to update
   * @param {string} newTitle - The new title for the conversation
   * @throws Throws error if database update fails (caller should handle)
   */
  const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
    if (!user) {
      console.error('[ConversationContext] Cannot update title: user not authenticated')
      const error = new Error('User not authenticated')
      setError('Please log in to update conversation titles')
      throw error
    }

    try {
      // Update in database first
      await updateConversationTitleInDB(conversationId, newTitle)
      console.log('[ConversationContext] Updated conversation title:', conversationId)

      // Update in local state only after successful database update
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        )
      )
    } catch (error) {
      console.error('[ConversationContext] Error updating conversation title:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update title'
      setError(errorMessage)
      throw error // Re-throw so caller can handle
    }
  }, [user])

  /**
   * Delete a conversation
   * 
   * Deletes the conversation from the database (with cascading message deletion)
   * and removes it from local state. If the deleted conversation was the active
   * one, switches to another conversation or sets active to null.
   * 
   * Includes race condition protection and conversation existence validation.
   * 
   * @param {string} conversationId - ID of the conversation to delete
   * @throws Sets error state if deletion fails, but does not throw
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) {
      console.error('[ConversationContext] Cannot delete conversation: user not authenticated')
      setError('Please log in to delete conversations')
      return
    }

    // Prevent duplicate deletion (race condition guard)
    if (isDeleting) {
      console.warn('[ConversationContext] Deletion already in progress, ignoring duplicate request')
      return
    }

    // Validate conversation exists in local state
    const conversationExists = conversations.some(conv => conv.id === conversationId)
    if (!conversationExists) {
      console.warn('[ConversationContext] Conversation not found in local state:', conversationId)
      return
    }

    setIsDeleting(true)
    setError(null)
    try {
      // Delete from database first
      await deleteConversationInDB(conversationId)
      console.log('[ConversationContext] Deleted conversation:', conversationId)

      // Remove from local state
      setConversations((prevConversations) =>
        prevConversations.filter((conv) => conv.id !== conversationId)
      )

      // Handle active conversation switch
      if (activeConversationId === conversationId) {
        const remainingConversations = conversations.filter((conv) => conv.id !== conversationId)
        if (remainingConversations.length > 0) {
          // Switch to the most recent remaining conversation
          setActiveConversationId(remainingConversations[0].id)
        } else {
          // No conversations left, set to null
          setActiveConversationId(null)
        }
      }
    } catch (error) {
      console.error('[ConversationContext] Error deleting conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete conversation'
      setError(errorMessage)
      throw error // Re-throw so caller can handle
    } finally {
      setIsDeleting(false)
    }
  }, [user, isDeleting, conversations, activeConversationId])

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load conversations when component mounts and user is authenticated
  useEffect(() => {
    if (user) {
      loadConversations()
    } else {
      setConversations([])
      setActiveConversationId(null)
      setIsInitialized(false)
      hasAttemptedAutoCreate.current = false
    }
  }, [user, loadConversations])

  // Auto-create first conversation for new users (only after initialization completes)
  // Uses a ref flag to track if we've already attempted creation, preventing duplicate
  // attempts and simplifying the dependency array
  useEffect(() => {
    const shouldAutoCreate = 
      user && 
      isInitialized && 
      !isLoading && 
      !isCreating &&
      conversations.length === 0 && 
      !hasAttemptedAutoCreate.current

    if (shouldAutoCreate) {
      console.log('[ConversationContext] Auto-creating first conversation for new user')
      hasAttemptedAutoCreate.current = true
      createNewConversation()
    }
  }, [user, isInitialized, isLoading, isCreating, conversations.length, createNewConversation])

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
    deleteConversation,
    clearError,
  }

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  )
}

/**
 * Custom hook to access the conversation context
 * 
 * Must be used within a ConversationProvider component tree.
 * Provides access to all conversation state and operations.
 * 
 * @throws {Error} If used outside of ConversationProvider
 * @returns {ConversationContextType} The conversation context value
 */
export const useConversation = () => {
  const context = useContext(ConversationContext)
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider')
  }
  return context
}

