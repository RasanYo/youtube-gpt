'use client'

import { Video as VideoIcon, Calendar } from 'lucide-react'

interface KnowledgeBaseFooterProps {
  totalVideos: number
  lastIngestion: string
}

export const KnowledgeBaseFooter = ({ totalVideos, lastIngestion }: KnowledgeBaseFooterProps) => {
  return (
    <div className="border-t">
      <div className="bg-muted/30 px-4 py-3">
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <VideoIcon className="h-3.5 w-3.5" />
              <span>Total videos:</span>
            </div>
            <span className="font-medium text-foreground">{totalVideos}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last ingestion:</span>
            </div>
            <span className="font-medium text-foreground">{lastIngestion}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

