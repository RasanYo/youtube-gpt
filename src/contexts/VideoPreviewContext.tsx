'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useVideos } from '@/hooks/useVideos'
import { useToast } from '@/hooks/use-toast'

/**
 * State interface for video preview
 */
export interface VideoPreviewState {
  /** YouTube video ID for iframe embedding */
  youtubeId: string
  /** Display title of the video */
  title: string
  /** Channel name (optional) */
  channelName?: string | null
  /** Timestamp in seconds where video should start */
  timestamp: number
}

/**
 * Context interface for video preview functionality
 */
interface VideoPreviewContextType {
  /** Current preview state (null if no preview) */
  previewVideo: VideoPreviewState | null
  /** Open video preview at specific timestamp */
  openPreview: (videoId: string, timestamp: number) => void
  /** Close the video preview */
  closePreview: () => void
  /** Register a callback to expand knowledge base (called when opening preview from collapsed state) */
  registerExpandCallback: (callback: (() => void) | null) => void
}

const VideoPreviewContext = createContext<VideoPreviewContextType | undefined>(undefined)

/**
 * Video Preview Context Provider
 * 
 * Manages global state for video preview functionality across the application.
 * Provides methods to open and close video previews with timestamp support.
 * 
 * @example
 * ```tsx
 * <VideoPreviewProvider>
 *   <YourApp />
 * </VideoPreviewProvider>
 * ```
 */
export function VideoPreviewProvider({ children }: { children: React.ReactNode }) {
  const [previewVideo, setPreviewVideo] = useState<VideoPreviewState | null>(null)
  const { videos } = useVideos()
  const { toast } = useToast()
  const expandCallbackRef = useRef<(() => void) | null>(null)

  /**
   * Register a callback to expand the knowledge base
   * This allows external components to control knowledge base expansion
   */
  const registerExpandCallback = useCallback((callback: (() => void) | null) => {
    expandCallbackRef.current = callback
  }, [])

  /**
   * Open video preview at a specific timestamp
   * 
   * Looks up the video by database ID and opens it in the preview player.
   * Handles missing videos, invalid timestamps, and edge cases.
   * 
   * @param videoId - Database ID of the video
   * @param timestamp - Start time in seconds (can be decimal like 418.4)
   * 
   * @example
   * ```tsx
   * const { openPreview } = useVideoPreview()
   * openPreview('abc-123', 418.4) // Opens video at 6:58
   * ```
   */
  const openPreview = useCallback((videoId: string, timestamp: number) => {
    // Validate inputs
    if (!videoId || typeof videoId !== 'string') {
      console.error('[VideoPreviewContext] Invalid videoId:', videoId)
      toast({
        title: 'Error',
        description: 'Invalid video reference',
        variant: 'destructive',
      })
      return
    }

    if (typeof timestamp !== 'number' || isNaN(timestamp) || !isFinite(timestamp)) {
      console.error('[VideoPreviewContext] Invalid timestamp:', timestamp)
      toast({
        title: 'Error',
        description: 'Invalid timestamp',
        variant: 'destructive',
      })
      return
    }

    // Clamp timestamp to ensure it's non-negative
    const clampedTimestamp = Math.max(0, timestamp)

    // Find video in the videos array
    const video = videos.find(v => v.id === videoId)

    if (!video) {
      console.error('[VideoPreviewContext] Video not found:', videoId)
      toast({
        title: 'Error',
        description: 'Video not found. It may have been removed.',
        variant: 'destructive',
      })
      return
    }

    if (!video.youtubeId) {
      console.error('[VideoPreviewContext] Video missing youtubeId:', videoId)
      toast({
        title: 'Error',
        description: 'This video is not available for preview.',
        variant: 'destructive',
      })
      return
    }

    // All validations passed, set preview state
    setPreviewVideo({
      youtubeId: video.youtubeId,
      title: video.title || 'Video',
      channelName: video.channelName,
      timestamp: clampedTimestamp,
    })

    // Expand knowledge base if collapsed (call the registered callback)
    if (expandCallbackRef.current) {
      expandCallbackRef.current()
    }
  }, [videos, toast])

  /**
   * Close the video preview
   * 
   * Clears the current preview state, hiding the preview player.
   * 
   * @example
   * ```tsx
   * const { closePreview } = useVideoPreview()
   * closePreview() // Closes the preview
   * ```
   */
  const closePreview = useCallback(() => {
    setPreviewVideo(null)
  }, [])

  const value: VideoPreviewContextType = {
    previewVideo,
    openPreview,
    closePreview,
    registerExpandCallback,
  }

  return (
    <VideoPreviewContext.Provider value={value}>
      {children}
    </VideoPreviewContext.Provider>
  )
}

/**
 * Hook to access video preview functionality
 * 
 * Returns methods to open/close video previews and current preview state.
 * Must be used within a VideoPreviewProvider.
 * 
 * @returns Object containing:
 *   - `previewVideo`: Current preview state (null if no preview)
 *   - `openPreview(videoId, timestamp)`: Open video at timestamp
 *   - `closePreview()`: Close current preview
 *   - `registerExpandCallback(callback)`: Register callback to expand knowledge base
 * 
 * @throws Error if used outside VideoPreviewProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { openPreview, closePreview, previewVideo } = useVideoPreview()
 * 
 *   return (
 *     <button onClick={() => openPreview('abc-123', 418.4)}>
 *       Watch Video
 *     </button>
 *   )
 * }
 * ```
 * 
 * @example Register expand callback
 * ```tsx
 * function KnowledgeBase() {
 *   const { registerExpandCallback } = useVideoPreview()
 *   const [isCollapsed, setIsCollapsed] = useState(false)
 * 
 *   useEffect(() => {
 *     // Register callback to expand knowledge base
 *     registerExpandCallback(() => setIsCollapsed(false))
 *     return () => registerExpandCallback(null) // Cleanup
 *   }, [])
 * }
 * ```
 */
export function useVideoPreview() {
  const context = useContext(VideoPreviewContext)
  if (context === undefined) {
    throw new Error('useVideoPreview must be used within a VideoPreviewProvider')
  }
  return context
}
