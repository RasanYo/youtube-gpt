'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'

interface KnowledgeBasePreviewProps {
  video: {
    youtubeId: string
    title: string
    channelName?: string | null
  }
  onClose: () => void
}

export const KnowledgeBasePreview = ({ video, onClose }: KnowledgeBasePreviewProps) => {
  return (
    <div className="border-b p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium leading-tight line-clamp-2">{video.title}</h3>
          {video.channelName && <p className="text-xs text-muted-foreground mt-1">{video.channelName}</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0"
          onClick={onClose}
          title="Close preview"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AspectRatio ratio={16 / 9} className="bg-black rounded-md overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </AspectRatio>
    </div>
  )
}

