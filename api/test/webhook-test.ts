import { triggerVideoProcessing } from '../../src/lib/inngest/triggers'
import type { Video } from '../../src/lib/supabase/types'

/**
 * Test endpoint for webhook functionality
 *
 * This endpoint allows you to test the video processing webhook
 * without setting up Supabase database webhooks. It simulates
 * the webhook payload and triggers video processing.
 *
 * Usage:
 * POST /api/test/webhook-test
 * Body: { video: Video object }
 */

export async function POST(request: Request) {
  try {
    console.log('[webhook-test] Testing video processing webhook')
    
    const { video } = await request.json()
    
    if (!video) {
      return new Response('No video provided', { status: 400 })
    }
    
    console.log(`[webhook-test] Testing with video: ${video.id}`)
    
    // Trigger the Inngest job directly
    await triggerVideoProcessing(video)
    
    console.log(`[webhook-test] Successfully triggered processing for video: ${video.id}`)
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Video processing triggered successfully',
      videoId: video.id 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('[webhook-test] Error testing webhook:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function GET() {
  return new Response(JSON.stringify({
    message: 'Webhook test endpoint',
    usage: 'POST with { video: Video object } to test video processing'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
