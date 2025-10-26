'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { VideoCard, VideoCardSkeleton } from './VideoCard'
import { Video as VideoIcon, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'
import { Video } from '@/lib/supabase/types'

export interface VideoListProps {
  videos: Video[]
  isLoading?: boolean
  onVideoClick?: (videoId: string) => void
  onVideoPreview?: (videoId: string) => void
  onRetry?: (videoId: string) => void
  selectedVideos?: Set<string>
  className?: string
  emptyStateMessage?: string
  emptyStateDescription?: string
}

export const VideoList = ({
  videos,
  isLoading = false,
  onVideoClick,
  onVideoPreview,
  onRetry,
  selectedVideos = new Set(),
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
            <VideoIcon className="h-12 w-12 text-muted-foreground/50" />
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
              key={video.id}
              video={video}
              onClick={onVideoClick}
              onPreview={onVideoPreview}
              onRetry={onRetry}
              isSelected={selectedVideos.has(video.id)}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

// Utility function for sorting videos by date
export const sortVideosByDate = (
  videos: Video[],
  order: 'asc' | 'desc' = 'desc'
): Video[] => {
  return [...videos].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime()
    const dateB = new Date(b.createdAt || 0).getTime()
    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}
