'use client'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useVideoPreview } from '@/contexts/VideoPreviewContext'
import { useToast } from '@/hooks/use-toast'
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
  const { openPreview } = useVideoPreview()
  const { toast } = useToast()

  const handleClick = () => {
    // Check if knowledge base is visible (desktop >= 1024px)
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

    if (!isDesktop) {
      // Show toast notification for mobile/tablet users
      toast({
        title: 'Preview requires desktop view',
        description: 'Open in browser to preview videos.',
        variant: 'default',
      })
      return
    }

    // Open video preview at the specified timestamp
    try {
      openPreview(videoId, startTime)
    } catch (error) {
      console.error('Failed to open video preview:', error)
      toast({
        title: 'Error',
        description: 'Failed to open video preview',
        variant: 'destructive',
      })
    }
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
