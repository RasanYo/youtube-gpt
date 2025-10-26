/**
 * Conversation Database Operations
 *
 * This module provides functions to interact with the conversations table in Supabase.
 */

import { supabase } from '@/lib/supabase/client'
import type { ConversationRaw } from '@/lib/supabase/types'

/**
 * Get all conversations for a specific user
 * Returns conversations sorted by most recent update time
 */
export async function getConversationsByUserId(
  userId: string
): Promise<ConversationRaw[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('userId', userId)
      .order('updatedAt', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      throw new Error(`Failed to fetch conversations: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error in getConversationsByUserId:', error)
    throw error
  }
}

/**
 * Create a new conversation for a user
 * @param userId - The user ID
 * @param title - Optional conversation title (defaults to "New Chat")
 * @returns The created conversation
 */
export async function createConversation(
  userId: string,
  title: string = 'New Chat'
): Promise<ConversationRaw> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        userId,
        title,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    if (!data) {
      throw new Error('Failed to create conversation: No data returned')
    }

    return data
  } catch (error) {
    console.error('Error in createConversation:', error)
    throw error
  }
}

/**
 * Update a conversation's title
 * @param conversationId - The conversation ID
 * @param title - The new title
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating conversation title:', error)
      throw new Error(`Failed to update conversation title: ${error.message}`)
    }
  } catch (error) {
    console.error('Error in updateConversationTitle:', error)
    throw error
  }
}

