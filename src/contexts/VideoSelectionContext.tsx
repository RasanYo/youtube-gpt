/**
 * VideoSelectionContext
 * 
 * Manages the selection state of videos in the Knowledge Base for scope-aware chat.
 * Videos can be selected individually or in bulk, and the selection determines which
 * videos are used as context when sending messages to the AI assistant.
 * 
 * @module VideoSelectionContext
 */

'use client'

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'

/**
 * Type definition for the video selection context value
 */
interface VideoSelectionContextType {
  /** Set containing IDs of currently selected videos */
  selectedVideos: Set<string>
  /** Direct setter for replacing the entire selection */
  setSelectedVideos: (videos: Set<string>) => void
  /** Add a single video to the selection */
  addVideo: (videoId: string) => void
  /** Remove a single video from the selection */
  removeVideo: (videoId: string) => void
  /** Clear all selected videos */
  clearSelection: () => void
  /** Check if a specific video is currently selected */
  isVideoSelected: (videoId: string) => boolean
}

const VideoSelectionContext = createContext<VideoSelectionContextType | undefined>(undefined)

/**
 * Custom hook to access the video selection context
 * 
 * Must be used within a VideoSelectionProvider component tree.
 * 
 * @throws {Error} If used outside of VideoSelectionProvider
 * @returns {VideoSelectionContextType} The video selection context value
 */
export const useVideoSelection = () => {
  const context = useContext(VideoSelectionContext)
  if (context === undefined) {
    throw new Error('useVideoSelection must be used within a VideoSelectionProvider')
  }
  return context
}

interface VideoSelectionProviderProps {
  children: ReactNode
}

/**
 * VideoSelectionProvider component
 * 
 * Provides video selection state and functions to child components.
 * Maintains a Set of selected video IDs and provides methods to modify the selection.
 * 
 * The context value is memoized to prevent unnecessary re-renders of consumer components.
 * Only the state-modifying functions are wrapped in useCallback for stability.
 * 
 * @param {VideoSelectionProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the context
 */
export const VideoSelectionProvider = ({ children }: VideoSelectionProviderProps) => {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())

  /**
   * Add a video to the selection
   * Creates a new Set with the added video ID to trigger React state updates
   * 
   * @param {string} videoId - The ID of the video to add
   */
  const addVideo = useCallback((videoId: string) => {
    setSelectedVideos(prev => new Set([...prev, videoId]))
  }, [])

  /**
   * Remove a video from the selection
   * Creates a new Set without the specified video ID
   * 
   * @param {string} videoId - The ID of the video to remove
   */
  const removeVideo = useCallback((videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev)
      newSet.delete(videoId)
      return newSet
    })
  }, [])

  /**
   * Clear all selected videos
   * Resets the selection to an empty Set
   */
  const clearSelection = useCallback(() => {
    setSelectedVideos(new Set())
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  // Only re-creates when selectedVideos or memoized functions change
  const contextValue = useMemo(() => {
    /**
     * Check if a video is currently selected
     * Simple getter function that reads from the Set
     * 
     * @param {string} videoId - The ID of the video to check
     * @returns {boolean} True if the video is selected, false otherwise
     */
    const isVideoSelected = (videoId: string): boolean => {
      return selectedVideos.has(videoId)
    }

    return {
      selectedVideos,
      setSelectedVideos,
      addVideo,
      removeVideo,
      clearSelection,
      isVideoSelected
    }
  }, [selectedVideos, addVideo, removeVideo, clearSelection])

  return (
    <VideoSelectionContext.Provider value={contextValue}>
      {children}
    </VideoSelectionContext.Provider>
  )
}
