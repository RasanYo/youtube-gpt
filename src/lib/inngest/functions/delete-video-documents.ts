import { inngest } from '@/lib/inngest/client'
import { supabase } from '@/lib/supabase/client'
import { deleteVideoPages } from '@/lib/zeroentropy'
import { createLogger } from '@/lib/inngest/utils/inngest-logger'

const logger = createLogger('deleteVideoDocuments')

/**
 * Delete video documents from ZeroEntropy collection
 *
 * This Inngest function handles the deletion of all documents associated
 * with a specific video from the user's ZeroEntropy collection. It's used
 * when a video is removed from the user's knowledge base.
 *
 * Event: video.documents.deletion.requested
 * 
 * @param event - Inngest event containing videoId and userId
 * @returns Promise<void>
 */
export const deleteVideoDocuments = inngest.createFunction(
  {
    id: 'delete-video-documents',
    name: 'Delete Video Documents from ZeroEntropy',
    retries: 3,
    timeouts: {
      start: '5m',
    },
  },
  {
    event: 'video.documents.deletion.requested',
  },
  async ({ event, step }) => {
    const { videoId, userId } = event.data
    
    logger.info(`Starting deletion for video: ${videoId}`, { userId })
    
    // Step 1: Get video information to verify ownership
    const video = await step.run('get-video-info', async () => {
      logger.info(`Fetching video information: ${videoId}`)
      
      const { data: videoData, error } = await supabase
        .from('videos')
        .select('id, userId, title, zeroentropyCollectionId')
        .eq('id', videoId)
        .eq('userId', userId)
        .single()
      
      if (error) {
        logger.error('Failed to fetch video', { error: error.message })
        throw new Error(`Failed to fetch video: ${error.message}`)
      }
      
      if (!videoData) {
        throw new Error(`Video not found or access denied: ${videoId}`)
      }
      
      logger.info(`Video found: ${videoData.title}`)
      return videoData
    })
    
    // Step 2: Verify collection exists
    const collectionName = await step.run('verify-collection', async () => {
      if (!video.zeroentropyCollectionId) {
        logger.info(`No collection ID found for video: ${videoId}`)
        return null
      }
      
      logger.info(`Collection ID: ${video.zeroentropyCollectionId}`)
      return video.zeroentropyCollectionId
    })
    
    // Step 3: Delete documents from ZeroEntropy (if collection exists)
    const deletedCount = await step.run('delete-documents', async () => {
      if (!collectionName) {
        logger.info(`No collection to delete from for video: ${videoId}`)
        return 0
      }
      
      logger.info(`Deleting documents from collection: ${collectionName}`)
      
      try {
        const count = await deleteVideoPages(videoId, collectionName)
        logger.info(`Successfully deleted ${count} documents for video: ${videoId}`)
        return count
      } catch (error) {
        logger.error('Failed to delete documents', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        throw new Error(`Failed to delete documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    })
    
    // Step 4: Delete video from Supabase
    await step.run('delete-video-from-db', async () => {
      logger.info(`Deleting video from database: ${videoId}`)
      
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)
        .eq('userId', userId)
      
      if (error) {
        logger.error('Failed to delete video from database', { error: error.message })
        throw new Error(`Failed to delete video from database: ${error.message}`)
      }
      
      logger.info(`Successfully deleted video from database: ${videoId}`)
    })
    
    logger.info(`Deletion completed successfully for video: ${videoId}`, {
      documentsDeleted: deletedCount,
      collection: collectionName || 'N/A'
    })
  }
)
