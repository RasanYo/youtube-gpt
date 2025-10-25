// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { Database } from '../../../src/lib/database/types'
import { youtube_v3, google } from 'googleapis'
import { Inngest } from 'jsr:@inngest/sdk'


interface VideoQueueRequest {
  id: string
  type: 'video' | 'channel'
  userId: string
}

function requestHasAllRequiredFields(requestData: VideoQueueRequest): boolean {
  return requestData.id && requestData.type && requestData.userId;
}

function requestHasValidYouTubeVideoId(requestData: VideoQueueRequest): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(requestData.id);
}

function requestHasValidYouTubeChannelId(requestData: VideoQueueRequest): boolean {
  // YouTube channel IDs can be:
  // - UC followed by 22 characters (e.g., UCxxxxxxxxxxxxxxxxxxxxxx)
  // - Custom channel handles (e.g., @channelname)
  // - Channel usernames
  return /^UC[a-zA-Z0-9_-]{22}$/.test(requestData.id) || 
         /^@[a-zA-Z0-9_-]+$/.test(requestData.id) ||
         /^[a-zA-Z0-9_-]+$/.test(requestData.id);
}

/**
 * Parses ISO 8601 duration format (e.g., "PT4M13S") to seconds
 * @param duration ISO 8601 duration string
 * @returns Duration in seconds, or null if parsing fails
 */
function parseDuration(duration: string): number | null {
  try {
    // Remove 'PT' prefix
    const durationStr = duration.replace('PT', '')
    
    let totalSeconds = 0
    
    // Parse hours (H)
    const hoursMatch = durationStr.match(/(\d+)H/)
    if (hoursMatch) {
      totalSeconds += parseInt(hoursMatch[1]) * 3600
    }
    
    // Parse minutes (M)
    const minutesMatch = durationStr.match(/(\d+)M/)
    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1]) * 60
    }
    
    // Parse seconds (S)
    const secondsMatch = durationStr.match(/(\d+)S/)
    if (secondsMatch) {
      totalSeconds += parseInt(secondsMatch[1])
    }
    
    return totalSeconds
  } catch (error) {
    console.error('Error parsing duration:', error)
    return null
  }
}

/**
 * Fetches metadata for a given YouTube video ID using the YouTube Data API.
 * @param videoId The ID of the YouTube video.
 * @param apiKey Your YouTube Data API key.
 * @returns A Promise that resolves with the video resource, or rejects with an error.
 */
async function getVideoMetadata(videoId: string, apiKey: string): Promise<youtube_v3.Schema$Video | undefined> {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });

    const response = await youtube.videos.list({
      id: videoId,
      part: ['snippet', 'contentDetails', 'statistics'], // Specify the parts of the video resource you want
    });

    // The response contains an array of videos, we expect only one for a specific ID
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0];
    } else {
      console.warn(`Video with ID ${videoId} not found.`);
      return undefined;
    }

  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw error; // Re-throw the error for handling by the caller
  }
}

/**
 * Fetches the latest video IDs from a YouTube channel using search API
 * @param channelIdentifier The ID or handle of the YouTube channel
 * @param apiKey Your YouTube Data API key
 * @param maxResults Maximum number of videos to fetch (default: 10)
 * @returns A Promise that resolves with an array of video IDs
 */
async function getChannelLatestVideoIds(channelIdentifier: string, apiKey: string, maxResults: number = 10): Promise<string[]> {
  try {
    const youtube = google.youtube({
      version: 'v3',
      auth: apiKey,
    });

    let channelId: string;

    // Check if it's a handle (starts with @) or channel ID (starts with UC)
    if (channelIdentifier.startsWith('@')) {
      // It's a handle, resolve it to channel ID first
      const handle = channelIdentifier.substring(1); // Remove the @
      
      const channelResponse = await youtube.channels.list({
        forHandle: handle, // Use the forHandle parameter to search by custom handle
        part: ['id'], // We only need the channel ID
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      channelId = channelResponse.data.items[0].id!;
    } else if (channelIdentifier.startsWith('UC')) {
      // It's already a channel ID
      channelId = channelIdentifier;
    } else {
      throw new Error('Invalid channel identifier format');
    }

    // Now search for videos using the resolved channel ID
    const response = await youtube.search.list({
      channelId: channelId,
      order: 'date', // Order results by publication date
      type: 'video', // Only search for videos
      maxResults: maxResults, // Limit the results to the latest videos
      part: ['id'], // We only need the video ID
    });

    const videoIds: string[] = [];
    if (response.data.items) {
      response.data.items.forEach(item => {
        if (item.id?.videoId) {
          videoIds.push(item.id.videoId);
        }
      });
    }

    return videoIds;
  } catch (error) {
    console.error('Error fetching channel video IDs:', error);
    throw error;
  }
}

/**
 * Creates a standardized HTTP response
 * @param result Object containing success status, data, and optional error
 * @returns HTTP Response object
 */
function createResponse(result: { success: boolean; data?: Record<string, unknown>; error?: string }): Response {
  const status = result.success ? 200 : (result.error?.includes('not found') ? 404 : 400);
  
  return new Response(
    JSON.stringify({
      success: result.success,
      ...(result.data && { ...result.data }),
      ...(result.error && { error: result.error })
    }),
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
}

/**
 * Processes a single video - creates database entry, fetches metadata, and updates status
 * @param requestData Video queue request data
 * @param youtubeApiKey YouTube API key
 * @param supabase Supabase client instance
 * @returns Promise resolving to processing result
 */
async function processSingleVideo(
  requestData: VideoQueueRequest, 
  youtubeApiKey: string, 
  supabase: ReturnType<typeof createClient<Database>>
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    // Create video record with minimal required fields first
    const { data: video, error: insertError } = await supabase
      .from('videos')
      .insert({
        youtubeId: requestData.id,
        userId: requestData.userId,
        status: 'PENDING'
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      
      // Handle duplicate youtubeId error
      if (insertError.code === '23505' && insertError.message.includes('youtubeId')) {
        return { success: false, error: 'This video has already been added to your knowledge base' }
      }

      return { success: false, error: 'Database error: ' + insertError.message }
    }

    try {
      // Fetch video metadata from YouTube API
      const videoMetadata = await getVideoMetadata(requestData.id, youtubeApiKey)
      
      if (!videoMetadata) {
        // Video not found, update status to FAILED
        await supabase
          .from('videos')
          .update({ 
            status: 'FAILED',
            error: 'Video not found on YouTube'
          })
          .eq('id', video.id)

        return { success: false, error: 'Video not found on YouTube' }
      }

      // Extract metadata from YouTube API response
      const snippet = videoMetadata.snippet
      const contentDetails = videoMetadata.contentDetails
      const statistics = videoMetadata.statistics

      // Parse duration from ISO 8601 format (e.g., "PT4M13S" -> 253 seconds)
      const duration = contentDetails?.duration ? parseDuration(contentDetails.duration) : null

      // Update video record with fetched metadata
      const { error: metadataUpdateError } = await supabase
        .from('videos')
        .update({
          title: snippet?.title || null,
          channelName: snippet?.channelTitle || null,
          thumbnailUrl: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url || null,
          duration: duration,
          status: 'QUEUED'
        })
        .eq('id', video.id)

      if (metadataUpdateError) {
        console.error('Error updating video metadata:', metadataUpdateError)
        // Update status to FAILED if metadata update fails
        await supabase
          .from('videos')
          .update({ 
            status: 'FAILED',
            error: 'Failed to save video metadata'
          })
          .eq('id', video.id)

        return { success: false, error: 'Failed to save video metadata' }
      }

      // Trigger Inngest processing for transcript extraction
      try {
        console.log(`[fetch-video-metadata] Triggering Inngest processing for video: ${video.id}`)
        
        // Get the updated video data for Inngest
        const { data: updatedVideo, error: videoFetchError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', video.id)
          .single()
        
        if (videoFetchError) {
          console.error('Failed to fetch updated video data:', videoFetchError)
        } else if (updatedVideo) {
          // Trigger Inngest function directly
          const inngest = new Inngest({
            id: 'youtube-gpt',
            eventKey: Deno.env.get('INNGEST_EVENT_KEY') ?? '',
            signingKey: Deno.env.get('INNGEST_SIGNING_KEY') ?? '',
          })
          await inngest.send({
            name: 'video.transcript.processing.requested',
            data: {
              video: {
                id: updatedVideo.id,
                youtubeId: updatedVideo.youtubeId,
                userId: updatedVideo.userId,
                title: updatedVideo.title,
                channelName: updatedVideo.channelName,
                duration: updatedVideo.duration,
                thumbnailUrl: updatedVideo.thumbnailUrl,
                status: updatedVideo.status,
                createdAt: updatedVideo.createdAt,
                updatedAt: updatedVideo.updatedAt
              }
            }
          })
          
          console.log(`[fetch-video-metadata] Successfully triggered Inngest processing for video: ${video.id}`)
        }
      } catch (inngestError) {
        console.error('Failed to trigger Inngest processing:', inngestError)
        // Don't fail the entire operation if Inngest trigger fails
        // The video is still successfully queued, just processing might be delayed
      }

      return {
        success: true,
        data: {
          videoId: video.id,
          message: 'Video metadata fetched and saved successfully',
          metadata: {
            title: snippet?.title,
            channel: snippet?.channelTitle,
            duration: duration
          }
        }
      }

    } catch (apiError) {
      console.error('YouTube API error:', apiError)
      
      // Update status to FAILED
      await supabase
        .from('videos')
        .update({ 
          status: 'FAILED',
          error: apiError instanceof Error ? apiError.message : 'Unknown API error'
        })
        .eq('id', video.id)

      return { success: false, error: 'Failed to fetch video metadata from YouTube' }
    }

  } catch (err) {
    console.error('Video processing error:', err)
    return { success: false, error: 'Database error: ' + (err.message || 'Unknown error') }
  }
}

/**
 * Processes a channel by fetching latest 10 videos and processing them in parallel
 * @param requestData Video queue request data
 * @param youtubeApiKey YouTube API key
 * @param supabase Supabase client instance
 * @returns Promise resolving to processing result
 */
async function processChannel(
  requestData: VideoQueueRequest, 
  youtubeApiKey: string, 
  supabase: ReturnType<typeof createClient<Database>>
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    // Get latest 10 video IDs from channel using search API
    const videoIds = await getChannelLatestVideoIds(requestData.id, youtubeApiKey, 10);
    
    if (videoIds.length === 0) {
      return { success: false, error: 'No videos found in channel' };
    }

    // Process all videos in parallel
    const videoPromises = videoIds.map(async (videoId) => {
      const videoRequest: VideoQueueRequest = {
        id: videoId,
        type: 'video',
        userId: requestData.userId
      };

      try {
        return await processSingleVideo(videoRequest, youtubeApiKey, supabase);
      } catch (error) {
        console.error(`Error processing video ${videoId}:`, error);
        return { success: false, error: error.message, videoId };
      }
    });

    // Wait for all videos to complete
    const results = await Promise.allSettled(videoPromises);
    
    // Process results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success);

    return {
      success: true,
      data: {
        message: `Processed ${successful.length} videos from channel`,
        successful: successful.length,
        failed: failed.length,
        videos: successful.map(s => s.value?.data),
        errors: failed.map(f => f.status === 'rejected' ? f.reason : f.value?.error).filter(Boolean)
      }
    };

  } catch (error) {
    console.error('Channel processing error:', error);
    return { success: false, error: 'Failed to process channel videos' + error.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return createResponse({ success: false, error: 'Method not allowed' })
  }

  try {
    // Initialize Supabase client with types
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const requestData: VideoQueueRequest = await req.json();
    
    // Validate required fields
    if (!requestHasAllRequiredFields(requestData)) {
      return createResponse({ success: false, error: 'Missing required fields: id, type, userId' })
    }

    // Validate YouTube ID format based on type
    if (requestData.type === 'video' && !requestHasValidYouTubeVideoId(requestData)) {
      return createResponse({ success: false, error: 'Invalid YouTube video ID format' })
    }

    if (requestData.type === 'channel' && !requestHasValidYouTubeChannelId(requestData)) {
      return createResponse({ success: false, error: 'Invalid YouTube channel ID format' })
    }

    // Get YouTube API key from environment
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      console.error('YouTube API key not found in environment variables')
      return createResponse({ success: false, error: 'YouTube API configuration error' })
    }

    // Process based on request type
    if (requestData.type === 'video') {
      const result = await processSingleVideo(requestData, youtubeApiKey, supabase);
      return createResponse(result);
    } else if (requestData.type === 'channel') {
      const result = await processChannel(requestData, youtubeApiKey, supabase);
      return createResponse(result);
    } else {
      return createResponse({ success: false, error: 'Invalid request type' });
    }

  } catch (err) {
    console.error('Function error:', err)
    return createResponse({ 
      success: false,
      error: 'Invalid request body or server error: ' + (err.message || 'Unknown error')
    })
  }
})