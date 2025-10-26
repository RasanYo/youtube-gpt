'use client'

import { X, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Video as VideoType } from '@/lib/supabase/types'

interface VideoScopeBarProps {
  selectedVideos: Set<string>
  videos: VideoType[]
  onRemoveVideo: (videoId: string) => void
  onClearSelection: () => void
}

export const VideoScopeBar = ({
  selectedVideos,
  videos,
  onRemoveVideo,
  onClearSelection
}: VideoScopeBarProps) => {
  if (selectedVideos.size === 0) return null

  return (
    <div className="border-t bg-muted/30 px-4 py-3">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Search Scope ({selectedVideos.size} video{selectedVideos.size !== 1 ? 's' : ''}):
          </span>
          <Badge variant="outline" className="text-xs">
            Limited to selected videos
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        </div>
        
        <div className="w-full">
          <div className="flex flex-wrap gap-2 pb-2">
            {Array.from(selectedVideos).map((videoId) => {
              const video = videos.find(v => v.id === videoId)
              if (!video) return null
              
              return (
                <Badge
                  key={videoId}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1 text-xs cursor-pointer hover:bg-secondary/80"
                  onClick={() => onRemoveVideo(videoId)}
                >
                  <Video className="h-3 w-3" />
                  <span className="max-w-32 truncate">{video.title}</span>
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

