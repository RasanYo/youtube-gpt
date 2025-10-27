import type { Video } from '@/lib/supabase/types'
import type { TranscriptData } from '@/lib/zeroentropy/types'
import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptVideoUnavailableError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptEmptyError,
  type TranscriptResponse,
  type TranscriptConfig
} from '@danielxceron/youtube-transcript'
import { createLogger } from './inngest-logger'

const logger = createLogger('transcript-extractor')

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

    // Try different configurations based on attempt number
    let transcript: TranscriptResponse[]
    let config: TranscriptConfig = {}

    if (attempt === 1) {
      // First attempt: try default configuration
      logger.info(`Attempt ${attempt}: Trying with default configuration...`)
      transcript = await YoutubeTranscript.fetchTranscript(video.youtubeId)
    } else if (attempt === 2) {
      // Second attempt: try with specific language
      logger.info(`Attempt ${attempt}: Trying with 'en' language...`)
      config = { lang: 'en' }
      transcript = await YoutubeTranscript.fetchTranscript(video.youtubeId, config)
    } else {
      // Third attempt: try with different language
      logger.info(`Attempt ${attempt}: Trying with 'en-US' language...`)
      config = { lang: 'en-US' }
      transcript = await YoutubeTranscript.fetchTranscript(video.youtubeId, config)
    }

    const processingTime = Date.now() - startTime
    logger.info(`Transcript extraction completed in ${processingTime}ms for video: ${video.id}`, {
      segmentCount: transcript.length
    })

    // Validate transcript quality
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript data received from YouTube')
    }

    // Calculate total duration and text length
    const totalDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0)
    const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0)

    logger.info('Transcript validation', {
      duration: `${totalDuration}s`,
      textLength: `${totalTextLength} chars`
    })

    // Check for minimum quality thresholds
    if (totalTextLength < 50) {
      throw new Error('Transcript too short - likely poor quality or auto-generated captions disabled')
    }

    if (totalDuration < 10) {
      throw new Error('Video too short - minimum 10 seconds required')
    }

    // Format transcript for storage
    const formattedTranscript = transcript.map(segment => ({
      text: segment.text.trim(),
      start: segment.offset,
      duration: segment.duration,
      language: segment.lang || 'en'
    }))

    logger.info(`Transcript extraction successful for video: ${video.id}`, {
      formattedSegments: formattedTranscript.length
    })

    return {
      transcript: formattedTranscript,
      metadata: {
        totalSegments: transcript.length,
        totalDuration,
        totalTextLength,
        language: transcript[0]?.lang || 'en',
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

    // Handle specific error types with appropriate messages
    if (error instanceof YoutubeTranscriptDisabledError) {
      throw new Error('Transcript extraction failed: Captions are disabled for this video')
    } else if (error instanceof YoutubeTranscriptNotAvailableError) {
      throw new Error('Transcript extraction failed: No transcript available for this video')
    } else if (error instanceof YoutubeTranscriptNotAvailableLanguageError) {
      throw new Error('Transcript extraction failed: No transcript available in the requested language')
    } else if (error instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new Error('Transcript extraction failed: Video is unavailable or private')
    } else if (error instanceof YoutubeTranscriptTooManyRequestError) {
      throw new Error('Transcript extraction failed: Too many requests - rate limited')
    } else if (error instanceof YoutubeTranscriptEmptyError) {
      throw new Error('Transcript extraction failed: Transcript is empty')
    } else if (error instanceof Error) {
      throw new Error(`Transcript extraction failed: ${error.message}`)
    } else {
      throw new Error('Transcript extraction failed: Unknown error occurred')
    }
  }
}

