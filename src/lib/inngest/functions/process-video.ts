import { inngest } from '@/lib/inngest/client'
import { supabase } from '@/lib/supabase/client'
import type { Video, VideoStatus } from '@/lib/supabase/types'
import type { TranscriptData, ProcessedTranscriptSegment } from '@/lib/zeroentropy/types'
import { 
  processTranscriptSegments,
  validateTranscriptQuality,
  handleTranscriptEdgeCases,
  getOrCreateUserCollection,
  batchIndexPages
} from '@/lib/zeroentropy'
import { 
  fetchTranscript, 
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptInvalidVideoIdError
} from 'youtube-transcript-plus'
import { TranscriptResponse } from 'youtube-transcript-plus/dist/types'

/**
 * Update video status in the database
 */
async function updateVideoStatus(video: Video, status: VideoStatus, errorMessage?: string): Promise<void> {
  console.log(`[updateVideoStatus] Updating status to ${status} for video: ${video.id}`)
  
  const updateData: {
    status: VideoStatus
    updatedAt: string
    error?: string
  } = {
    status,
    updatedAt: new Date().toISOString()
  }
  
  // Add error message if provided (for FAILED status)
  if (errorMessage) {
    updateData.error = errorMessage
  }
  
  const { error } = await supabase
    .from('videos')
    .update(updateData)
    .eq('id', video.id)
    .eq('userId', video.userId)
  
  if (error) {
    console.error(`[updateVideoStatus] Failed to update status to ${status}:`, error)
    throw new Error(`Failed to update video status: ${error.message}`)
  }
  
  console.log(`[updateVideoStatus] Successfully updated status to ${status} for video: ${video.id}`)
}

/**
 * Step 3: Extract transcript from YouTube video
 */
async function extractTranscript(video: Video): Promise<TranscriptData> {
  console.log(`[extractTranscript] Starting transcript extraction for video: ${video.id}`)
  console.log(`[extractTranscript] YouTube ID: ${video.youtubeId}`)
  
  try {
    const startTime = Date.now()
    
    // Extract transcript using youtube-transcript-plus
    const transcript = await fetchTranscript(video.youtubeId, {
      cacheTTL: 3600, // Cache for 1 hour
    }) as TranscriptResponse[]
    
    const processingTime = Date.now() - startTime
    console.log(`[extractTranscript] Transcript extraction completed in ${processingTime}ms for video: ${video.id}`)
    console.log(`[extractTranscript] Transcript segments count: ${transcript.length}`)
    
    // Validate transcript quality
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript data received from YouTube')
    }
    
    // Calculate total duration and text length
    const totalDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0)
    const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0)
    
    console.log(`[extractTranscript] Transcript validation - Duration: ${totalDuration}s, Text length: ${totalTextLength} chars`)
    
    // Check for minimum quality thresholds
    if (totalTextLength < 50) {
      throw new Error('Transcript too short - likely poor quality or auto-generated captions disabled')
    }
    
    if (totalDuration < 10) {
      throw new Error('Video too short - minimum 10 seconds required')
    }
    
    // Format transcript for storage
    const formattedTranscript = transcript.map(segment => ({
      text: segment.text.trim(),
      start: segment.offset,
      duration: segment.duration,
      language: segment.lang || 'en'
    }))
    
    console.log(`[extractTranscript] Transcript extraction successful for video: ${video.id}`)
    console.log(`[extractTranscript] Formatted transcript segments: ${formattedTranscript.length}`)
    
    return {
      transcript: formattedTranscript,
      metadata: {
        totalSegments: transcript.length,
        totalDuration,
        totalTextLength,
        language: transcript[0]?.lang || 'en',
        extractedAt: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    }
    
  } catch (error) {
    console.error(`[extractTranscript] Transcript extraction failed for video: ${video.id}`, error)
    
    // Handle specific error types with appropriate messages
    if (error instanceof YoutubeTranscriptDisabledError) {
      throw new Error('Transcript extraction failed: Captions are disabled for this video')
    } else if (error instanceof YoutubeTranscriptNotAvailableError) {
      throw new Error('Transcript extraction failed: No transcript available for this video')
    } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
      throw new Error('Transcript extraction failed: No transcript available in the requested language')
    } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new Error('Transcript extraction failed: Video is unavailable or private')
    } else if (error instanceof YoutubeTranscriptTooManyRequestError) {
      throw new Error('Transcript extraction failed: Too many requests - rate limited')
    } else if (error instanceof YoutubeTranscriptInvalidVideoIdError) {
      throw new Error('Transcript extraction failed: Invalid YouTube video ID')
    } else if (error instanceof Error) {
      throw new Error(`Transcript extraction failed: ${error.message}`)
    } else {
      throw new Error('Transcript extraction failed: Unknown error occurred')
    }
  }
}

/**
 * Step 5: Process transcript segments for ZeroEntropy
 */
async function processTranscriptSegmentsForZeroEntropy(
  transcriptData: TranscriptData, 
  video: Video
): Promise<ProcessedTranscriptSegment[]> {
  console.log(`[processTranscriptSegmentsForZeroEntropy] Processing ${transcriptData.transcript.length} transcript segments`)
  
  // Type assertion to ensure compatibility with ZeroEntropy functions
  const typedTranscriptData = transcriptData as TranscriptData
  
  // Process transcript segments with user and video context
  const segments = processTranscriptSegments(typedTranscriptData, video.userId, video.id)
  
  // Validate transcript quality
  const validation = validateTranscriptQuality(typedTranscriptData)
  if (!validation.isValid) {
    console.warn(`[processTranscriptSegmentsForZeroEntropy] Transcript quality issues: ${validation.issues.join(', ')}`)
  }
  
  // Handle edge cases
  const handledSegments = handleTranscriptEdgeCases(segments)
  
  console.log(`[processTranscriptSegmentsForZeroEntropy] Successfully processed ${handledSegments.length} segments`)
  return handledSegments
}

/**
 * Step 7: Index transcript pages in ZeroEntropy
 */
async function indexTranscriptPagesInZeroEntropy(
  processedSegments: ProcessedTranscriptSegment[],
  collectionName: string
): Promise<string[]> {
  console.log(`[indexTranscriptPagesInZeroEntropy] Indexing ${processedSegments.length} pages in collection: ${collectionName}`)
  // Type assertion to ensure compatibility
  const typedSegments = processedSegments as ProcessedTranscriptSegment[]
  return await batchIndexPages(typedSegments, collectionName)
}

/**
 * Step 7.5: Handle ZeroEntropy indexing failures
 */
async function handleZeroEntropyIndexingFailure(
  pageIds: string[],
  processedSegments: ProcessedTranscriptSegment[],
  video: Video
): Promise<void> {
  if (pageIds.length === 0) {
    console.error(`[handleZeroEntropyIndexingFailure] No pages were indexed successfully for video: ${video.id}`)
    await updateVideoStatus(video, 'FAILED', 'ZeroEntropy indexing failed - no pages indexed')
    throw new Error('ZeroEntropy indexing failed - no pages indexed')
  }
  
  if (pageIds.length < processedSegments.length) {
    console.warn(`[handleZeroEntropyIndexingFailure] Partial indexing success: ${pageIds.length}/${processedSegments.length} pages indexed`)
  }
  
  console.log(`[handleZeroEntropyIndexingFailure] ZeroEntropy indexing completed: ${pageIds.length} pages indexed`)
}



/**
 * Video Processing Job
 *
 * This Inngest function handles the processing of YouTube videos for transcript
 * extraction and vector embedding generation. It receives a Video object and
 * processes it through the complete pipeline from QUEUED to READY status.
 *
 * Event: video.transcript.processing.requested
 * 
 * @param event - Inngest event containing video data
 * @returns Promise<void>
 */
export const processVideo = inngest.createFunction(
  {
    id: 'process-video-transcript',
    name: 'Process Video Transcript',
    retries: 3,
    timeouts: {
      start: '10m',
    },
  },
  {
    event: 'video.transcript.processing.requested',
  },
  async ({ event, step }) => {
    const video = event.data.video as Video
    
    console.log(`[processVideo] Starting processing for video: ${video.id}`)
    console.log(`[processVideo] YouTube ID: ${video.youtubeId}`)
    console.log(`[processVideo] Title: ${video.title}`)
    console.log(`[processVideo] Current status: ${video.status}`)
    
    // Step 1: Update status from QUEUED to PROCESSING
    await step.run('update-status-to-processing', () => updateVideoStatus(video, 'PROCESSING'))
    
    // Step 2: Update status from PROCESSING to TRANSCRIPT_EXTRACTING
    await step.run('update-status-to-transcript-extracting', () => updateVideoStatus(video, 'TRANSCRIPT_EXTRACTING'))
    
    // Step 3: Extract transcript from YouTube video
    const transcriptData = await step.run('extract-transcript', () => extractTranscript(video))
    
    // Step 4: Update status to ZEROENTROPY_PROCESSING
    await step.run('update-status-to-zeroentropy-processing', () => updateVideoStatus(video, 'ZEROENTROPY_PROCESSING'))
    
    // Step 5: Process transcript segments for ZeroEntropy
    const processedSegments = await step.run('process-transcript-segments', () => 
      processTranscriptSegmentsForZeroEntropy(transcriptData as TranscriptData, video)
    )
    
    // Step 6: Ensure user collection exists
    const collectionName = await step.run('ensure-user-collection', () => getOrCreateUserCollection(video.userId))
    
    // Step 7: Index transcript pages in ZeroEntropy
    const pageIds = await step.run('index-transcript-pages', () => 
      indexTranscriptPagesInZeroEntropy(processedSegments as ProcessedTranscriptSegment[], collectionName)
    )
    
    // Step 7.5: Handle ZeroEntropy indexing failures
    await step.run('handle-zeroentropy-failure', () => 
      handleZeroEntropyIndexingFailure(pageIds, processedSegments as ProcessedTranscriptSegment[], video)
    )
    
    // Step 8: Update video with collection ID and status to READY
    await step.run('update-video-with-collection', async () => {
      console.log(`[processVideo] Updating video with collection ID: ${collectionName}`)
      
      const { error } = await supabase
        .from('videos')
        .update({
          zeroentropyCollectionId: collectionName,
          status: 'READY',
          updatedAt: new Date().toISOString()
        })
        .eq('id', video.id)
        .eq('user_id', video.userId)
      
      if (error) {
        console.error(`[processVideo] Failed to update video with collection ID:`, error)
        throw new Error(`Failed to update video: ${error.message}`)
      }
      
      console.log(`[processVideo] Successfully updated video with collection ID: ${collectionName}`)
    })
    
    console.log(`[processVideo] Processing completed successfully for video: ${video.id}`)
    console.log(`[processVideo] Video status: READY`)
    console.log(`[processVideo] Collection: ${collectionName}`)
    console.log(`[processVideo] Transcript segments: ${transcriptData.metadata.totalSegments}`)
    console.log(`[processVideo] Pages indexed: ${pageIds.length}`)
    console.log(`[processVideo] Total duration: ${transcriptData.metadata.totalDuration}s`)
    console.log(`[processVideo] Processing time: ${transcriptData.metadata.processingTimeMs}ms`)
  }
)
