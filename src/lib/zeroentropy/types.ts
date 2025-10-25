/**
 * Shared types for ZeroEntropy integration
 */

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
 */
export interface ProcessedTranscriptSegment {
  text: string
  start: number
  end: number
  duration: number
  language: string
  segmentIndex: number
  // Additional fields for ZeroEntropy
  userId: string
  videoId: string
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

