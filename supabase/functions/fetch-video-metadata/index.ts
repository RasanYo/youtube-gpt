// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'
import type { Database } from '../../lib/database/types.ts'
import { youtube_v3, google } from 'googleapis'

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
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
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
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: id, type, userId' 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Validate YouTube ID format for videos
    if (requestData.type === 'video' && !requestHasValidYouTubeVideoId(requestData)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid YouTube video ID format' 
        }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // For now, only handle video types
    if (requestData.type === 'channel') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Channel processing is not yet implemented'
        }),
        { 
          status: 501,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Get YouTube API key from environment
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY')
    if (!youtubeApiKey) {
      console.error('YouTube API key not found in environment variables')
      return new Response(
        JSON.stringify({
          success: false,
          error: 'YouTube API configuration error'
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Create video record with minimal required fields first
    const { data: video, error: insertError } = await supabase
      .from('videos')
      .insert({
        youtubeId: requestData.id,
        userId: requestData.userId,
        status: 'QUEUED'
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      
      // Handle duplicate youtubeId error
      if (insertError.code === '23505' && insertError.message.includes('youtubeId')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'This video has already been added to your knowledge base'
          }),
          { 
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error: ' + insertError.message
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // Update status to PROCESSING
    const { error: updateError } = await supabase
      .from('videos')
      .update({ status: 'PROCESSING' })
      .eq('id', video.id)

    if (updateError) {
      console.error('Error updating video status to PROCESSING:', updateError)
      // Continue with metadata fetching even if status update fails
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

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Video not found on YouTube'
          }),
          { 
            status: 404,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        )
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

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to save video metadata'
          }),
          { 
            status: 500,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          videoId: video.id,
          message: 'Video metadata fetched and saved successfully',
          metadata: {
            title: snippet?.title,
            channel: snippet?.channelTitle,
            duration: duration
          }
        }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )

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

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to fetch video metadata from YouTube'
        }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

  } catch (err) {
    console.error('Function error:', err)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Invalid request body or server error' ,
        error: 'Database error: ' + (err.message || 'Unknown error')
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
})