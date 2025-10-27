import { inngest } from '@/lib/inngest/client'
import { supabase } from '@/lib/supabase/client'
import type { Video } from '@/lib/supabase/types'
import type { TranscriptData, ProcessedTranscriptSegment } from '@/lib/zeroentropy/types'
import { getOrCreateUserCollection } from '@/lib/zeroentropy'
import { createLogger } from '@/lib/inngest/utils/inngest-logger'
import { updateVideoStatus } from '@/lib/inngest/utils/video-status'
import { extractTranscriptWithRetry } from '@/lib/inngest/utils/transcript-extractor'
import {
  processTranscriptSegmentsForZeroEntropy,
  indexTranscriptPagesInZeroEntropy,
  handleZeroEntropyIndexingFailure
} from '@/lib/inngest/utils/zeroentropy-processor'
import { langfuse, isLangfuseConfigured } from '@/lib/langfuse/client'

const logger = createLogger('processVideo')

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
    
    logger.info(`Starting processing for video: ${video.id}`, {
      youtubeId: video.youtubeId,
      title: video.title,
      status: video.status
    })

    // Create Langfuse trace for background job
    let trace: ReturnType<typeof langfuse.trace> | null = null
    const processingMetadata: {
      transcriptSegments?: number
      pagesIndexed?: number
      totalDuration?: string
      processingTime?: string
    } = {}

    if (isLangfuseConfigured()) {
      try {
        trace = langfuse.trace({
          name: 'video-processing',
          userId: video.userId,
          metadata: {
            videoId: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            status: video.status,
            channelName: video.channelName,
          },
        })
      } catch (error) {
        console.error('Failed to create Langfuse trace for video processing:', error)
      }
    }
    
    // Step 1: Update status from QUEUED to PROCESSING
    await step.run('update-status-to-processing', () => updateVideoStatus(video, 'PROCESSING'))
    
    // Step 2: Update status from PROCESSING to TRANSCRIPT_EXTRACTING
    await step.run('update-status-to-transcript-extracting', () => updateVideoStatus(video, 'TRANSCRIPT_EXTRACTING'))
    
    // Step 3: Extract transcript from YouTube video with retry logic
    const transcriptData = await step.run('extract-transcript', async () => {
      const startTime = Date.now()
      const data = await extractTranscriptWithRetry(video)
      
      // Add span for transcript extraction
      if (trace) {
        try {
          trace.span({
            name: 'extract-transcript',
            metadata: {
              segmentCount: data.metadata.totalSegments,
              duration: data.metadata.totalDuration,
              processingTime: data.metadata.processingTimeMs,
            },
          })
        } catch (error) {
          console.error('Failed to trace extract-transcript:', error)
        }
      }
      
      return data
    })
    
    // Step 4: Update status to ZEROENTROPY_PROCESSING
    await step.run('update-status-to-zeroentropy-processing', () => updateVideoStatus(video, 'ZEROENTROPY_PROCESSING'))
    
    // Step 5: Process transcript segments for ZeroEntropy
    const processedSegments = await step.run('process-transcript-segments', async () => {
      const data = await processTranscriptSegmentsForZeroEntropy(transcriptData as TranscriptData, video)
      
      // Update metadata for later
      processingMetadata.transcriptSegments = data.length
      
      return data
    })
    
    // Step 6: Ensure user collection exists
    const collectionName = await step.run('ensure-user-collection', () => getOrCreateUserCollection(video.userId))
    
    // Step 7: Index transcript pages in ZeroEntropy
    const pageIds = await step.run('index-transcript-pages', async () => {
      const data = await indexTranscriptPagesInZeroEntropy(
        processedSegments as ProcessedTranscriptSegment[], 
        collectionName
      )
      
      // Update metadata
      processingMetadata.pagesIndexed = data.length
      
      // Add span for indexing
      if (trace) {
        try {
          trace.span({
            name: 'index-transcript-pages',
            metadata: {
              pageCount: data.length,
              collectionName,
            },
          })
        } catch (error) {
          console.error('Failed to trace index-transcript-pages:', error)
        }
      }
      
      return data
    })
    
    // Step 7.5: Handle ZeroEntropy indexing failures
    await step.run('handle-zeroentropy-failure', () => 
      handleZeroEntropyIndexingFailure(pageIds, processedSegments as ProcessedTranscriptSegment[], video)
    )
    
    // Step 8: Update video with collection ID and status to READY
    await step.run('update-video-with-collection', async () => {
      logger.info(`Updating video with collection ID: ${collectionName}`)
      
      const { error } = await supabase
        .from('videos')
        .update({
          zeroentropyCollectionId: collectionName,
          status: 'READY',
          updatedAt: new Date().toISOString()
        })
        .eq('id', video.id)
        .eq('userId', video.userId)
      
      if (error) {
        logger.error('Failed to update video with collection ID', { error: error.message })
        throw new Error(`Failed to update video: ${error.message}`)
      }
      
      logger.info(`Successfully updated video with collection ID: ${collectionName}`)
    })
    
    // Update metadata with final results
    processingMetadata.transcriptSegments = transcriptData.metadata.totalSegments
    processingMetadata.pagesIndexed = pageIds.length
    processingMetadata.totalDuration = `${transcriptData.metadata.totalDuration}s`
    processingMetadata.processingTime = `${transcriptData.metadata.processingTimeMs}ms`

    logger.info(`Processing completed successfully for video: ${video.id}`, {
      status: 'READY',
      collection: collectionName,
      transcriptSegments: transcriptData.metadata.totalSegments,
      pagesIndexed: pageIds.length,
      totalDuration: `${transcriptData.metadata.totalDuration}s`,
      processingTime: `${transcriptData.metadata.processingTimeMs}ms`
    })

    // Update trace with final metadata and flush
    if (trace) {
      try {
        trace.update({
          metadata: {
            ...processingMetadata,
            finalStatus: 'READY',
            collection: collectionName,
          },
        })

        // Flush trace to Langfuse
        if (typeof langfuse.flushAsync === 'function') {
          await langfuse.flushAsync()
        }
      } catch (error) {
        console.error('Failed to update/flush Langfuse trace:', error)
      }
    }
  }
)
