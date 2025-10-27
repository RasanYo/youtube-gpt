import type { Video } from '@/lib/supabase/types'
import type { TranscriptData, ProcessedTranscriptSegment } from '@/lib/zeroentropy/types'
import {
  processTranscriptSegments,
  validateTranscriptQuality,
  handleTranscriptEdgeCases,
  batchIndexPages,
  getChunkingStats
} from '@/lib/zeroentropy'
import { createLogger } from './inngest-logger'
import { updateVideoStatus } from './video-status'

const logger = createLogger('zeroentropy-processor')

/**
 * Process transcript segments for ZeroEntropy indexing
 *
 * Transforms raw transcript data into chunked segments suitable for vector indexing.
 * Validates transcript quality and handles edge cases.
 *
 * @param transcriptData - The raw transcript data to process
 * @param video - The video the transcript belongs to
 * @returns Promise resolving to processed transcript chunks
 */
export async function processTranscriptSegmentsForZeroEntropy(
  transcriptData: TranscriptData,
  video: Video
): Promise<ProcessedTranscriptSegment[]> {
  logger.info(`Processing ${transcriptData.transcript.length} transcript segments`)

  // Validate transcript quality before processing
  const validation = validateTranscriptQuality(transcriptData)
  if (!validation.isValid) {
    logger.warn(`Transcript quality issues: ${validation.issues.join(', ')}`)
  }

  // Process transcript segments with user and video context (now returns chunks)
  const chunks = processTranscriptSegments(
    transcriptData,
    video.userId,
    video.id,
    video.title
  )

  // Log chunk statistics for monitoring
  const stats = getChunkingStats(chunks)
  logger.info(`Chunking completed: ${chunks.length} chunks created from ${transcriptData.transcript.length} segments`)
  logger.info(`Chunk statistics: avg ${stats.avgTokensPerChunk.toFixed(0)} tokens/chunk, avg ${stats.avgSegmentsPerChunk.toFixed(1)} segments/chunk, range ${stats.minTokensPerChunk}-${stats.maxTokensPerChunk} tokens`)
  logger.info(`Document reduction: ${((1 - chunks.length/transcriptData.transcript.length) * 100).toFixed(1)}% (${transcriptData.transcript.length} → ${chunks.length} documents)`)

  // Handle edge cases (now on chunks instead of segments)
  const handledChunks = handleTranscriptEdgeCases(chunks)

  logger.info(`Successfully processed ${handledChunks.length} chunks`)
  return handledChunks
}

/**
 * Index transcript pages in ZeroEntropy collection
 * 
 * Batch indexes processed transcript segments into the specified ZeroEntropy collection.
 * 
 * @param processedSegments - The processed segments to index
 * @param collectionName - The name of the ZeroEntropy collection
 * @returns Promise resolving to array of indexed page IDs
 */
export async function indexTranscriptPagesInZeroEntropy(
  processedSegments: ProcessedTranscriptSegment[],
  collectionName: string
): Promise<string[]> {
  logger.info(`Indexing ${processedSegments.length} pages in collection: ${collectionName}`)
  return await batchIndexPages(processedSegments, collectionName)
}

/**
 * Handle ZeroEntropy indexing failures
 * 
 * Validates indexing results and handles partial or complete failures.
 * Updates video status to FAILED if no pages were indexed.
 * 
 * @param pageIds - Array of successfully indexed page IDs
 * @param processedSegments - The segments that were attempted to be indexed
 * @param video - The video being processed
 * @throws Error if no pages were successfully indexed
 */
export async function handleZeroEntropyIndexingFailure(
  pageIds: string[],
  processedSegments: ProcessedTranscriptSegment[],
  video: Video
): Promise<void> {
  if (pageIds.length === 0) {
    logger.error(`No pages were indexed successfully for video: ${video.id}`)
    await updateVideoStatus(video, 'FAILED', 'ZeroEntropy indexing failed - no pages indexed')
    throw new Error('ZeroEntropy indexing failed - no pages indexed')
  }

  if (pageIds.length < processedSegments.length) {
    logger.warn(`Partial indexing success: ${pageIds.length}/${processedSegments.length} pages indexed`)
  }

  logger.info(`ZeroEntropy indexing completed: ${pageIds.length} pages indexed`)
}

