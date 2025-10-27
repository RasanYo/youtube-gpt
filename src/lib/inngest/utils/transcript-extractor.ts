import type { Video } from '@/lib/supabase/types'
import type { TranscriptData } from '@/lib/zeroentropy/types'
import { Supadata } from '@supadata/js'
import { createLogger } from './inngest-logger'

const logger = createLogger('transcript-extractor')

/**
 * Initialize Supadata client with API key from environment variables
 */
function getSupadataClient(): Supadata {
  const apiKey = process.env.SUPADATA_API_KEY
  
  if (!apiKey) {
    throw new Error('SUPADATA_API_KEY environment variable is not set')
  }

  return new Supadata({
    apiKey
  })
}

/**
 * Extract transcript from YouTube video with retry logic
 * 
 * Attempts to extract a transcript multiple times with exponential backoff.
 * Each retry uses different configuration options to maximize success rate.
 * 
 * @param video - The video to extract transcript from
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Promise resolving to transcript data
 * @throws Error if all retry attempts fail
 */
export async function extractTranscriptWithRetry(
  video: Video,
  maxRetries = 3
): Promise<TranscriptData> {
  logger.info(`Starting transcript extraction with retry for video: ${video.id}`, {
    youtubeId: video.youtubeId,
    maxRetries
  })

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`Attempt ${attempt}/${maxRetries} for video: ${video.id}`)
      return await extractTranscript(video, attempt)
    } catch (error) {
      logger.error(`Attempt ${attempt} failed`, {
        message: error instanceof Error ? error.message : 'Unknown error',
        youtubeId: video.youtubeId,
        attempt,
        maxRetries
      })

      if (attempt === maxRetries) {
        logger.error(`All ${maxRetries} attempts failed for video: ${video.id}`)
        throw error
      }

      // Wait before retry with exponential backoff
      const delay = Math.pow(2, attempt) * 1000
      logger.info(`Waiting ${delay}ms before retry...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw new Error('This should never be reached')
}

/**
 * Extract transcript from YouTube video
 * 
 * Attempts to extract transcript using different configurations based on attempt number.
 * Validates transcript quality and formats it for storage.
 * 
 * @param video - The video to extract transcript from
 * @param attempt - The attempt number (affects configuration used)
 * @returns Promise resolving to transcript data
 * @throws Error if extraction fails or transcript quality is insufficient
 */
export async function extractTranscript(
  video: Video,
  attempt = 1
): Promise<TranscriptData> {
  logger.info(`Starting transcript extraction for video: ${video.id} (attempt ${attempt})`, {
    youtubeId: video.youtubeId
  })

  try {
    const startTime = Date.now()
    const supadata = getSupadataClient()

    logger.info(`Attempt ${attempt}: Fetching transcript from Supadata...`)
    
    // Fetch transcript using Supadata
    const response = await supadata.youtube.transcript({
      videoId: video.youtubeId
    })

    // Supadata returns: { lang: string, content: TranscriptChunk[] | string }
    // If content is a string, that's just the raw text, not the segmented format we need
    if (typeof response.content === 'string') {
      throw new Error('Transcript returned as plain text string, expected segmented format')
    }

    const transcript = response.content || []

    const processingTime = Date.now() - startTime
    logger.info(`Transcript extraction completed in ${processingTime}ms for video: ${video.id}`, {
      segmentCount: transcript.length,
      language: response.lang
    })

    // Validate transcript quality
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript data received from Supadata')
    }

    // Calculate total duration and text length
    const totalDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0) / 1000 // Convert ms to seconds
    const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0)

    logger.info('Transcript validation', {
      duration: `${totalDuration.toFixed(2)}s`,
      textLength: `${totalTextLength} chars`
    })

    // Check for minimum quality thresholds
    if (totalTextLength < 50) {
      throw new Error('Transcript too short - likely poor quality or auto-generated captions disabled')
    }

    if (totalDuration < 10) {
      throw new Error('Video too short - minimum 10 seconds required')
    }

    // Format transcript for storage (Supadata uses offset in ms, we need to convert to seconds)
    const formattedTranscript = transcript.map(segment => ({
      text: segment.text.trim(),
      start: segment.offset / 1000, // Convert ms to seconds
      duration: segment.duration / 1000, // Convert ms to seconds
      language: segment.lang || response.lang || 'en'
    }))

    logger.info(`Transcript extraction successful for video: ${video.id}`, {
      formattedSegments: formattedTranscript.length
    })

    return {
      transcript: formattedTranscript,
      metadata: {
        totalSegments: transcript.length,
        totalDuration: totalDuration,
        totalTextLength,
        language: response.lang || 'en',
        extractedAt: new Date().toISOString(),
        processingTimeMs: processingTime
      }
    }

  } catch (error) {
    logger.error(`Transcript extraction failed for video: ${video.id}`, {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
      youtubeId: video.youtubeId,
      attempt
    })

    // Handle errors with appropriate messages
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('disabled') || errorMessage.includes('captions')) {
        throw new Error('Transcript extraction failed: Captions are disabled for this video')
      } else if (errorMessage.includes('not available') || errorMessage.includes('no transcript')) {
        throw new Error('Transcript extraction failed: No transcript available for this video')
      } else if (errorMessage.includes('unavailable') || errorMessage.includes('private')) {
        throw new Error('Transcript extraction failed: Video is unavailable or private')
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        throw new Error('Transcript extraction failed: Too many requests - rate limited')
      } else if (errorMessage.includes('invalid') || errorMessage.includes('not found')) {
        throw new Error('Transcript extraction failed: Invalid YouTube video ID')
      } else {
        throw new Error(`Transcript extraction failed: ${error.message}`)
      }
    } else {
      throw new Error('Transcript extraction failed: Unknown error occurred')
    }
  }
}

