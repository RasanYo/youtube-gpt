/**
 * Citation Parser for AI Responses
 * 
 * Parses inline citations from AI-generated text and converts them into structured data.
 * Supports the format: [Video Title at M:SS](videoId:VIDEO_ID:START_TIME_IN_SECONDS)
 * 
 * Example: "Customer obsession is the first principle [Amazon Documentary at 10:15](videoId:abc-123:615)"
 */

export interface Citation {
  /** Unique ID for the citation within the text */
  id: string
  /** Video ID from the database */
  videoId: string
  /** Display title of the video */
  videoTitle: string
  /** Human-readable timestamp (e.g., "10:15") */
  timestamp: string
  /** Start time in seconds for navigation (can be decimal, e.g., 418.4) */
  startTime: number
  /** Index in the text where the citation starts */
  matchIndex: number
  /** Full text of the citation including title and timestamp */
  text: string
}

export interface TextSegment {
  /** Type of segment: 'text' for regular text, 'citation' for citation */
  type: 'text' | 'citation'
  /** Text content (for 'text' segments) */
  text?: string
  /** Citation data (for 'citation' segments) */
  citation?: Citation
}

export interface ParseResult {
  /** Array of text segments (text blocks and citation markers) */
  segments: TextSegment[]
  /** Array of extracted citations with metadata */
  citations: Citation[]
}

/**
 * Regular expression to match citation format: [Title at M:SS](videoId:ID:SECONDS)
 * 
 * Breakdown:
 * - `\[([^\]]+?)\s+at\s+(\d+):(\d{2})\](\(videoId:([^:]+):([\d.]+)\))` - Matches the full citation
 * - Group 1: Video title
 * - Group 2: Minutes
 * - Group 3: Seconds
 * - Group 4: Full link text
 * - Group 5: Video ID
 * - Group 6: Start time in seconds (can be decimal, e.g., 418.4)
 */
const CITATION_REGEX = /\[([^\]]+?)\s+at\s+(\d+):(\d{2})\](\(videoId:([^:]+):([\d.]+)\))/g

/**
 * Converts minutes and seconds to total seconds
 * 
 * @param minutes - Number of minutes
 * @param seconds - Number of seconds
 * @returns Total seconds
 */
function timeToSeconds(minutes: number, seconds: number): number {
  return minutes * 60 + seconds
}

/**
 * Parses citations from text and returns structured segments
 * 
 * @param text - Text containing potential citations
 * @returns Object with segments array and citations array
 * 
 * @example
 * ```typescript
 * const result = parseCitations(
 *   "Customer obsession [Amazon Documentary at 10:15](videoId:abc-123:615) is key."
 * )
 * // Returns { segments: [...], citations: [...] }
 * ```
 */
export function parseCitations(text: string): ParseResult {
  // Find all citation matches
  const matches: Array<{
    fullMatch: string
    videoTitle: string
    minutes: number
    seconds: number
    videoId: string
    startTime: number
    index: number
  }> = []

  let match: RegExpExecArray | null
  // Reset regex lastIndex to ensure we get all matches
  CITATION_REGEX.lastIndex = 0

  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const fullMatch = match[0]
    const videoTitle = match[1]
    const minutes = parseInt(match[2], 10)
    const seconds = parseInt(match[3], 10)
    const videoId = match[5]
    const startTime = parseFloat(match[6]) // Allow decimal seconds (e.g., 418.4)

    // Validate parsed values
    if (isNaN(minutes) || isNaN(seconds) || isNaN(startTime) || !videoId) {
      console.warn('Skipping malformed citation:', fullMatch)
      continue
    }

    matches.push({
      fullMatch,
      videoTitle,
      minutes,
      seconds,
      videoId,
      startTime,
      index: match.index
    })
  }

  // If no citations found, return text as single segment
  if (matches.length === 0) {
    return {
      segments: [{ type: 'text', text }],
      citations: []
    }
  }

  // Build segments array
  const segments: TextSegment[] = []
  const citations: Citation[] = []
  let lastIndex = 0

  matches.forEach((match, matchIdx) => {
    // Add text segment before this citation
    if (match.index > lastIndex) {
      const textSegment = text.substring(lastIndex, match.index)
      if (textSegment) {
        segments.push({ type: 'text', text: textSegment })
      }
    }

    // Create citation object
    const timestamp = `${match.minutes}:${match.seconds.toString().padStart(2, '0')}`
    const citation: Citation = {
      id: `citation-${matchIdx}`,
      videoId: match.videoId,
      videoTitle: match.videoTitle,
      timestamp,
      startTime: match.startTime,
      matchIndex: match.index,
      text: match.fullMatch
    }

    // Add citation segment
    segments.push({ type: 'citation', citation })
    citations.push(citation)

    lastIndex = match.index + match.fullMatch.length
  })

  // Add remaining text after last citation
  if (lastIndex < text.length) {
    const textSegment = text.substring(lastIndex)
    if (textSegment) {
      segments.push({ type: 'text', text: textSegment })
    }
  }

  return { segments, citations }
}
