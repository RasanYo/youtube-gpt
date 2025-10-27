'use client'

import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
          <Button
            variant="ghost"
            size="sm"
            className={`h-auto p-0 text-primary underline decoration-2 underline-offset-2 hover:no-underline ${className ?? ''}`}
            onClick={handleClick}
            aria-label={`Go to ${videoTitle} at ${timestamp}`}
          >
            <Link2 className="mr-1 h-3 w-3" />
            {timestamp}
          </Button>
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

/**
 * Helper function to render a Citation object as an InlineCitation
 * 
 * @param citation - Citation object from parseCitations
 * @returns InlineCitation component
 */
export function renderCitation(citation: Citation) {
  return (
    <InlineCitation
      key={citation.id}
      videoId={citation.videoId}
      videoTitle={citation.videoTitle}
      timestamp={citation.timestamp}
      startTime={citation.startTime}
    />
  )
}
