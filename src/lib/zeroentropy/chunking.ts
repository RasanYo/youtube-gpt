/**
 * Transcript chunking utilities for ZeroEntropy indexing
 *
 * This module provides functionality to intelligently chunk transcript segments
 * into larger, semantically coherent chunks for improved search quality.
 * Target: 500-800 tokens per chunk with 10% overlap between chunks.
 */

import { TranscriptSegment, ProcessedTranscriptSegment } from './types'

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
