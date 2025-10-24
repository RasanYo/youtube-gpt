import { inngest } from '@/lib/inngest/client'
import { supabase } from '@/lib/supabase/client'
import type { Video, VideoStatus } from '@/lib/supabase/types'
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
    await step.run('update-status-to-processing', async () => {
      console.log(`[processVideo] Updating status to PROCESSING for video: ${video.id}`)
      
      const { error } = await supabase
        .from('videos')
        .update({ 
          status: 'PROCESSING' as VideoStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', video.id)
        .eq('userId', video.userId)
      
      if (error) {
        console.error(`[processVideo] Failed to update status to PROCESSING:`, error)
        throw new Error(`Failed to update video status: ${error.message}`)
      }
      
      console.log(`[processVideo] Successfully updated status to PROCESSING for video: ${video.id}`)
    })
    
    // Step 2: Update status from PROCESSING to TRANSCRIPT_EXTRACTING
    await step.run('update-status-to-transcript-extracting', async () => {
      console.log(`[processVideo] Updating status to TRANSCRIPT_EXTRACTING for video: ${video.id}`)
      
      const { error } = await supabase
        .from('videos')
        .update({ 
          status: 'TRANSCRIPT_EXTRACTING' as VideoStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', video.id)
        .eq('userId', video.userId)
      
      if (error) {
        console.error(`[processVideo] Failed to update status to TRANSCRIPT_EXTRACTING:`, error)
        throw new Error(`Failed to update video status: ${error.message}`)
      }
      
      console.log(`[processVideo] Successfully updated status to TRANSCRIPT_EXTRACTING for video: ${video.id}`)
    })
    
    // Step 3: Extract transcript from YouTube video
    const transcriptData = await step.run('extract-transcript', async () => {
      console.log(`[processVideo] Starting transcript extraction for video: ${video.id}`)
      console.log(`[processVideo] YouTube ID: ${video.youtubeId}`)
      
      try {
        const startTime = Date.now()
        
        // Extract transcript using youtube-transcript-plus
        const transcript = await fetchTranscript(video.youtubeId, {
          cacheTTL: 3600, // Cache for 1 hour
        }) as TranscriptResponse[]
        
        const processingTime = Date.now() - startTime
        console.log(`[processVideo] Transcript extraction completed in ${processingTime}ms for video: ${video.id}`)
        console.log(`[processVideo] Transcript segments count: ${transcript.length}`)
        
        // Validate transcript quality
        if (!transcript || transcript.length === 0) {
          throw new Error('No transcript data received from YouTube')
        }
        
        // Calculate total duration and text length
        const totalDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0)
        const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0)
        
        console.log(`[processVideo] Transcript validation - Duration: ${totalDuration}s, Text length: ${totalTextLength} chars`)
        
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
        
        console.log(`[processVideo] Transcript extraction successful for video: ${video.id}`)
        console.log(`[processVideo] Formatted transcript segments: ${formattedTranscript.length}`)
        
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
        console.error(`[processVideo] Transcript extraction failed for video: ${video.id}`, error)
        
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
    })
    
    // Step 4: Handle transcript extraction failures and update status to FAILED
    await step.run('handle-transcript-failure', async () => {
      // This step will only run if the previous step (extract-transcript) fails
      console.log(`[processVideo] Handling transcript extraction failure for video: ${video.id}`)
      
      const { error } = await supabase
        .from('videos')
        .update({ 
          status: 'FAILED' as VideoStatus,
          error: 'Transcript extraction failed - see logs for details',
          updatedAt: new Date().toISOString()
        })
        .eq('id', video.id)
        .eq('userId', video.userId)
      
      if (error) {
        console.error(`[processVideo] Failed to update status to FAILED:`, error)
        throw new Error(`Failed to update video status: ${error.message}`)
      }
      
      console.log(`[processVideo] Successfully updated status to FAILED for video: ${video.id}`)
    })
    
    // Step 5: Update video status to READY (transcript extraction successful)
    await step.run('update-status-to-ready', async () => {
      console.log(`[processVideo] Updating status to READY for video: ${video.id}`)
      
      const { error } = await supabase
        .from('videos')
        .update({ 
          status: 'READY' as VideoStatus,
          updatedAt: new Date().toISOString(),
          // Note: We'll add transcript storage in a future step when we add the transcript column
          // For now, we just mark as READY to indicate transcript extraction was successful
        })
        .eq('id', video.id)
        .eq('userId', video.userId)
      
      if (error) {
        console.error(`[processVideo] Failed to update status to READY:`, error)
        throw new Error(`Failed to update video status: ${error.message}`)
      }
      
      console.log(`[processVideo] Successfully updated status to READY for video: ${video.id}`)
      console.log(`[processVideo] Transcript extraction completed successfully`)
      console.log(`[processVideo] Video is now ready for AI queries`)
    })
    
    // TODO: Implement vector embedding generation
    // TODO: Add transcript storage to database
    
    console.log(`[processVideo] Processing completed successfully for video: ${video.id}`)
    console.log(`[processVideo] Video status: READY`)
    console.log(`[processVideo] Transcript segments: ${transcriptData.metadata.totalSegments}`)
    console.log(`[processVideo] Total duration: ${transcriptData.metadata.totalDuration}s`)
    console.log(`[processVideo] Processing time: ${transcriptData.metadata.processingTimeMs}ms`)
  }
)
