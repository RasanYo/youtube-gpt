// supabase/functions/process-transcript-webhook/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Inngest } from 'npm:inngest'

const inngest = new Inngest({
  id: "youtube-gpt",
  eventKey: Deno.env.get('INNGEST_EVENT_KEY'),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      },
    })
  }

  try {
    const payload = await req.json()
    const video = payload.record
    
    if (!video || video.status !== 'QUEUED') {
      return new Response('Status not QUEUED, skipping', { status: 200 })
    }
    
    await inngest.send({
      name: 'video.transcript.processing.requested',
      data: { video },
    })
    
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})