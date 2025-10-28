/**
 * Transcript chunking utilities for ZeroEntropy indexing
 *
 * This module provides functionality to intelligently chunk transcript segments
 * into larger, semantically coherent chunks for improved search quality.
 * Target: 500-800 tokens per chunk with 10% overlap between chunks.
 */

import { TranscriptSegment, ProcessedTranscriptSegment, ChunkLevel, TranscriptData } from './types'

/**
 * Configuration for transcript chunking
 */
export interface ChunkingConfig {
  /** Target number of tokens per chunk (default: 600) */
  targetTokens: number
  /** Minimum tokens per chunk (default: 500) */
  minTokens: number
  /** Maximum tokens per chunk (default: 800) */
  maxTokens: number
  /** Overlap percentage between chunks (default: 0.1 for 10%) */
  overlapPercentage: number
}

/**
 * Configuration for Level 2 (thematic) chunking based on video duration
 */
export interface Level2ChunkConfig {
  /** Minimum chunk duration in seconds */
  minChunkDuration: number
  /** Maximum chunk duration in seconds */
  maxChunkDuration: number
  /** Target chunk duration in seconds */
  targetChunkDuration: number
}

/**
 * Helper function to create a Level 2 chunk configuration
 */
function createLevel2ChunkConfig(
  minChunkDuration: number,
  maxChunkDuration: number,
  targetChunkDuration: number
): Level2ChunkConfig {
  return {
    minChunkDuration,
    maxChunkDuration,
    targetChunkDuration,
  }
}

/**
 * Default chunking configuration
 */
export const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  targetTokens: 375,
  minTokens: 250,
  maxTokens: 500,
  overlapPercentage: 0.20,
}

/**
 * Statistics about chunking results
 */
export interface ChunkingStats {
  totalChunks: number
  avgTokensPerChunk: number
  avgSegmentsPerChunk: number
  avgDurationPerChunk: number
  minTokensPerChunk: number
  maxTokensPerChunk: number
}

/**
 * Estimates the number of tokens in a given text
 * Uses a simple approximation: ~1 token per 4 characters (GPT tokenization rule of thumb)
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  if (!text) return 0

  // Rule of thumb: 1 token ≈ 4 characters for English text
  // This is a conservative estimate that works well for most languages
  return Math.ceil(text.length / 4)
}

/**
 * Creates a chunk object from a list of segments
 *
 * @param segments - Array of transcript segments to combine into a chunk
 * @param chunkIndex - Zero-based index of this chunk
 * @param userId - User ID who owns this video
 * @param videoId - YouTube video ID
 * @param videoTitle - Title of the video
 * @returns A ProcessedTranscriptSegment representing the chunk
 */
export function createChunk(
  segments: TranscriptSegment[],
  chunkIndex: number,
  userId: string,
  videoId: string,
  videoTitle: string
): ProcessedTranscriptSegment {
  if (segments.length === 0) {
    throw new Error('Cannot create chunk from empty segments array')
  }

  const text = segments.map(s => s.text).join(' ')
  const start = segments[0].start
  const lastSegment = segments[segments.length - 1]
  const end = lastSegment.start + lastSegment.duration
  const duration = end - start

  return {
    text,
    start,
    end,
    duration,
    userId,
    videoId,
    videoTitle,
    segmentCount: segments.length,
    chunkIndex,
    language: segments[0].language,
  }
}

/**
 * Gets overlapping segments from the end of the current chunk
 * to be included at the start of the next chunk
 *
 * @param segments - Array of segments from the current chunk
 * @param overlapTokenTarget - Target number of tokens for overlap
 * @returns Array of segments to overlap into next chunk
 */
export function getOverlappingSegments(
  segments: TranscriptSegment[],
  overlapTokenTarget: number
): TranscriptSegment[] {
  const overlapSegments: TranscriptSegment[] = []
  let tokenCount = 0

  // Work backwards from the end of the chunk
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i]
    const segmentTokens = estimateTokens(segment.text)

    if (tokenCount + segmentTokens > overlapTokenTarget) {
      break
    }

    overlapSegments.unshift(segment)
    tokenCount += segmentTokens
  }

  return overlapSegments
}

/**
 * Chunks transcript segments into larger chunks for improved search quality
 *
 * Algorithm:
 * 1. Iterate through segments, accumulating them into chunks
 * 2. When token count reaches target range, create a chunk
 * 3. Add overlap from the end of current chunk to start of next chunk
 * 4. Continue until all segments are processed
 *
 * @param segments - Array of transcript segments to chunk
 * @param userId - User ID who owns this video
 * @param videoId - YouTube video ID
 * @param videoTitle - Title of the video
 * @param config - Chunking configuration (optional, uses defaults if not provided)
 * @returns Array of chunked ProcessedTranscriptSegments
 */
export function chunkTranscriptSegments(
  segments: TranscriptSegment[],
  userId: string,
  videoId: string,
  videoTitle: string,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): ProcessedTranscriptSegment[] {
  // Handle edge cases
  if (!segments || segments.length === 0) {
    return []
  }

  // If single segment or very short video, return as a single chunk
  const totalTokens = segments.reduce((sum, seg) => sum + estimateTokens(seg.text), 0)
  if (segments.length === 1 || totalTokens <= config.minTokens) {
    return [createChunk(segments, 0, userId, videoId, videoTitle)]
  }

  const chunks: ProcessedTranscriptSegment[] = []
  let currentSegments: TranscriptSegment[] = []
  let currentTokenCount = 0
  const overlapTokenTarget = Math.floor(config.targetTokens * config.overlapPercentage)

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const segmentTokens = estimateTokens(segment.text)

    // Add segment to current chunk
    currentSegments.push(segment)
    currentTokenCount += segmentTokens

    // Check if we should finalize this chunk
    const shouldFinalize =
      currentTokenCount >= config.targetTokens ||
      i === segments.length - 1 || // Last segment
      (currentTokenCount >= config.minTokens && currentTokenCount + estimateTokens(segments[i + 1]?.text || '') > config.maxTokens)

    if (shouldFinalize) {
      // Create the chunk
      const chunk = createChunk(currentSegments, chunks.length, userId, videoId, videoTitle)
      chunks.push(chunk)

      // If not the last chunk, get overlap segments for next chunk
      if (i < segments.length - 1) {
        const overlapSegments = getOverlappingSegments(currentSegments, overlapTokenTarget)
        currentSegments = [...overlapSegments]
        currentTokenCount = overlapSegments.reduce((sum, seg) => sum + estimateTokens(seg.text), 0)
      } else {
        currentSegments = []
        currentTokenCount = 0
      }
    }
  }

  return chunks
}

/**
 * Calculates statistics about chunking results
 * Useful for monitoring chunk quality and debugging
 *
 * @param chunks - Array of chunked ProcessedTranscriptSegments
 * @returns Statistics about the chunks
 */
export function getChunkingStats(chunks: ProcessedTranscriptSegment[]): ChunkingStats {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgTokensPerChunk: 0,
      avgSegmentsPerChunk: 0,
      avgDurationPerChunk: 0,
      minTokensPerChunk: 0,
      maxTokensPerChunk: 0,
    }
  }

  const tokenCounts = chunks.map(chunk => estimateTokens(chunk.text))
  const segmentCounts = chunks.map(chunk => chunk.segmentCount || 1)
  const durations = chunks.map(chunk => chunk.duration)

  return {
    totalChunks: chunks.length,
    avgTokensPerChunk: tokenCounts.reduce((sum, count) => sum + count, 0) / chunks.length,
    avgSegmentsPerChunk: segmentCounts.reduce((sum, count) => sum + count, 0) / chunks.length,
    avgDurationPerChunk: durations.reduce((sum, dur) => sum + dur, 0) / chunks.length,
    minTokensPerChunk: Math.min(...tokenCounts),
    maxTokensPerChunk: Math.max(...tokenCounts),
  }
}

/**
 * Gets Level 2 chunking configuration based on video duration
 * 
 * Level 2 chunks are larger, thematic chunks (5-20 minutes) for broad overview queries.
 * Only videos longer than 15 minutes get Level 2 chunks to avoid redundancy.
 * 
 * @param durationSeconds - Video duration in seconds
 * @returns Level 2 chunk configuration or null if video is too short
 */
export function getLevel2ChunkConfig(durationSeconds: number): Level2ChunkConfig | null {
  // Skip Level 2 chunking for videos shorter than 15 minutes
  if (durationSeconds < 15 * 60) {
    return null
  }

  // Adaptive chunking based on video length
  if (durationSeconds <= 30 * 60) {
    // 15-30 min videos: 2-4 minute chunks
    return createLevel2ChunkConfig(120, 240, 180)
  } else if (durationSeconds <= 60 * 60) {
    // 30-60 min videos: 3-6 minute chunks
    return createLevel2ChunkConfig(180, 360, 270)
  } else if (durationSeconds <= 120 * 60) {
    // 60-120 min videos: 5-10 minute chunks
    return createLevel2ChunkConfig(300, 600, 450)
  } else {
    // 120+ min videos: 10-20 minute chunks
    return createLevel2ChunkConfig(600, 1200, 900)
  }
}

/**
 * Result of hierarchical chunking containing both levels
 */
export interface HierarchicalChunkingResult {
  /** Level 1 chunks: detailed 30-90 second chunks for precise retrieval */
  level1Chunks: ProcessedTranscriptSegment[]
  /** Level 2 chunks: thematic 5-20 minute chunks for broad overviews (only for videos > 15min) */
  level2Chunks: ProcessedTranscriptSegment[]
}

/**
 * Creates a Level 2 chunk from an array of Level 1 chunks
 */
function buildLevel2Chunk(
  level1Chunks: ProcessedTranscriptSegment[],
  chunkIndex: number,
  userId: string,
  videoId: string,
  videoTitle: string
): ProcessedTranscriptSegment {
  const combinedText = level1Chunks.map(c => c.text).join(' ')
  const start = level1Chunks[0].start
  const end = level1Chunks[level1Chunks.length - 1].end
  const duration = end - start

  return {
    text: combinedText,
    start,
    end,
    duration,
    userId,
    videoId,
    videoTitle,
    language: level1Chunks[0].language,
    segmentCount: level1Chunks.reduce((sum, c) => sum + (c.segmentCount || 1), 0),
    chunkIndex,
    chunkLevel: "2"
  }
}

/**
 * Creates Level 2 chunks by grouping Level 1 chunks based on duration targets
 * Uses the provided configuration to determine chunk size boundaries.
 * 
 * @param level1Chunks - Level 1 chunks to group into Level 2 chunks
 * @param config - Level 2 chunking configuration specifying duration ranges
 * @param userId - User ID who owns this video
 * @param videoId - YouTube video ID
 * @param videoTitle - Title of the video
 * @returns Array of Level 2 chunks
 */
function createLevel2Chunks(
  level1Chunks: ProcessedTranscriptSegment[],
  config: Level2ChunkConfig,
  userId: string,
  videoId: string,
  videoTitle: string
): ProcessedTranscriptSegment[] {
  if (level1Chunks.length === 0) {
    return []
  }

  const level2Chunks: ProcessedTranscriptSegment[] = []
  let currentChunks: ProcessedTranscriptSegment[] = []
  let currentDuration = 0

  for (let i = 0; i < level1Chunks.length; i++) {
    const chunk = level1Chunks[i]
    const nextChunk = level1Chunks[i + 1]
    
    // Extract boolean conditions for clarity
    const isLastChunk = i === level1Chunks.length - 1
    const wouldExceedMax = currentDuration + chunk.duration > config.maxChunkDuration
    const isAtTargetDuration = currentDuration >= config.targetChunkDuration
    const addingNextWouldExceedMax = isAtTargetDuration && 
      currentDuration + chunk.duration + (nextChunk?.duration || 0) > config.maxChunkDuration
    
    const shouldFinalizeBefore = isLastChunk || wouldExceedMax || addingNextWouldExceedMax

    if (shouldFinalizeBefore && currentChunks.length > 0) {
      // Finalize current Level 2 chunk
      const level2Chunk = buildLevel2Chunk(
        currentChunks,
        level2Chunks.length,
        userId,
        videoId,
        videoTitle
      )
      level2Chunks.push(level2Chunk)

      // Reset for next Level 2 chunk
      currentChunks = []
      currentDuration = 0
    }

    // Add current chunk
    currentChunks.push(chunk)
    currentDuration += chunk.duration
  }

  return level2Chunks
}

/**
 * Performs hierarchical chunking with two levels of granularity
 * 
 * This function implements a two-level chunking strategy:
 * - Level 1: Detailed chunks (30-90 seconds) for precise retrieval of specific facts and timestamps
 * - Level 2: Thematic chunks (5-20 minutes) for broad overview queries and general topics
 * 
 * Level 2 chunks are only created for videos longer than 15 minutes to avoid redundancy.
 * Level 2 chunks are created by grouping Level 1 chunks based on duration targets.
 * 
 * @param transcriptData - Raw transcript data from YouTube
 * @param userId - User ID who owns this video
 * @param videoId - YouTube video ID
 * @param videoTitle - Title of the video
 * @param videoDuration - Video duration in seconds
 * @param config - Optional chunking configuration (uses defaults if not provided)
 * @returns Hierarchical chunking result with both levels
 */
export function chunkHierarchically(
  transcriptData: TranscriptData,
  userId: string,
  videoId: string,
  videoTitle: string,
  videoDuration: number,
  config: ChunkingConfig = DEFAULT_CHUNKING_CONFIG
): HierarchicalChunkingResult {
  // Always create Level 1 chunks using existing function
  const level1Chunks = chunkTranscriptSegments(
    transcriptData.transcript,
    userId,
    videoId,
    videoTitle,
    config
  )

  // Set chunkLevel for Level 1 chunks
  level1Chunks.forEach(chunk => {
    chunk.chunkLevel = "1"
  })

  // Conditionally create Level 2 chunks if video duration qualifies
  const level2Config = getLevel2ChunkConfig(videoDuration)
  let level2Chunks: ProcessedTranscriptSegment[] = []

  if (level2Config) {
    level2Chunks = createLevel2Chunks(
      level1Chunks,
      level2Config,
      userId,
      videoId,
      videoTitle
    )
  }

  return {
    level1Chunks,
    level2Chunks
  }
}
