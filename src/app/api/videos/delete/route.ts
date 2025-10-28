import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { triggerVideoDocumentsDeletion } from '@/lib/inngest/triggers'

/**
 * Video Deletion API Route
 *
 * This API route handles video deletion requests from the client.
 * It validates authentication, triggers Inngest deletion events,
 * and returns success/failure status for each video.
 *
 * Request Format:
 * POST /api/videos/delete
 * Body: { videoIds: string[] }
 *
 * Response Format:
 * {
 *   success: boolean,
 *   triggered: number,  // Count of successfully triggered events
 *   failed: number,     // Count of failed events
 *   errors?: string[]   // Error messages for failed deletions
 * }
 *
 * Status Codes:
 * - 200: Success (all or some events triggered)
 * - 207: Partial success (some succeeded, some failed)
 * - 400: Invalid request (missing or empty videoIds)
 * - 401: Unauthorized (user not authenticated)
 * - 500: Server error (all events failed)
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/route-handlers
 */

/**
 * Handles POST requests for video deletion
 *
 * The deletion flow:
 * 1. Validate request body contains videoIds array
 * 2. Authenticate user using Supabase server client
 * 3. Trigger Inngest deletion events for each video
 * 4. Return aggregated success/failure counts
 *
 * @param request - Next.js request object
 * @returns Response with deletion status
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse and validate request body
    const body = await request.json()
    const { videoIds } = body

    // Validate videoIds exists and is an array
    if (!videoIds || !Array.isArray(videoIds)) {
      console.error('Invalid request: videoIds array is required')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          message: 'videoIds array is required' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate videoIds is not empty
    if (videoIds.length === 0) {
      console.error('Invalid request: videoIds array is empty')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          message: 'videoIds array cannot be empty' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate each videoId is a string
    if (!videoIds.every(id => typeof id === 'string')) {
      console.error('Invalid request: videoIds must be strings')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request', 
          message: 'All videoIds must be strings' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[POST /api/videos/delete] Request received for ${videoIds.length} video(s)`)

    // Step 2: Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message)
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'You must be logged in to delete videos' 
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[POST /api/videos/delete] User authenticated: ${user.id}`)

    // Step 3: Trigger Inngest deletion events for each video
    // Use Promise.allSettled to handle multiple videos concurrently
    // This ensures that if one video fails, others can still be processed
    const results = await Promise.allSettled(
      videoIds.map(videoId => 
        triggerVideoDocumentsDeletion(videoId, user.id)
      )
    )

    // Step 4: Aggregate results from batch deletion attempts
    // Extract counts of successful and failed event triggers
    const triggered = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length
    // Collect error messages from failed attempts for client feedback
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason?.message || 'Unknown error')

    // Log results
    console.log(`[POST /api/videos/delete] Results: ${triggered} triggered, ${failed} failed`)
    
    if (errors.length > 0) {
      console.error('[POST /api/videos/delete] Errors:', errors)
    }

    // Step 5: Return appropriate HTTP response based on results
    // HTTP Status Code Strategy:
    // - 200: All events triggered successfully
    // - 207: Partial success (some succeeded, some failed) - RFC 4918 Multi-Status
    // - 500: All events failed to trigger
    if (triggered === 0) {
      // All deletions failed - no events could be sent to Inngest
      return new Response(
        JSON.stringify({ 
          success: false,
          triggered: 0,
          failed: failed,
          errors 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    if (failed > 0) {
      // Partial success - some events triggered, some failed
      // Return 207 Multi-Status to indicate partial failure (RFC 4918)
      return new Response(
        JSON.stringify({ 
          success: true,
          triggered,
          failed,
          errors 
        }), 
        { 
          status: 207, // Multi-Status / Partial Success
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // All deletions triggered successfully
    // All Inngest events were sent successfully, background jobs will process
    return new Response(
      JSON.stringify({ 
        success: true,
        triggered,
        failed: 0
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[POST /api/videos/delete] Unexpected error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

