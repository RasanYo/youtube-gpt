/**
 * Database Types
 * 
 * Clean type definitions extracted from the database schema.
 * Contains only the essential types without client code or helper functions.
 * 
 * All types are automatically transformed from snake_case (database) to camelCase (TypeScript).
 */

import type { Database } from '@/lib/database/types'

// Type transformation utilities
type SnakeToCamelCase<S extends string> = S extends `${infer P1}_${infer P2}`
  ? `${P1}${Capitalize<SnakeToCamelCase<P2>>}`
  : S

type TransformKeys<T> = {
  [K in keyof T as SnakeToCamelCase<string & K>]: T[K]
}

// Raw database types (snake_case) - for internal use
export type VideoRaw = Database['public']['Tables']['videos']['Row']
export type VideoInsertRaw = Database['public']['Tables']['videos']['Insert']
export type VideoUpdateRaw = Database['public']['Tables']['videos']['Update']

export type ConversationRaw = Database['public']['Tables']['conversations']['Row']
export type ConversationInsertRaw = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdateRaw = Database['public']['Tables']['conversations']['Update']

export type MessageRaw = Database['public']['Tables']['messages']['Row']
export type MessageInsertRaw = Database['public']['Tables']['messages']['Insert']
export type MessageUpdateRaw = Database['public']['Tables']['messages']['Update']

// Transformed types (camelCase) - these are the main exported types
export type Video = TransformKeys<VideoRaw>
export type VideoInsert = TransformKeys<VideoInsertRaw>
export type VideoUpdate = TransformKeys<VideoUpdateRaw>

export type Conversation = TransformKeys<ConversationRaw>
export type ConversationInsert = TransformKeys<ConversationInsertRaw>
export type ConversationUpdate = TransformKeys<ConversationUpdateRaw>

export type Message = TransformKeys<MessageRaw>
export type MessageInsert = TransformKeys<MessageInsertRaw>
export type MessageUpdate = TransformKeys<MessageUpdateRaw>

// Enum types (these don't need transformation)
export type VideoStatus = Database['public']['Enums']['VideoStatus']

// Runtime transformation function
export function transformToCamelCase<T>(obj: any): T {
  const result: any = {}
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

// Helper functions for common transformations
export function transformVideo(raw: VideoRaw): Video {
  return transformToCamelCase<Video>(raw)
}

export function transformConversation(raw: ConversationRaw): Conversation {
  return transformToCamelCase<Conversation>(raw)
}

// Re-export the main Database type if needed
export type { Database }
