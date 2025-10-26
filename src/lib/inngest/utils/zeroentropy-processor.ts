import type { Video } from '@/lib/supabase/types'
import type { TranscriptData, ProcessedTranscriptSegment } from '@/lib/zeroentropy/types'
import {
  processTranscriptSegments,
  validateTranscriptQuality,
  handleTranscriptEdgeCases,
  batchIndexPages
} from '@/lib/zeroentropy'
import { createLogger } from './inngest-logger'
import { updateVideoStatus } from './video-status'

const logger = createLogger('zeroentropy-processor')

/**
 * Process transcript segments for ZeroEntropy indexing
 * 
 * Transforms raw transcript data into processed segments suitable for vector indexing.
 * Validates transcript quality and handles edge cases.
 * 
 * @param transcriptData - The raw transcript data to process
 * @param video - The video the transcript belongs to
 * @returns Promise resolving to processed transcript segments
 */
export async function processTranscriptSegmentsForZeroEntropy(
  transcriptData: TranscriptData,
  video: Video
): Promise<ProcessedTranscriptSegment[]> {
  logger.info(`Processing ${transcriptData.transcript.length} transcript segments`)

  // Process transcript segments with user and video context
  const segments = processTranscriptSegments(
    transcriptData,
    video.userId,
    video.id,
    video.title
  )

  // Validate transcript quality
  const validation = validateTranscriptQuality(transcriptData)
  if (!validation.isValid) {
    logger.warn(`Transcript quality issues: ${validation.issues.join(', ')}`)
  }

  // Handle edge cases
  const handledSegments = handleTranscriptEdgeCases(segments)

  logger.info(`Successfully processed ${handledSegments.length} segments`)
  return handledSegments
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

