'use client'

import { useState, useEffect } from 'react'
import { VideoList } from './video-list'
import { useVideos } from '@/hooks/useVideos'
import { useVideoSelection } from '@/contexts/VideoSelectionContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { processYouTubeUrl } from '@/lib/youtube'
import { triggerVideoDocumentsDeletion } from '@/lib/inngest/triggers'
import { supabase } from '@/lib/supabase/client'
import { KnowledgeBaseHeader } from './knowledge-base-header'
import { KnowledgeBasePreview } from './knowledge-base-preview'
import { KnowledgeBaseUrlInput } from './knowledge-base-url-input'
import { KnowledgeBaseFooter } from './knowledge-base-footer'
import { useVideoPreview } from '@/contexts/VideoPreviewContext'

export const KnowledgeBase = () => {
  const [urlInput, setUrlInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { previewVideo, openPreview, closePreview, registerExpandCallback } = useVideoPreview()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { selectedVideos, addVideo, removeVideo, clearSelection } = useVideoSelection()
  const { toast } = useToast()
  const { user } = useAuth()

  // Use the useVideos hook for real-time data
  const { videos, isLoading, error } = useVideos()

  // Register collapse control callback with context
  useEffect(() => {
    // Register callback to expand knowledge base when opening video from citation
    registerExpandCallback(() => {
      if (isCollapsed) {
        setIsCollapsed(false)
      }
    })
    
    // Cleanup: unregister callback on unmount
    return () => {
      registerExpandCallback(null)
    }
  }, [isCollapsed, registerExpandCallback])

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
    // Use context's openPreview with timestamp 0 (start from beginning)
    openPreview(videoId, 0)
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

  // Handle video deletion
  const handleDeleteVideos = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to delete videos',
        variant: 'destructive',
      })
      return
    }

    if (selectedVideos.size === 0) {
      return
    }

    const videoIds = Array.from(selectedVideos)
    const count = videoIds.length

    setIsDeleting(true)
    
    try {
      // Show loading toast
      toast({
        title: 'Deleting videos...',
        description: `Removing ${count} video${count !== 1 ? 's' : ''} from your knowledge base`,
      })

      // First, update status to PROCESSING for each video to provide UI feedback
      await Promise.all(videoIds.map(async (videoId) => {
        const { error } = await supabase
          .from('videos')
          .update({ status: 'PROCESSING', updatedAt: new Date().toISOString() })
          .eq('id', videoId)
          .eq('userId', user.id)
        
        if (error) {
          console.error('Failed to update status for video:', videoId, error)
        }
      }))

      // Send deletion events to Inngest for each video
      await Promise.all(videoIds.map(videoId => 
        triggerVideoDocumentsDeletion(videoId, user.id).catch(error => {
          console.error('Failed to trigger deletion for video:', videoId, error)
          toast({
            title: 'Error',
            description: `Failed to delete video ${videoId}. Please try again.`,
            variant: 'destructive',
          })
        })
      ))

      // Show success toast
      toast({
        title: 'Success',
        description: `Successfully deleted ${count} video${count !== 1 ? 's' : ''}`,
      })

      // Clear selection
      clearSelection()
    } catch (error) {
      console.error('Deletion failed:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete videos. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
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
      <KnowledgeBaseHeader 
        isCollapsed={isCollapsed} 
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        selectedVideos={selectedVideos}
        onRemove={handleDeleteVideos}
        isDeleting={isDeleting}
        showDialog={showDeleteConfirm}
        onOpenDialog={() => setShowDeleteConfirm(true)}
        onCloseDialog={() => setShowDeleteConfirm(false)}
      />
      
      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* URL Input Form */}
          <KnowledgeBaseUrlInput
            urlInput={urlInput}
            setUrlInput={setUrlInput}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />

          {/* Video Preview Player */}
          {previewVideo && (
            <KnowledgeBasePreview 
              video={{
                youtubeId: previewVideo.youtubeId,
                title: previewVideo.title,
                channelName: previewVideo.channelName
              }}
              timestamp={previewVideo.timestamp}
              onClose={closePreview}
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
          <KnowledgeBaseFooter 
            totalVideos={totalVideos} 
            lastIngestion={lastIngestion} 
          />
        </>
      )}
    </div>
  )
}
