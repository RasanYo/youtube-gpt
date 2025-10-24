import { inngest } from '@/lib/inngest/client'
import { supabase } from '@/lib/supabase/client'
import type { Video, VideoStatus } from '@/lib/supabase/types'

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
    
    // TODO: Implement transcript extraction
    // TODO: Implement vector embedding generation
    // TODO: Update video status to READY or FAILED
    
    console.log(`[processVideo] Processing completed for video: ${video.id}`)
  }
)
