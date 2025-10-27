/**
 * Supabase Database Types
 * 
 * This file consolidates all Supabase-related types including:
 * - Auto-generated database schema types (Database, Tables, Enums, etc.)
 * - Type transformation utilities for converting snake_case to camelCase
 * - Helper functions for runtime transformations
 * 
 * The Database type is auto-generated from the Supabase schema.
 * All types are transformed from snake_case (database) to camelCase (TypeScript).
 */

// =============================================================================
// AUTO-GENERATED DATABASE TYPES
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          createdAt: string
          id: string
          title: string
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id: string
          title: string
          updatedAt: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          title?: string
          updatedAt?: string
          userId?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          citations: Json | null
          content: string
          conversationId: string
          createdAt: string
          id: string
          role: Database["public"]["Enums"]["MessageRole"]
        }
        Insert: {
          citations?: Json | null
          content: string
          conversationId: string
          createdAt?: string
          id: string
          role: Database["public"]["Enums"]["MessageRole"]
        }
        Update: {
          citations?: Json | null
          content?: string
          conversationId?: string
          createdAt?: string
          id?: string
          role?: Database["public"]["Enums"]["MessageRole"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversationId_fkey"
            columns: ["conversationId"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          channelName: string | null
          createdAt: string
          duration: number | null
          error: string | null
          id: string
          status: Database["public"]["Enums"]["VideoStatus"]
          thumbnailUrl: string | null
          title: string | null
          updatedAt: string | null
          userId: string
          youtubeId: string
          zeroentropyCollectionId: string | null
        }
        Insert: {
          channelName?: string | null
          createdAt?: string
          duration?: number | null
          error?: string | null
          id?: string
          status?: Database["public"]["Enums"]["VideoStatus"]
          thumbnailUrl?: string | null
          title?: string | null
          updatedAt?: string | null
          userId: string
          youtubeId: string
          zeroentropyCollectionId?: string | null
        }
        Update: {
          channelName?: string | null
          createdAt?: string
          duration?: number | null
          error?: string | null
          id?: string
          status?: Database["public"]["Enums"]["VideoStatus"]
          thumbnailUrl?: string | null
          title?: string | null
          updatedAt?: string | null
          userId?: string
          youtubeId?: string
          zeroentropyCollectionId?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: { Args: { data: string }; Returns: string }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      MessageRole: "USER" | "ASSISTANT"
      VideoStatus:
        | "QUEUED"
        | "PROCESSING"
        | "TRANSCRIPT_EXTRACTING"
        | "ZEROENTROPY_PROCESSING"
        | "READY"
        | "FAILED"
        | "PENDING"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      MessageRole: ["USER", "ASSISTANT"],
      VideoStatus: [
        "QUEUED",
        "PROCESSING",
        "TRANSCRIPT_EXTRACTING",
        "ZEROENTROPY_PROCESSING",
        "READY",
        "FAILED",
        "PENDING",
      ],
    },
  },
} as const

// =============================================================================
// TYPE TRANSFORMATION UTILITIES
// =============================================================================

// Type transformation utilities for snake_case to camelCase conversion
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformToCamelCase<T>(obj: any): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
