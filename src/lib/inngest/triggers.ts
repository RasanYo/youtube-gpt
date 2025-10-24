import { inngest } from './client'
import type { Video } from '@/lib/supabase/types'

/**
 * Inngest Event Triggers
 *
 * This module contains functions to trigger Inngest events for the video
 * processing pipeline. These functions are used by webhooks, API endpoints,
 * and other parts of the application to initiate background jobs.
 */

/**
 * Trigger video processing
 *
 * Sends an event to Inngest to process a video's transcript and generate
 * vector embeddings. This function is called when a video's status changes
 * to 'QUEUED' after metadata has been successfully fetched.
 *
 * @param video - The video object to process
 * @returns Promise<void>
 */
export async function triggerVideoProcessing(
  video: Video
): Promise<void> {
  console.log(`[triggerVideoProcessing] Triggering processing for video: ${video.id}`)
  
  await inngest.send({
    name: 'video.transcript.processing.requested',
    data: {
      video,
    },
  })
  
  console.log(`[triggerVideoProcessing] Event sent for video: ${video.id}`)
}
