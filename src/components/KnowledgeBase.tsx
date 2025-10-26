'use client'

import { useState } from 'react'
import { FileText, Folder, Video as VideoIcon, Calendar, Loader2, Cloud, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { processYouTubeUrl } from '@/lib/youtube'
import { VideoList } from './VideoList'
import { useVideos } from '@/hooks/useVideos'
import { useVideoSelection } from '@/contexts/VideoSelectionContext'
import { AspectRatio } from '@/components/ui/aspect-ratio'

// Header Component
interface KBHeaderProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  selectedVideos: Set<string>
  onRemove: () => void
  isDeleting: boolean
  showDialog: boolean
  onOpenDialog: () => void
  onCloseDialog: () => void
}

const KBHeader = ({ isCollapsed, onToggleCollapse, selectedVideos, onRemove, isDeleting, showDialog, onOpenDialog, onCloseDialog }: KBHeaderProps) => {
  const selectedCount = selectedVideos.size
  
  return (
    <div className="flex h-14 items-center border-b px-4">
      {!isCollapsed ? (
        <>
          <h2 className="text-sm font-semibold">Knowledge Base</h2>
          <div className="flex items-center gap-2 ml-auto">
            <AlertDialog open={showDialog} onOpenChange={onCloseDialog}>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onOpenDialog}
                disabled={selectedCount === 0 || isDeleting}
                className={selectedCount > 0 ? "text-red-600 hover:bg-red-100 hover:text-red-700" : ""}
                title={selectedCount > 0 ? `Delete ${selectedCount} video${selectedCount !== 1 ? 's' : ''}` : "Select videos to delete"}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedCount} video{selectedCount !== 1 ? 's' : ''}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The videos will be permanently removed from your knowledge base.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => {
                      onRemove()
                      onCloseDialog()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm">
              <Folder className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onToggleCollapse}
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
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Video Preview Component
interface KBVideoPreviewProps {
  video: { youtubeId: string; title: string; channelName?: string | null }
  onClose: () => void
}

const KBVideoPreview = ({ video, onClose }: KBVideoPreviewProps) => {
  return (
    <div className="border-b p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium leading-tight line-clamp-2">
            {video.title}
          </h3>
          {video.channelName && (
            <p className="text-xs text-muted-foreground mt-1">
              {video.channelName}
            </p>
          )}
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

// URL Input Form Component
interface KBUrlInputProps {
  urlInput: string
  setUrlInput: (value: string) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

const KBUrlInput = ({ urlInput, setUrlInput, isSubmitting, onSubmit }: KBUrlInputProps) => {
  return (
    <div className="border-b">
      <form onSubmit={onSubmit} className="p-4">
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
  )
}

// Footer Component
interface KBFooterProps {
  totalVideos: number
  lastIngestion: string
}

const KBFooter = ({ totalVideos, lastIngestion }: KBFooterProps) => {
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

export const KnowledgeBase = () => {
  const [urlInput, setUrlInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [previewingVideo, setPreviewingVideo] = useState<{ youtubeId: string; title: string; channelName?: string | null } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { selectedVideos, addVideo, removeVideo, clearSelection } = useVideoSelection()
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

  // Handle video click for selection
  const handleVideoClick = (videoId: string) => {
    if (selectedVideos.has(videoId)) {
      removeVideo(videoId)
    } else {
      addVideo(videoId)
    }
  }

  // Handle video preview - separate from selection
  const handleVideoPreview = (videoId: string) => {
    const video = videos.find(v => v.id === videoId)
    if (video && video.youtubeId) {
      setPreviewingVideo({
        youtubeId: video.youtubeId,
        title: video.title || 'Video',
        channelName: video.channelName
      })
    }
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
      <KBHeader 
        isCollapsed={isCollapsed} 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        selectedVideos={selectedVideos}
        onRemove={() => {
          // TODO: Implement delete handler
          console.log('Remove selection clicked')
        }}
        isDeleting={isDeleting}
        showDialog={showDeleteConfirm}
        onOpenDialog={() => setShowDeleteConfirm(true)}
        onCloseDialog={() => setShowDeleteConfirm(false)}
      />
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* URL Input Form */}
          <KBUrlInput
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />

          {/* Video Preview Player */}
          {previewingVideo && (
            <KBVideoPreview 
              video={previewingVideo} 
              onClose={() => setPreviewingVideo(null)} 
            />
          )}
          
          {/* Video List */}
          <VideoList
            videos={videos}
            onVideoClick={handleVideoClick}
            onVideoPreview={handleVideoPreview}
            onRetry={handleVideoRetry}
            isLoading={isLoading}
            selectedVideos={selectedVideos}
          />

          {/* Footer with Metrics */}
          <KBFooter 
            totalVideos={totalVideos} 
            lastIngestion={lastIngestion} 
          />
        </>
      )}
    </div>
  )
}
