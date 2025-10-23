import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VideoCard, VideoCardProps, VideoCardSkeleton } from './VideoCard'
import { Video, Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useMemo } from 'react'

export interface VideoItem {
  videoId: string
  title: string
  thumbnailUrl: string
  channel: {
    name: string
    thumbnailUrl?: string
  }
  status: VideoCardProps['status']
  duration?: string
  publishedAt?: string
}

export interface VideoListProps {
  videos: VideoItem[]
  isLoading?: boolean
  onVideoClick?: (videoId: string) => void
  onRetry?: (videoId: string) => void
  className?: string
  emptyStateMessage?: string
  emptyStateDescription?: string
  showSearch?: boolean
  showFilters?: boolean
}

export const VideoList = ({
  videos,
  isLoading = false,
  onVideoClick,
  onRetry,
  className,
  emptyStateMessage = 'No videos yet',
  emptyStateDescription = 'Add videos to build your knowledge base',
  showSearch = false,
  showFilters = false
}: VideoListProps) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VideoCardProps['status'] | 'all'>('all')

  // Filter and search videos
  const filteredVideos = useMemo(() => {
    let filtered = videos

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchVideos(filtered, searchQuery)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filterVideosByStatus(filtered, statusFilter)
    }

    // Sort by date (newest first)
    return sortVideosByDate(filtered, 'desc')
  }, [videos, searchQuery, statusFilter])

  const statusCounts = useMemo(() => {
    const counts = { all: videos.length, queued: 0, processing: 0, ready: 0, failed: 0 }
    videos.forEach(video => {
      counts[video.status]++
    })
    return counts
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
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search and Filter Controls */}
      {(showSearch || showFilters) && (
        <div className="border-b p-4 space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
          
          {showFilters && (
            <div className="flex gap-2 overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: statusCounts.all },
                { key: 'ready', label: 'Ready', count: statusCounts.ready },
                { key: 'processing', label: 'Processing', count: statusCounts.processing },
                { key: 'queued', label: 'Queued', count: statusCounts.queued },
                { key: 'failed', label: 'Failed', count: statusCounts.failed }
              ].map(({ key, label, count }) => (
                <Button
                  key={key}
                  variant={statusFilter === key ? 'default' : 'outline'}
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setStatusFilter(key as VideoCardProps['status'] | 'all')}
                >
                  {label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Filter className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                No videos match your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredVideos.map((video) => (
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
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Filter and search utilities
export const filterVideosByStatus = (
  videos: VideoItem[],
  status: VideoCardProps['status']
): VideoItem[] => {
  return videos.filter(video => video.status === status)
}

export const searchVideos = (
  videos: VideoItem[],
  query: string
): VideoItem[] => {
  if (!query.trim()) return videos
  
  const lowercaseQuery = query.toLowerCase()
  return videos.filter(video => 
    video.title.toLowerCase().includes(lowercaseQuery) ||
    video.channel.name.toLowerCase().includes(lowercaseQuery)
  )
}

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
