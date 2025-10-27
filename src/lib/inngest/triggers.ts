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

/**
 * Trigger video documents deletion
 *
 * Sends an event to Inngest to delete all documents associated with a video
 * from the user's ZeroEntropy collection. This function is called when a
 * video is removed from the user's knowledge base.
 *
 * @param videoId - The video ID to delete documents for
 * @param userId - The user ID who owns the video
 * @returns Promise<void>
 */
export async function triggerVideoDocumentsDeletion(
  videoId: string,
  userId: string
): Promise<void> {
  console.log(`[triggerVideoDocumentsDeletion] Triggering deletion for video: ${videoId}`)
  
  await inngest.send({
    name: 'video.documents.deletion.requested',
    data: {
      videoId,
      userId,
    },
  })
  
  console.log(`[triggerVideoDocumentsDeletion] Event sent for video: ${videoId}`)
}

/**
 * Trigger user collection deletion
 *
 * Sends an event to Inngest to delete a user's entire ZeroEntropy collection,
 * including all videos and documents. This function is called when a user
 * wants to completely clear their knowledge base or when deleting their account.
 *
 * @param userId - The user ID whose collection to delete
 * @returns Promise<void>
 */
export async function triggerUserCollectionDeletion(
  userId: string
): Promise<void> {
  console.log(`[triggerUserCollectionDeletion] Triggering collection deletion for user: ${userId}`)
  
  await inngest.send({
    name: 'user.collection.deletion.requested',
    data: {
      userId,
    },
  })
  
  console.log(`[triggerUserCollectionDeletion] Event sent for user: ${userId}`)
}
