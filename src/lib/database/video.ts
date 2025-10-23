import { PrismaClient, VideoStatus } from '@prisma/client'

const prisma = new PrismaClient()

export interface CreateQueuedVideoResult {
  success: boolean
  videoId?: string
  error?: string
}

/**
 * Create a queued video record in the database
 * 
 * This function creates a minimal video record with placeholder values
 * for required fields that will be populated later during full ingestion.
 * 
 * @param youtubeId - The YouTube video ID extracted from URL
 * @param userId - The authenticated user's ID
 * @returns Promise with success/error result
 */
export async function createQueuedVideo(
  youtubeId: string,
  userId: string
): Promise<CreateQueuedVideoResult> {
  try {
    // Validate inputs
    if (!youtubeId || typeof youtubeId !== 'string') {
      return {
        success: false,
        error: 'Invalid youtubeId: must be a non-empty string'
      }
    }

    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        error: 'Invalid userId: must be a non-empty string'
      }
    }

    // Validate YouTube ID format (basic validation)
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      return {
        success: false,
        error: 'Invalid YouTube ID format'
      }
    }

    // Create video record with placeholder values
    const video = await prisma.video.create({
      data: {
        youtubeId,
        userId,
        title: 'Processing...', // Placeholder title
        channelName: 'Unknown', // Placeholder channel name
        duration: 0, // Placeholder duration
        status: VideoStatus.QUEUED
      }
    })

    return {
      success: true,
      videoId: video.id
    }

  } catch (error) {
    console.error('Error creating queued video:', error)

    // Handle duplicate youtubeId error
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return {
        success: false,
        error: 'This video has already been added to your knowledge base'
      }
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes('connect')) {
      return {
        success: false,
        error: 'Database connection failed'
      }
    }

    // Generic error handling
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
