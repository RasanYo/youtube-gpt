'use client'

import { useMemo } from 'react'
import { parseCitations, type TextSegment } from '@/lib/citations/parser'
import { InlineCitation } from './inline-citation'
import { Response } from '@/components/ai-elements/response'

export interface CitationResponseProps {
  /** Text content that may contain citations */
  text: string
  /** Optional array of video objects for title lookup fallback */
  videos?: Array<{ id: string; title: string }>
}

/**
 * Citation-Enhanced Response Component
 * 
 * Renders text content with inline citations. Parses citations from the text
 * and renders them as interactive inline buttons, while rendering regular text
 * segments with markdown support.
 * 
 * @example
 * ```tsx
 * <CitationResponse
 *   text="Customer obsession is key [Amazon Documentary at 10:15](videoId:abc-123:615)."
 *   videos={[{ id: 'abc-123', title: 'Amazon Documentary' }]}
 * />
 * ```
 */
export function CitationResponse({ text, videos = [] }: CitationResponseProps) {
  // Parse citations from text
  const { segments } = useMemo(() => {
    try {
      return parseCitations(text)
    } catch (error) {
      console.error('Failed to parse citations:', error)
      // Fallback to plain text
      return {
        segments: [{ type: 'text', text }],
        citations: [],
      }
    }
  }, [text])

  // If no citations found, render as plain response with markdown
  const hasCitations = segments.some((s) => s.type === 'citation')
  if (!hasCitations) {
    return <Response>{text}</Response>
  }

  // Render segments with citations inline
  // Note: This doesn't preserve markdown formatting for text segments.
  // For full markdown support with inline citations, we'd need a custom markdown renderer.
  return (
    <>
      {segments.map((segment: TextSegment, index: number) => {
        if (segment.type === 'text') {
          // Render text segments with basic formatting
          return (
            <span key={`text-${index}`} className="whitespace-pre-wrap">
              {segment.text}
            </span>
          )
        }

        if (segment.type === 'citation' && segment.citation) {
          const citation = segment.citation

          // Try to get video title from videos prop if missing
          const videoTitle =
            citation.videoTitle ||
            videos.find((v) => v.id === citation.videoId)?.title ||
            'Video'

          return (
            <InlineCitation
              key={citation.id}
              videoId={citation.videoId}
              videoTitle={videoTitle}
              timestamp={citation.timestamp}
              startTime={citation.startTime}
            />
          )
        }

        return null
      })}
    </>
  )
}
