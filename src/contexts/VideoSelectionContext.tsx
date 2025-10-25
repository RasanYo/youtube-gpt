'use client'

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react'

interface VideoSelectionContextType {
  selectedVideos: Set<string>
  setSelectedVideos: (videos: Set<string>) => void
  addVideo: (videoId: string) => void
  removeVideo: (videoId: string) => void
  clearSelection: () => void
  isVideoSelected: (videoId: string) => boolean
}

const VideoSelectionContext = createContext<VideoSelectionContextType | undefined>(undefined)

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

export const VideoSelectionProvider = ({ children }: VideoSelectionProviderProps) => {
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())

  // Memoize functions to prevent unnecessary re-renders
  const addVideo = useCallback((videoId: string) => {
    setSelectedVideos(prev => new Set([...prev, videoId]))
  }, [])

  const removeVideo = useCallback((videoId: string) => {
    setSelectedVideos(prev => {
      const newSet = new Set(prev)
      newSet.delete(videoId)
      return newSet
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedVideos(new Set())
  }, [])

  const isVideoSelected = useCallback((videoId: string) => {
    return selectedVideos.has(videoId)
  }, [selectedVideos])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    selectedVideos,
    setSelectedVideos,
    addVideo,
    removeVideo,
    clearSelection,
    isVideoSelected
  }), [selectedVideos, addVideo, removeVideo, clearSelection, isVideoSelected])

  return (
    <VideoSelectionContext.Provider value={contextValue}>
      {children}
    </VideoSelectionContext.Provider>
  )
}
