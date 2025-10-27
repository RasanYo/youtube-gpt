/**
 * Shared types for ZeroEntropy integration
 */

import { UIMessage } from 'ai'
import type { CommandId } from '@/lib/chat-commands/types'

/**
 * Raw transcript segment from YouTube
 */
export interface TranscriptSegment {
  text: string
  start: number
  duration: number
  language: string
}

/**
 * Processed transcript segment for ZeroEntropy indexing
 * Can represent either a single segment or a chunk of multiple segments
 */
export interface ProcessedTranscriptSegment {
  text: string
  start: number
  end: number
  duration: number
  language?: string
  segmentIndex?: number
  // Additional fields for ZeroEntropy
  userId: string
  videoId: string
  videoTitle: string
  // Chunk-specific fields (optional for backward compatibility)
  /** Number of segments combined in this chunk (1 for non-chunked segments) */
  segmentCount?: number
  /** Zero-based index of this chunk in the video */
  chunkIndex?: number
}

/**
 * Transcript data structure from YouTube extraction
 */
export interface TranscriptData {
  transcript: TranscriptSegment[]
  metadata: {
    totalSegments: number
    totalDuration: number
    totalTextLength: number
    language: string
    extractedAt: string
    processingTimeMs: number
  }
}

/**
 * Chat scope configuration for video search
 */
export interface ChatScope {
  type: 'all' | 'selected'
  videoIds?: string[]
}

/**
 * Chat request payload - using AI SDK types
 */
export interface ChatRequest {
  messages: UIMessage[]
  userId: string
  scope: ChatScope
  conversationId?: string
  /** Optional command ID for server-side prompt enhancement */
  commandId?: CommandId
}

