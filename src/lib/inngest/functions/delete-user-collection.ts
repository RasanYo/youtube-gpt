import { inngest } from '@/lib/inngest/client'
import { supabase } from '@/lib/supabase/client'
import { deleteUserCollection } from '@/lib/zeroentropy'

/**
 * Delete complete user collection from ZeroEntropy
 *
 * This Inngest function handles the deletion of a user's entire ZeroEntropy
 * collection, including all videos and documents. It's used when a user
 * wants to completely clear their knowledge base or when deleting their account.
 *
 * Event: user.collection.deletion.requested
 * 
 * @param event - Inngest event containing userId
 * @returns Promise<void>
 */
export const deleteUserCollectionFunction = inngest.createFunction(
  {
    id: 'delete-user-collection',
    name: 'Delete User Collection from ZeroEntropy',
    retries: 3,
    timeouts: {
      start: '5m',
    },
  },
  {
    event: 'user.collection.deletion.requested',
  },
  async ({ event, step }) => {
    const { userId } = event.data
    
    console.log(`[deleteUserCollectionFunction] Starting collection deletion for user: ${userId}`)
    
    // Step 1: Get user's videos to verify ownership and get collection info
    const userVideos = await step.run('get-user-videos', async () => {
      console.log(`[deleteUserCollectionFunction] Fetching user videos: ${userId}`)
      
      const { data: videos, error } = await supabase
        .from('videos')
        .select('id, title, zeroentropyCollectionId')
        .eq('userId', userId)
      
      if (error) {
        console.error(`[deleteUserCollectionFunction] Failed to fetch user videos:`, error)
        throw new Error(`Failed to fetch user videos: ${error.message}`)
      }
      
      console.log(`[deleteUserCollectionFunction] Found ${videos?.length || 0} videos for user: ${userId}`)
      return videos || []
    })
    
    // Step 2: Get unique collection IDs
    const collectionIds = await step.run('get-collection-ids', async () => {
      const uniqueCollections = new Set(
        userVideos
          .map(video => video.zeroentropyCollectionId)
          .filter(Boolean)
      )
      
      const collectionList = Array.from(uniqueCollections)
      console.log(`[deleteUserCollectionFunction] Found ${collectionList.length} unique collections:`, collectionList)
      
      return collectionList
    })
    
    // Step 3: Delete the main user collection from ZeroEntropy
    const collectionDeleted = await step.run('delete-zeroentropy-collection', async () => {
      console.log(`[deleteUserCollectionFunction] Deleting ZeroEntropy collection for user: ${userId}`)
      
      try {
        const success = await deleteUserCollection(userId)
        console.log(`[deleteUserCollectionFunction] ZeroEntropy collection deletion result: ${success}`)
        return success
      } catch (error) {
        console.error(`[deleteUserCollectionFunction] Failed to delete ZeroEntropy collection:`, error)
        throw new Error(`Failed to delete ZeroEntropy collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    })
    
    // Step 4: Delete all user videos from Supabase
    const deletedVideos = await step.run('delete-user-videos', async () => {
      if (userVideos.length === 0) {
        console.log(`[deleteUserCollectionFunction] No videos to delete for user: ${userId}`)
        return 0
      }
      
      console.log(`[deleteUserCollectionFunction] Deleting ${userVideos.length} videos for user: ${userId}`)
      
      const { error, count } = await supabase
        .from('videos')
        .delete()
        .eq('userId', userId)
      
      if (error) {
        console.error(`[deleteUserCollectionFunction] Failed to delete user videos:`, error)
        throw new Error(`Failed to delete user videos: ${error.message}`)
      }
      
      console.log(`[deleteUserCollectionFunction] Successfully deleted ${count || 0} videos for user: ${userId}`)
      return count || 0
    })
    
    // Step 5: Log completion
    await step.run('log-completion', async () => {
      console.log(`[deleteUserCollectionFunction] Collection deletion completed for user: ${userId}`)
      console.log(`[deleteUserCollectionFunction] Videos deleted: ${deletedVideos}`)
      console.log(`[deleteUserCollectionFunction] Collections processed: ${collectionIds.length}`)
      console.log(`[deleteUserCollectionFunction] ZeroEntropy collection deleted: ${collectionDeleted}`)
    })
    
    console.log(`[deleteUserCollectionFunction] Collection deletion completed successfully for user: ${userId}`)
    console.log(`[deleteUserCollectionFunction] Videos deleted: ${deletedVideos}`)
    console.log(`[deleteUserCollectionFunction] ZeroEntropy collection deleted: ${collectionDeleted}`)
  }
)
