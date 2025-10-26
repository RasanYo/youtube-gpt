'use client'

import { Video, Clock } from 'lucide-react'

interface VideoReferenceCardProps {
  videoTitle: string
  timestamp: string
}

export const VideoReferenceCard = ({ videoTitle, timestamp }: VideoReferenceCardProps) => {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-background hover:bg-accent/50 transition-colors">
      <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{videoTitle}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>{timestamp}</span>
      </div>
    </div>
  )
}

