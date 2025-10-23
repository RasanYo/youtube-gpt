import { inngest } from '../client'
import { createQueuedVideo } from '../../database/video'

export interface VideoProcessingEvent {
  type: 'video' | 'channel'
  id: string
  userId: string
}

/**
 * Inngest function for processing YouTube video database entries
 * 
 * This function handles the background processing of video database entry creation.
 * For video types, it creates a queued video record. For channel types, it logs
 * and ignores the request as specified in the requirements.
 * 
 * @param event - The Inngest event containing type, id, and userId
 * @returns Promise with processing result
 */
export const processYouTubeVideo = inngest.createFunction(
  { id: 'process-youtube-video' },
  { event: 'youtube.process' },
  async ({ event }) => {
    const { type, id, userId } = event.data as VideoProcessingEvent

    try {
      // Validate event data
      if (!type || !id || !userId) {
        console.error('Invalid event data:', event.data)
        return {
          success: false,
          error: 'Missing required event data',
          message: 'Invalid processing request'
        }
      }

      if (type !== 'video' && type !== 'channel') {
        console.error('Invalid type:', type)
        return {
          success: false,
          error: `Invalid type: ${type}`,
          message: 'Invalid video type'
        }
      }

      console.log(`Processing YouTube ${type} with ID: ${id} for user: ${userId}`)

      // Handle video type
      if (type === 'video') {
        const result = await createQueuedVideo(id, userId)
        
        if (result.success) {
          console.log(`Successfully created queued video record: ${result.videoId}`)
          return {
            success: true,
            videoId: result.videoId,
            message: 'Video queued for processing'
          }
        } else {
          console.error(`Failed to create video record: ${result.error}`)
          return {
            success: false,
            error: result.error,
            message: 'Failed to queue video for processing'
          }
        }
      }

      // Handle channel type - ignore for now as specified
      if (type === 'channel') {
        console.log(`Channel processing not implemented yet, ignoring channel ID: ${id}`)
        return {
          success: true,
          message: 'Channel processing ignored (not implemented)'
        }
      }

      // Handle unknown type
      console.error(`Unknown type received: ${type}`)
      return {
        success: false,
        error: `Unknown type: ${type}`,
        message: 'Invalid video type'
      }

    } catch (error) {
      console.error('Error in video processing function:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        message: 'Video processing failed'
      }
    }
  }
)
