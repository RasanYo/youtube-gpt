'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Loader2, AlertCircle, Check, Clock, MoreVertical, ExternalLink, Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Video, VideoStatus } from '@/lib/supabase/types'

export type ProcessingStatus = 'pending' | 'queued' | 'processing' | 'transcript_extracting' | 'zeroentropy_processing' | 'ready' | 'failed'

export interface VideoCardProps {
  video: Video
  onClick?: (videoId: string) => void
  onPreview?: (videoId: string) => void
  onRetry?: (videoId: string) => void
  isSelected?: boolean
  className?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const convertStatus = (dbStatus: VideoStatus | null): ProcessingStatus => {
  if (!dbStatus) return 'pending'
  return dbStatus.toLowerCase() as ProcessingStatus
}

const formatDuration = (seconds: number | null): string | null => {
  if (!seconds) return null
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return ''
  }
}

const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim() === ''
}

// Status configuration with theme-aware color tokens
// Each status uses semantic colors that adapt to light/dark mode automatically
const statusConfig = {
  pending: {
    variant: 'outline' as const,
    icon: Clock,
    label: 'Pending',
    color: 'text-warning' // Yellow in both light and dark modes
  },
  queued: {
    variant: 'secondary' as const,
    icon: Loader2,
    label: 'Queued',
    color: 'text-muted-foreground' // Subtle gray, less prominent
  },
  processing: {
    variant: 'default' as const,
    icon: Loader2,
    label: 'Processing',
    color: 'text-info' // Blue, indicates active work in progress
  },
  'transcript_extracting': {
    variant: 'default' as const,
    icon: Loader2,
    label: 'Transcript Extracting',
    color: 'text-info' // Blue, informational status
  },
  'zeroentropy_processing': {
    variant: 'default' as const,
    icon: Loader2,
    label: 'ZeroEntropy Processing',
    color: 'text-success' // Green, indicates positive progression
  },
  ready: {
    variant: 'default' as const,
    icon: Check,
    label: 'Ready',
    color: 'text-success' // Green, successfully completed
  },
  failed: {
    variant: 'destructive' as const,
    icon: AlertCircle,
    label: 'Failed',
    color: 'text-destructive' // Red, error/destructive action
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface VideoCardHeaderProps {
  title: string | null
  channelName: string | null
  publishedAt: string | null
  duration: string | null
  status: ProcessingStatus
}

const VideoCardHeader = ({ title, channelName, publishedAt, duration, status }: VideoCardHeaderProps) => {
  return (
    <div className="flex-1 min-w-0 space-y-1">
      {/* Title */}
      {!isEmpty(title) ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <h3 className="text-sm font-medium leading-tight truncate">
              {title}
            </h3>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p>{title}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Skeleton className="h-4 w-full" />
      )}

      {/* Channel */}
      <div className="flex items-center gap-2">
        <Avatar className="h-4 w-4">
          <AvatarFallback className="text-xs">
            {!isEmpty(channelName) ? channelName!.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
        {!isEmpty(channelName) ? (
          <span className="text-xs text-muted-foreground truncate">
            {channelName}
          </span>
        ) : (
          <Skeleton className="h-3 w-20" />
        )}
      </div>

      {/* Date and Duration */}
      <div className="flex items-center gap-2">
        {!isEmpty(publishedAt) ? (
          <span className="text-xs text-muted-foreground">
            {formatDate(publishedAt)}
          </span>
        ) : (
          <Skeleton className="h-3 w-16" />
        )}
        {!isEmpty(duration) && status === 'ready' && (
          <>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {duration}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

interface VideoCardStatusProps {
  status: ProcessingStatus
  onRetry?: (videoId: string) => void
  videoId: string
}

const VideoCardStatus = ({ status, onRetry, videoId }: VideoCardStatusProps) => {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className="absolute top-1 right-1">
      {status === 'failed' && onRetry ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-4 px-1 text-xs text-destructive hover:bg-destructive/10 backdrop-blur-sm flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation()
            onRetry(videoId)
          }}
        >
          Retry
          <Icon className="h-3 w-3" />
        </Button>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'h-4 w-4 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm',
              status === 'processing' && 'animate-pulse'
            )}>
              <Icon className={cn('h-2.5 w-2.5 text-white', (status === 'processing' || status === 'queued') && 'animate-spin')} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{config.label}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

interface VideoCardThumbnailProps {
  thumbnailUrl: string | null
  title: string | null
  status: ProcessingStatus
  onRetry?: (videoId: string) => void
  videoId: string
}

const VideoCardThumbnail = ({ thumbnailUrl, title, status, onRetry, videoId }: VideoCardThumbnailProps) => {
  return (
    <div className="flex-shrink-0 w-12">
      <div className="w-12 h-9 relative overflow-hidden rounded-md">
        {!isEmpty(thumbnailUrl) ? (
          <img
            src={thumbnailUrl!}
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Skeleton className="w-full h-full" />
        )}
        
        <VideoCardStatus status={status} onRetry={onRetry} videoId={videoId} />
      </div>
    </div>
  )
}

interface VideoCardActionsProps {
  isSelected: boolean
  videoId: string
  onPreview?: (videoId: string) => void
  onClick?: (videoId: string) => void
  youtubeId: string | null
}

const VideoCardActions = ({ isSelected, videoId, onPreview, onClick, youtubeId }: VideoCardActionsProps) => {
  const handleOpenInYouTube = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (youtubeId) {
      window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-1 z-20">
      {/* Selection checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onClick?.(videoId)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4"
      />
      
      {/* More options menu */}
      {onPreview && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation()
              onPreview?.(videoId)
            }} className="text-xs">
              <Play className="mr-2 h-3 w-3" />
              Preview
            </DropdownMenuItem>
            {youtubeId && (
              <DropdownMenuItem onClick={handleOpenInYouTube} className="text-xs">
                <ExternalLink className="mr-2 h-3 w-3" />
                Open in YouTube
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const VideoCard = ({
  video,
  onClick,
  onPreview,
  onRetry,
  isSelected = false,
  className
}: VideoCardProps) => {
  const videoId = video.id
  const title = video.title
  const thumbnailUrl = video.thumbnailUrl
  const channelName = video.channelName
  const status = convertStatus(video.status)
  const duration = formatDuration(video.duration)
  const publishedAt = video.createdAt
  const youtubeId = video.youtubeId

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          'group cursor-pointer transition-all duration-200 hover:shadow-sm hover:bg-accent/50',
          'border-border/50 hover:border-border',
          isSelected && 'ring-2 ring-primary bg-primary/5 border-primary/50',
          className
        )}
        onClick={() => onClick?.(videoId)}
      >
        <CardContent className="p-3 relative">
          <VideoCardActions 
            isSelected={isSelected}
            videoId={videoId}
            onPreview={onPreview}
            onClick={onClick}
            youtubeId={youtubeId}
          />
          
          <div className="flex gap-3">
            <VideoCardHeader 
              title={title}
              channelName={channelName}
              publishedAt={publishedAt}
              duration={duration}
              status={status}
            />
            
            <VideoCardThumbnail
              thumbnailUrl={thumbnailUrl}
              title={title}
              status={status}
              onRetry={onRetry}
              videoId={videoId}
            />
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

export const VideoCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Left side - Text content (70%) */}
          <div className="flex-1 min-w-0 space-y-1">
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          {/* Right side - Thumbnail and Status (30%) */}
          <div className="flex-shrink-0 w-12 space-y-1">
            <Skeleton className="w-12 h-9 rounded-md" />
            <Skeleton className="h-5 w-full rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
