import { supabase } from '@/lib/supabase/client'
import type { Video, VideoStatus } from '@/lib/supabase/types'
import { createLogger } from './inngest-logger'

const logger = createLogger('video-status')

/**
 * Update video status in the database
 * 
 * Updates the status of a video and optionally sets an error message.
 * This is used throughout the video processing pipeline to track progress.
 * 
 * @param video - The video to update
 * @param status - The new status to set
 * @param errorMessage - Optional error message (for FAILED status)
 * @throws Error if the update fails
 */
export async function updateVideoStatus(
  video: Video,
  status: VideoStatus,
  errorMessage?: string
): Promise<void> {
  logger.info(`Updating status to ${status} for video: ${video.id}`)

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
    logger.error(`Failed to update status to ${status}`, { error: error.message })
    throw new Error(`Failed to update video status: ${error.message}`)
  }

  logger.info(`Successfully updated status to ${status} for video: ${video.id}`)
}

