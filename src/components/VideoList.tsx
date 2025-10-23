import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VideoCard, VideoCardProps, VideoCardSkeleton } from './VideoCard'
import { Video, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

export interface VideoItem {
  videoId: string
  title?: string | null
  thumbnailUrl?: string | null
  channel: {
    name?: string | null
    thumbnailUrl?: string | null
  }
  status: VideoCardProps['status']
  duration?: string | null
  publishedAt?: string | null
}

export interface VideoListProps {
  videos: VideoItem[]
  isLoading?: boolean
  onVideoClick?: (videoId: string) => void
  onRetry?: (videoId: string) => void
  className?: string
  emptyStateMessage?: string
  emptyStateDescription?: string
}

export const VideoList = ({
  videos,
  isLoading = false,
  onVideoClick,
  onRetry,
  className,
  emptyStateMessage = 'No videos yet',
  emptyStateDescription = 'Add videos to build your knowledge base'
}: VideoListProps) => {
  // Sort videos by date (newest first)
  const sortedVideos = useMemo(() => {
    return sortVideosByDate(videos, 'desc')
  }, [videos])
  // Show loading skeletons
  if (isLoading) {
    return (
      <ScrollArea className={cn('flex-1', className)}>
        <div className="space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))}
        </div>
      </ScrollArea>
    )
  }

  // Show empty state
  if (videos.length === 0) {
    return (
      <ScrollArea className={cn('flex-1', className)}>
        <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
          <div className="mb-4">
            <Video className="h-12 w-12 text-muted-foreground/50" />
          </div>
          <Alert className="max-w-sm border-none shadow-none">
            <Search className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <div className="font-medium mb-1">{emptyStateMessage}</div>
              <div className="text-xs text-muted-foreground">
                {emptyStateDescription}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </ScrollArea>
    )
  }

  // Show video list
  return (
    <ScrollArea className={cn('flex-1', className)}>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {sortedVideos.map((video) => (
            <VideoCard
              key={video.videoId}
              videoId={video.videoId}
              title={video.title}
              thumbnailUrl={video.thumbnailUrl}
              channel={video.channel}
              status={video.status}
              duration={video.duration}
              publishedAt={video.publishedAt}
              onClick={onVideoClick}
              onRetry={onRetry}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

// Utility function for sorting videos by date
export const sortVideosByDate = (
  videos: VideoItem[],
  order: 'asc' | 'desc' = 'desc'
): VideoItem[] => {
  return [...videos].sort((a, b) => {
    const dateA = new Date(a.publishedAt || 0).getTime()
    const dateB = new Date(b.publishedAt || 0).getTime()
    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}
