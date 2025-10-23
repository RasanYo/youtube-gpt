import { detectYouTubeType, type YoutubeUrlInfo } from './detector'
import { type VideoMetadata, type ChannelMetadata, type YouTubeProcessResult } from './types'

/**
 * Process a YouTube URL and extract video ID
 * This function validates the URL and extracts the video ID for further processing
 */
export async function processYouTubeUrl(url: string): Promise<YouTubeProcessResult> {
  try {
    // Validate URL format
    if (!url || typeof url !== 'string') {
      return {
        success: false,
        error: 'Invalid URL: URL must be a non-empty string',
        type: 'invalid'
      }
    }

    // Detect YouTube URL type and extract ID
    const urlInfo: YoutubeUrlInfo = detectYouTubeType(url)
    
    if (urlInfo.type === 'unknown' || !urlInfo.id) {
      return {
        success: false,
        error: 'Invalid YouTube URL: URL must be a valid YouTube video or channel URL',
        type: 'invalid'
      }
    }

    // For now, we'll just log the URL and ID as specified in the task
    console.log('YouTube URL received:', url)
    console.log('Extracted ID:', urlInfo.id)
    console.log('URL type:', urlInfo.type)

    // Return success with basic info
    return {
      success: true,
      data: {
        id: urlInfo.id,
        type: urlInfo.type
      } as unknown as VideoMetadata | ChannelMetadata, // We'll improve this when we add full metadata fetching
      type: urlInfo.type === 'video' ? 'video' : 'channel'
    }

  } catch (error) {
    console.error('Error processing YouTube URL:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      type: 'invalid'
    }
  }
}

/**
 * Get video metadata from YouTube API
 * This is a placeholder for future implementation
 */
export async function getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  // TODO: Implement YouTube API integration
  console.log('Getting video metadata for ID:', videoId)
  return null
}

/**
 * Get channel metadata from YouTube API
 * This is a placeholder for future implementation
 */
export async function getChannelMetadata(channelId: string): Promise<ChannelMetadata | null> {
  // TODO: Implement YouTube API integration
  console.log('Getting channel metadata for ID:', channelId)
  return null
}
