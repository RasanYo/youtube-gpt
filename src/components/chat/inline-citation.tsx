'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Citation } from '@/lib/citations/parser'

export interface InlineCitationProps {
  /** Video ID from the database */
  videoId: string
  /** Display title of the video */
  videoTitle: string
  /** Human-readable timestamp (e.g., "10:15") */
  timestamp: string
  /** Start time in seconds for navigation */
  startTime: number
  /** Optional: Custom class name */
  className?: string
}

/**
 * Inline Citation Component
 * 
 * Renders a clickable citation that appears inline with text.
 * Displays as an underlined link with a timestamp that users can click.
 * 
 * @example
 * ```tsx
 * <InlineCitation
 *   videoId="abc-123"
 *   videoTitle="Amazon Documentary"
 *   timestamp="10:15"
 *   startTime={615}
 * />
 * ```
 */
export function InlineCitation({
  videoId,
  videoTitle,
  timestamp,
  startTime,
  className,
}: InlineCitationProps) {
  const handleClick = () => {
    // TODO: Implement video navigation to timestamp
    // For now, log the citation info
    console.log('Citation clicked:', {
      videoId,
      videoTitle,
      timestamp,
      startTime,
    })

    // Future: Navigate to video at timestamp
    // Example: router.push(`/video/${videoId}?t=${startTime}`)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${className ?? ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`Go to ${videoTitle} at ${timestamp}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleClick()
              }
            }}
          >
            <span className="text-muted-foreground italic text-sm">
              {videoTitle}
            </span>
            <span className="text-red-500 font-normal italic text-sm">
              {timestamp}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-xs">
            <p className="font-medium">{videoTitle}</p>
            <p className="text-xs text-muted-foreground">Click to view at {timestamp}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Removed renderCitation helper function to avoid fast refresh warning
// Use InlineCitation component directly
