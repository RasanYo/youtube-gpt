'use client'

import { useState } from 'react'
import { FileText, Folder, Video as VideoIcon, Calendar, Loader2, Cloud, ChevronLeft, ChevronRight } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { processYouTubeUrl } from '@/lib/youtube'
import { VideoList } from './VideoList'
import { useVideos } from '@/hooks/useVideos'

export const KnowledgeBase = () => {
  const [urlInput, setUrlInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { toast } = useToast()

  // Use the useVideos hook for real-time data
  const { videos, isLoading, error } = useVideos()

  const totalVideos = videos.length
  const lastIngestion = videos.length > 0 
    ? new Date(videos[0].createdAt || '').toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    : 'Never'

  // Handle video click
  const handleVideoClick = (videoId: string) => {
    console.log('Video clicked:', videoId)
    // TODO: Implement video selection logic for chat context
  }

  // Handle video retry
  const handleVideoRetry = (videoId: string) => {
    console.log('Retry video:', videoId)
    // TODO: Implement retry logic for failed videos
    toast({
      title: 'Retry Requested',
      description: `Retrying processing for video ${videoId}`,
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!urlInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube URL',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await processYouTubeUrl(urlInput.trim())
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `YouTube ${result.type} submitted for processing! Video ID: ${result.data?.id}`,
        })
        // Reset form
        setUrlInput('')
      } else {
        // Handle different error types with specific messages
        let errorMessage = result.error || 'Failed to process URL'
        
        if (result.type === 'auth_required') {
          errorMessage = 'Please sign in to add videos to your knowledge base'
        } else if (result.type === 'auth_error') {
          errorMessage = 'Authentication failed. Please sign in and try again'
        } else if (result.type === 'processing_error') {
          errorMessage = 'Failed to queue video for processing. Please try again'
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error processing URL:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={`flex h-screen flex-col border-l bg-card transition-all duration-300 ${
      isCollapsed ? 'w-12' : 'w-[480px]'
    }`}>
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        {!isCollapsed ? (
          <>
            <h2 className="text-sm font-semibold">Knowledge Base</h2>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="ghost" size="sm">
                <Folder className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-center w-full">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* URL Input Form - Moved to top */}
          <div className="border-b">
            <form onSubmit={handleSubmit} className="p-4">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="Paste YouTube video/channel URL"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pr-12"
                />
                <Button 
                  type="submit" 
                  size="sm"
                  className="absolute right-1 top-1 h-8 w-8 p-0" 
                  disabled={isSubmitting || !urlInput.trim()}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Cloud className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </div>
          {/* Video List */}
          <VideoList
            videos={videos}
            onVideoClick={handleVideoClick}
            onRetry={handleVideoRetry}
            isLoading={isLoading}
          />

          {/* Footer with Metrics */}
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
        </>
      )}
    </div>
  )
}
