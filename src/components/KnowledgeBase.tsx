import { useState } from 'react'
import { FileText, Folder, Video, Calendar, Loader2, Cloud } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { processYouTubeUrl } from '@/lib/youtube'
import { VideoList, VideoItem } from './VideoList'
import { VideoCardProps } from './VideoCard'

export const KnowledgeBase = () => {
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Sample video data for demonstration
  const videos: VideoItem[] = [
    {
      videoId: 'sample-1',
      title: 'How to Build a Full-Stack AI Application with Next.js and Supabase',
      thumbnailUrl: 'https://img.youtube.com/vi/sample1/maxresdefault.jpg',
      channel: {
        name: 'AI Tutorials',
        thumbnailUrl: 'https://img.youtube.com/vi/sample1/maxresdefault.jpg'
      },
      status: 'ready',
      duration: '15:30',
      publishedAt: '2024-01-15T10:00:00Z'
    },
    {
      videoId: 'sample-2',
      title: 'Advanced React Patterns and Best Practices',
      thumbnailUrl: 'https://img.youtube.com/vi/sample2/maxresdefault.jpg',
      channel: {
        name: 'React Masters',
        thumbnailUrl: 'https://img.youtube.com/vi/sample2/maxresdefault.jpg'
      },
      status: 'processing',
      duration: '22:45',
      publishedAt: '2024-01-14T15:30:00Z'
    },
    {
      videoId: 'sample-3',
      title: 'TypeScript Deep Dive: Advanced Types and Generics',
      thumbnailUrl: 'https://img.youtube.com/vi/sample3/maxresdefault.jpg',
      channel: {
        name: 'TypeScript Academy',
        thumbnailUrl: 'https://img.youtube.com/vi/sample3/maxresdefault.jpg'
      },
      status: 'queued',
      publishedAt: '2024-01-13T09:15:00Z'
    },
    {
      videoId: 'sample-4',
      title: 'Database Design Patterns for Scalable Applications',
      thumbnailUrl: 'https://img.youtube.com/vi/sample4/maxresdefault.jpg',
      channel: {
        name: 'Database Experts',
        thumbnailUrl: 'https://img.youtube.com/vi/sample4/maxresdefault.jpg'
      },
      status: 'failed',
      publishedAt: '2024-01-12T14:20:00Z'
    }
  ]

  const totalVideos = videos.length
  const lastIngestion = '2 hours ago'

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

    setIsLoading(true)
    
    try {
      const result = await processYouTubeUrl(urlInput.trim())
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `YouTube ${result.type} queued for processing! Video ID: ${result.data?.id}`,
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
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-[480px] flex-col border-l bg-card">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Knowledge Base</h2>
        <Button variant="ghost" size="sm">
          <Folder className="h-4 w-4" />
        </Button>
      </div>
      {/* URL Input Form - Moved to top */}
      <div className="border-b">
        <form onSubmit={handleSubmit} className="p-4">
          <div className="relative">
            <Input
              type="url"
              placeholder="Paste YouTube video/channel URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isLoading}
              className="w-full pr-12"
            />
            <Button 
              type="submit" 
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0" 
              disabled={isLoading || !urlInput.trim()}
            >
              {isLoading ? (
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
        showSearch={false}
        showFilters={false}
      />

      {/* Footer with Metrics */}
      <div className="border-t">
        <div className="bg-muted/30 px-4 py-3">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Video className="h-3.5 w-3.5" />
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
    </div>
  )
}
