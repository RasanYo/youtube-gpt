import { detectYouTubeType, type YoutubeUrlInfo } from './detector'
import {
  type VideoMetadata,
  type ChannelMetadata,
  type YouTubeProcessResult,
} from './types'
import { createErrorResult, handleEdgeFunctionError } from './utils'
import { getCurrentUser } from '../supabase/auth'
import { supabase } from '../supabase/client'

/**
 * Process a YouTube URL and extract video ID
 * This function validates the URL and extracts the video ID for further processing
 */
export async function processYouTubeUrl(
  url: string,
): Promise<YouTubeProcessResult> {
  try {
    // Validate URL format
    if (!url || typeof url !== 'string') {
      return createErrorResult(
        'Invalid URL: URL must be a non-empty string',
        'invalid',
      )
    }

    // Detect YouTube URL type and extract ID
    const urlInfo: YoutubeUrlInfo = detectYouTubeType(url)

    if (urlInfo.type === 'unknown' || !urlInfo.id) {
      return createErrorResult(
        'Invalid YouTube URL: URL must be a valid YouTube video or channel URL',
        'invalid',
      )
    }

    // Get current authenticated user
    let user
    try {
      user = await getCurrentUser()
      if (!user) {
        return createErrorResult(
          'User must be authenticated to process YouTube URLs',
          'auth_required',
        )
      }
    } catch (authError) {
      console.error('Authentication error:', authError)
      return createErrorResult(
        'Authentication failed. Please sign in and try again.',
        'auth_error',
      )
    }

    // Call Supabase Edge function to create video record
    try {
      const { data, error } = await supabase.functions.invoke(
        'fetch-video-metadata',
        {
          body: {
            id: urlInfo.id,
            type: urlInfo.type,
            userId: user.id,
          },
        },
      )

      if (error) {
        console.error('Edge function error:', error)
        return createErrorResult(
          'Failed to queue video for processing. Please try again.',
          'processing_error',
        )
      }

      if (!data.success) {
        console.error('Edge function returned error:', data.error)
        return createErrorResult(
          data.error || 'Failed to queue video for processing.',
          'processing_error',
        )
      }
    } catch (edgeFunctionError) {
      console.error('Edge function call failed:', edgeFunctionError)
      return handleEdgeFunctionError(edgeFunctionError)
    }

    // Return success with basic info
    // Note: Full metadata will be fetched asynchronously by the edge function
    return {
      success: true,
      type: urlInfo.type === 'video' ? 'video' : 'channel',
      data: {
        id: urlInfo.id,
      } as VideoMetadata | ChannelMetadata,
    }
  } catch (error) {
    console.error('Error processing YouTube URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      type: 'invalid',
    }
  }
}

/**
 * Get video metadata from YouTube API
 * This is a placeholder for future implementation
 */
export async function getVideoMetadata(
  videoId: string,
): Promise<VideoMetadata | null> {
  // TODO: Implement YouTube API integration
  return null
}

/**
 * Get channel metadata from YouTube API
 * This is a placeholder for future implementation
 */
export async function getChannelMetadata(
  channelId: string,
): Promise<ChannelMetadata | null> {
  // TODO: Implement YouTube API integration
  return null
}
