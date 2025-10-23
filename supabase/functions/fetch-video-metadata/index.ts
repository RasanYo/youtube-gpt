// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2'

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
    // Initialize Prisma client with proper configuration for Edge Functions
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: Deno.env.get('DATABASE_URL')
        }
      }
    })

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

    // Create video record with required fields
    const { data: video, error } = await supabase
      .from('videos')
      .insert({
        youtubeId: requestData.id,
        userId: requestData.userId,
        title: 'Processing...', // Placeholder
        channelName: 'Unknown', // Placeholder
        duration: 0, // Placeholder
        status: 'QUEUED'
      })
      .select('id')
      .single()

    if (error) {
      console.error('Database error:', error)
      
      // Handle duplicate youtubeId error
      if (error.code === '23505' && error.message.includes('youtubeId')) {
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
          error: 'Database error: ' + error.message
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
        message: 'Video queued for processing'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (err) {
    console.error('Function error:', err)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Invalid request body or server error' 
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