import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, AlertCircle, Check, Clock, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ProcessingStatus = 'queued' | 'processing' | 'ready' | 'failed'

export interface VideoCardProps {
  videoId: string
  title?: string | null
  thumbnailUrl?: string | null
  channel: {
    name?: string | null
    thumbnailUrl?: string | null
  }
  status: ProcessingStatus
  duration?: string | null
  publishedAt?: string | null
  onClick?: (videoId: string) => void
  onRetry?: (videoId: string) => void
  className?: string
}

const statusConfig = {
  queued: {
    variant: 'secondary' as const,
    icon: Clock,
    label: 'Queued',
    color: 'text-muted-foreground'
  },
  processing: {
    variant: 'default' as const,
    icon: Loader2,
    label: 'Processing',
    color: 'text-blue-600'
  },
  ready: {
    variant: 'default' as const,
    icon: Check,
    label: 'Ready',
    color: 'text-green-600'
  },
  failed: {
    variant: 'destructive' as const,
    icon: AlertCircle,
    label: 'Failed',
    color: 'text-red-600'
  }
}

export const VideoCard = ({
  videoId,
  title,
  thumbnailUrl,
  channel,
  status,
  duration,
  publishedAt,
  onClick,
  onRetry,
  className
}: VideoCardProps) => {
  const config = statusConfig[status]
  const Icon = config.icon

  const handleClick = () => {
    onClick?.(videoId)
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return ''
    }
  }

  // Helper function to check if a value is empty or null
  const isEmpty = (value: string | null | undefined): boolean => {
    return !value || value.trim() === ''
  }

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          'group cursor-pointer transition-all duration-200 hover:shadow-sm hover:bg-accent/50',
          'border-border/50 hover:border-border',
          className
        )}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          <div className="flex gap-3">
            {/* Left side - Text content (70%) */}
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
                  {!isEmpty(channel.thumbnailUrl) ? (
                    <AvatarImage src={channel.thumbnailUrl!} alt={channel.name || 'Channel'} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {!isEmpty(channel.name) ? channel.name!.charAt(0).toUpperCase() : '?'}
                  </AvatarFallback>
                </Avatar>
                {!isEmpty(channel.name) ? (
                  <span className="text-xs text-muted-foreground truncate">
                    {channel.name}
                  </span>
                ) : (
                  <Skeleton className="h-3 w-20" />
                )}
              </div>

              {/* Date */}
              {!isEmpty(publishedAt) ? (
                <span className="text-xs text-muted-foreground">
                  {formatDate(publishedAt)}
                </span>
              ) : (
                <Skeleton className="h-3 w-16" />
              )}
            </div>

            {/* Right side - Thumbnail (30%) */}
            <div className="flex-shrink-0 w-16">
              {/* Thumbnail */}
              <div className="w-16 h-12 relative overflow-hidden rounded-md">
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
                
                {/* Status overlay - top right corner */}
                <div className="absolute top-1 right-1">
                  {status === 'failed' && onRetry ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 px-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50/80 backdrop-blur-sm flex items-center gap-1"
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
                          <Icon className={cn('h-2.5 w-2.5 text-white', status === 'processing' && 'animate-spin')} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>{config.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                {/* Duration overlay for ready videos */}
                {!isEmpty(duration) && status === 'ready' && (
                  <div className="absolute bottom-0 right-0 left-0 bg-black/70 text-white text-xs px-1 py-0.5 text-center">
                    {duration}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Loading skeleton component
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
          <div className="flex-shrink-0 w-16 space-y-1">
            <Skeleton className="w-16 h-12 rounded-md" />
            <Skeleton className="h-5 w-full rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
