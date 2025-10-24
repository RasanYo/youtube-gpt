import { triggerVideoProcessing } from '../../src/lib/inngest/triggers'
import type { Video } from '../../src/lib/supabase/types'

/**
 * Webhook endpoint for processing video transcripts
 *
 * This endpoint is called by Supabase Database Webhooks when a video's
 * status changes to 'QUEUED' after metadata has been successfully fetched.
 * It triggers the Inngest job to process the video's transcript and
 * generate vector embeddings.
 *
 * Webhook Configuration in Supabase:
 * - Table: videos
 * - Event: UPDATE
 * - Filter: status = 'QUEUED'
 * - URL: https://your-app.com/api/webhooks/process-transcript
 */

export async function POST(request: Request) {
  try {
    console.log('[webhook] Received video processing request')
    
    // Parse the webhook payload
    const payload = await request.json()
    console.log('[webhook] Payload:', JSON.stringify(payload, null, 2))
    
    // Extract video data from Supabase webhook payload
    const video = payload.record as Video
    
    if (!video) {
      console.error('[webhook] No video record found in payload')
      return new Response('No video record found', { status: 400 })
    }
    
    // Only process if status is QUEUED
    if (video.status !== 'QUEUED') {
      console.log(`[webhook] Video ${video.id} status is ${video.status}, skipping`)
      return new Response('Status not QUEUED, skipping', { status: 200 })
    }
    
    console.log(`[webhook] Triggering processing for video: ${video.id}`)
    
    // Trigger the Inngest job
    await triggerVideoProcessing(video)
    
    console.log(`[webhook] Successfully triggered processing for video: ${video.id}`)
    
    return new Response('OK', { status: 200 })
    
  } catch (error) {
    console.error('[webhook] Error processing video:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Handle other HTTP methods
export async function GET() {
  return new Response('Webhook endpoint for video processing', { status: 200 })
}
