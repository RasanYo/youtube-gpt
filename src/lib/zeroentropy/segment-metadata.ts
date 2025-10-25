import type { ProcessedTranscriptSegment } from './types'


/**
 * Format timestamp for display (MM:SS)
 * 
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTimestamp(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format timestamp range for display
 * 
 * @param start - Start time in seconds
 * @param end - End time in seconds
 * @returns Formatted timestamp range (e.g., "01:38 - 02:40")
 */
export function formatTimestampRange(start: number, end: number): string {
  return `${formatTimestamp(start)} - ${formatTimestamp(end)}`
}

/**
 * Create page content for ZeroEntropy indexing
 * 
 * @param segment - Enhanced processed transcript segment
 * @returns Page content with searchable text
 */
export function createPageContent(segment: ProcessedTranscriptSegment): {
  content: string
  metadata: ProcessedTranscriptSegment
  searchableText: string
} {
  const searchableText = [
    `Timestamp: ${formatTimestampRange(segment.start, segment.end)}`,
    `Content: ${segment.text}`
  ].join('\n')

  return {
    content: segment.text,
    metadata: segment,
    searchableText
  }
}
