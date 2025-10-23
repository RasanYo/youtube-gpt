/**
 * Database Types
 * 
 * Clean type definitions extracted from the database schema.
 * Contains only the essential types without client code or helper functions.
 */

import type { Database } from '@/lib/database/types'

// Core table types
export type Video = Database['public']['Tables']['videos']['Row']
export type VideoInsert = Database['public']['Tables']['videos']['Insert']
export type VideoUpdate = Database['public']['Tables']['videos']['Update']

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

// Enum types
export type VideoStatus = Database['public']['Enums']['video_status']

// Re-export the main Database type if needed
export type { Database }
