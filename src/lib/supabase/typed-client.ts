/**
 * Typed Supabase Client
 * 
 * This file exports a Supabase client with full TypeScript type safety
 * based on the database schema. Types are automatically generated from
 * the database schema using `supabase gen types typescript --local`.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Type-safe table access
export type Video = Database['public']['tables']['videos']['Row']
export type VideoInsert = Database['public']['tables']['videos']['Insert']
export type VideoUpdate = Database['public']['tables']['videos']['Update']

export type Conversation = Database['public']['tables']['conversations']['Row']
export type ConversationInsert = Database['public']['tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['tables']['conversations']['Update']

export type VideoStatus = Database['public']['enums']['video_status']

// Helper functions for type-safe operations
export const videoQueries = {
  // Get all videos for a user
  getByUserId: (userId: string) =>
    supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

  // Get video by YouTube ID
  getByYoutubeId: (youtubeId: string) =>
    supabase
      .from('videos')
      .select('*')
      .eq('youtube_id', youtubeId)
      .single(),

  // Create a new video
  create: (video: VideoInsert) =>
    supabase
      .from('videos')
      .insert(video)
      .select()
      .single(),

  // Update video status
  updateStatus: (id: string, status: VideoStatus, error?: string) =>
    supabase
      .from('videos')
      .update({ status, error })
      .eq('id', id)
      .select()
      .single(),

  // Update video metadata
  updateMetadata: (id: string, metadata: Partial<Pick<VideoUpdate, 'title' | 'thumbnail_url' | 'channel_name' | 'duration'>>) =>
    supabase
      .from('videos')
      .update(metadata)
      .eq('id', id)
      .select()
      .single()
}

export const conversationQueries = {
  // Get all conversations for a user
  getByUserId: (userId: string) =>
    supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

  // Create a new conversation
  create: (conversation: ConversationInsert) =>
    supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single(),

  // Update conversation title
  updateTitle: (id: string, title: string) =>
    supabase
      .from('conversations')
      .update({ title })
      .eq('id', id)
      .select()
      .single(),

  // Delete conversation
  delete: (id: string) =>
    supabase
      .from('conversations')
      .delete()
      .eq('id', id)
}
