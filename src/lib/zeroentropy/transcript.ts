import type { TranscriptData, TranscriptSegment, ProcessedTranscriptSegment } from './types'
import { chunkHierarchically, getChunkingStats, DEFAULT_CHUNKING_CONFIG, type ChunkingConfig } from './chunking'

/**
 * Process transcript segments for ZeroEntropy indexing using hierarchical chunking
 * Converts raw transcript segments into two levels of chunks for improved search quality:
 * - Level 1: Detailed chunks (30-90 seconds) for precise retrieval
 * - Level 2: Thematic chunks (5-20 minutes) for broad overviews (videos > 15min)
 *
 * @param transcriptData - Raw transcript data from YouTube
 * @param userId - User ID for scoping
 * @param videoId - Video ID
 * @param videoTitle - Video title
 * @param videoDuration - Video duration in seconds (optional, used for Level 2 chunking)
 * @param config - Optional chunking configuration
 * @returns Array of processed transcript chunks ready for ZeroEntropy indexing
 */
export function processTranscriptSegments(
  transcriptData: TranscriptData,
  userId: string,
  videoId: string,
  videoTitle: string,
  videoDuration?: number,
  config?: ChunkingConfig
): ProcessedTranscriptSegment[] {
  console.log(`[processTranscriptSegments] Processing ${transcriptData.transcript.length} segments`)

  // Validate and filter segments
  const validSegments: TranscriptSegment[] = []

  transcriptData.transcript.forEach((segment, index) => {
    // Basic validation for segment data integrity
    if (!segment.text || segment.text.trim().length === 0) {
      console.warn(`[processTranscriptSegments] Skipping empty segment at index ${index}`)
      return
    }

    if (segment.start < 0 || segment.duration <= 0) {
      console.warn(`[processTranscriptSegments] Skipping invalid segment at index ${index}: start=${segment.start}, duration=${segment.duration}`)
      return
    }

    // Add valid segment with trimmed text
    validSegments.push({
      ...segment,
      text: segment.text.trim(),
      language: segment.language || 'en'
    })
  })

  console.log(`[processTranscriptSegments] Validated ${validSegments.length} segments`)

  // Use hierarchical chunking (Level 1 and optionally Level 2)
  const result = chunkHierarchically(
    { transcript: validSegments, metadata: transcriptData.metadata },
    userId,
    videoId,
    videoTitle,
    videoDuration || transcriptData.metadata.totalDuration,
    config || DEFAULT_CHUNKING_CONFIG
  )

  // Combine Level 1 and Level 2 chunks
  const allChunks = [...result.level1Chunks, ...result.level2Chunks]

  // Log chunking statistics for both levels
  const level1Stats = getChunkingStats(result.level1Chunks)
  const level2Stats = getChunkingStats(result.level2Chunks)
  
  console.log(`[processTranscriptSegments] Created ${allChunks.length} chunks from ${validSegments.length} segments`)
  console.log(`[processTranscriptSegments] Level 1 chunks: ${result.level1Chunks.length} (detailed, 30-90s)`)
  console.log(`[processTranscriptSegments] Level 2 chunks: ${result.level2Chunks.length} (thematic, 5-20min, videos >15min)`)
  console.log(`[processTranscriptSegments] Level 1 stats: avg ${level1Stats.avgTokensPerChunk.toFixed(0)} tokens, avg ${level1Stats.avgDurationPerChunk.toFixed(1)}s`)
  if (result.level2Chunks.length > 0) {
    console.log(`[processTranscriptSegments] Level 2 stats: avg ${level2Stats.avgTokensPerChunk.toFixed(0)} tokens, avg ${level2Stats.avgDurationPerChunk.toFixed(1)}s`)
  }
  console.log(`[processTranscriptSegments] Document reduction: ${validSegments.length} → ${allChunks.length} (${((1 - allChunks.length/validSegments.length) * 100).toFixed(1)}% reduction)`)

  return allChunks
}

/**
 * Validate transcript quality and completeness
 * 
 * @param transcriptData - Raw transcript data from YouTube
 * @returns Object with validation results
 */
export function validateTranscriptQuality(transcriptData: TranscriptData): {
  isValid: boolean
  issues: string[]
  metrics: {
    totalSegments: number
    totalDuration: number
    totalTextLength: number
    averageSegmentLength: number
    emptySegments: number
  }
} {
  const issues: string[] = []
  const segments = transcriptData.transcript
  
  // Count empty segments
  const emptySegments = segments.filter(segment => !segment.text || segment.text.trim().length === 0).length
  
  // Calculate metrics
  const totalSegments = segments.length
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0)
  const totalTextLength = segments.reduce((sum, segment) => sum + segment.text.length, 0)
  const averageSegmentLength = totalSegments > 0 ? totalTextLength / totalSegments : 0
  
  // Validation checks
  if (totalSegments === 0) {
    issues.push('No transcript segments found')
  }
  
  if (totalTextLength < 50) {
    issues.push('Transcript too short - likely poor quality or auto-generated captions disabled')
  }
  
  if (totalDuration < 10) {
    issues.push('Video too short - minimum 10 seconds required')
  }
  
  if (emptySegments > totalSegments * 0.1) {
    issues.push(`Too many empty segments: ${emptySegments}/${totalSegments} (${Math.round(emptySegments/totalSegments*100)}%)`)
  }
  
  if (averageSegmentLength < 10) {
    issues.push(`Average segment length too short: ${averageSegmentLength.toFixed(1)} characters`)
  }
  
  const isValid = issues.length === 0
  
  console.log(`[validateTranscriptQuality] Validation result: ${isValid ? 'PASS' : 'FAIL'}`)
  if (issues.length > 0) {
    console.log(`[validateTranscriptQuality] Issues found: ${issues.join(', ')}`)
  }
  
  return {
    isValid,
    issues,
    metrics: {
      totalSegments,
      totalDuration,
      totalTextLength,
      averageSegmentLength,
      emptySegments
    }
  }
}

/**
 * Handle edge cases for transcript processing
 * 
 * @param segments - Array of processed transcript segments
 * @returns Array of segments with edge cases handled
 */
export function handleTranscriptEdgeCases(segments: ProcessedTranscriptSegment[]): ProcessedTranscriptSegment[] {
  console.log(`[handleTranscriptEdgeCases] Processing ${segments.length} segments for edge cases`)
  
  const handledSegments: ProcessedTranscriptSegment[] = []
  
  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index]
    
    // Handle very short segments by merging with adjacent segments
    if (segment.duration < 1 && index < segments.length - 1) {
      console.log(`[handleTranscriptEdgeCases] Merging short segment ${index} with next segment`)
      
      const nextSegment = segments[index + 1]
      const mergedSegment: ProcessedTranscriptSegment = {
        text: `${segment.text} ${nextSegment.text}`.trim(),
        start: segment.start,
        end: nextSegment.end,
        duration: nextSegment.end - segment.start,
        language: segment.language,
        segmentIndex: segment.segmentIndex,
        userId: segment.userId,
        videoId: segment.videoId,
        videoTitle: segment.videoTitle
      }
      
      handledSegments.push(mergedSegment)
      // Skip the next segment since we merged it
      index++
      continue
    }
    
    // Handle segments with missing timestamps
    if (segment.start < 0) {
      console.log(`[handleTranscriptEdgeCases] Fixing negative start time for segment ${index}`)
      segment.start = 0
      segment.end = segment.duration
    }
    
    handledSegments.push(segment)
  }
  
  console.log(`[handleTranscriptEdgeCases] Handled edge cases, final segment count: ${handledSegments.length}`)
  
  return handledSegments
}

/**
 * Get transcript processing metrics for logging and monitoring
 * 
 * @param segments - Array of processed transcript segments
 * @returns Processing metrics
 */
export function getTranscriptProcessingMetrics(segments: ProcessedTranscriptSegment[]): {
  totalSegments: number
  totalDuration: number
  totalTextLength: number
  averageSegmentLength: number
  averageSegmentDuration: number
  languageDistribution: Record<string, number>
} {
  const totalSegments = segments.length
  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0)
  const totalTextLength = segments.reduce((sum, segment) => sum + segment.text.length, 0)
  const averageSegmentLength = totalSegments > 0 ? totalTextLength / totalSegments : 0
  const averageSegmentDuration = totalSegments > 0 ? totalDuration / totalSegments : 0
  
  // Calculate language distribution
  const languageDistribution: Record<string, number> = {}
  segments.forEach(segment => {
    languageDistribution[segment.language] = (languageDistribution[segment.language] || 0) + 1
  })
  
  return {
    totalSegments,
    totalDuration,
    totalTextLength,
    averageSegmentLength,
    averageSegmentDuration,
    languageDistribution
  }
}
