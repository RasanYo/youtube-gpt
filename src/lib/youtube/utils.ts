import type { YouTubeProcessResult } from './types'

/**
 * Create an error result with consistent formatting
 */
export function createErrorResult(
  message: string,
  type: YouTubeProcessResult['type'],
): YouTubeProcessResult {
  return {
    success: false,
    error: message,
    type,
  }
}

/**
 * Handle edge function errors with appropriate user-friendly messages
 */
export function handleEdgeFunctionError(error: unknown): YouTubeProcessResult {
  let errorMessage = 'Failed to submit video for processing. Please try again.'

  if (error instanceof Error) {
    if (
      error.message.includes('network') ||
      error.message.includes('timeout')
    ) {
      errorMessage =
        'Service temporarily unavailable. Please try again in a moment.'
    } else if (error.message.includes('unauthorized')) {
      errorMessage = 'Service authentication failed. Please contact support.'
    }
  }

  return {
    success: false,
    error: errorMessage,
    type: 'processing_error',
  }
}
