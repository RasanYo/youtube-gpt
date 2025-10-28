/**
 * VideosContext
 * 
 * Manages videos state and Supabase real-time subscription for all video data.
 * Provides a single source of truth for videos across the application, ensuring
 * only ONE Supabase subscription exists at any time.
 * 
 * @module VideosContext
 */

'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Video } from '@/lib/supabase/types'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Type definition for the videos context value
 */
interface VideosContextType {
  /** Array of videos for the current user */
  videos: Video[]
  /** Loading state for initial fetch */
  isLoading: boolean
  /** Error message if fetch fails */
  error: string | null
  /** Function to manually refetch videos */
  refetch: () => Promise<void>
}

const VideosContext = createContext<VideosContextType | undefined>(undefined)

/**
 * Custom hook to access the videos context
 * 
 * Must be used within a VideosProvider component tree.
 * Provides access to videos data and loading states.
 * 
 * @throws {Error} If used outside of VideosProvider
 * @returns {VideosContextType} The videos context value
 */
export const useVideos = () => {
  const context = useContext(VideosContext)
  if (context === undefined) {
    throw new Error('useVideos must be used within a VideosProvider')
  }
  return context
}

interface VideosProviderProps {
  children: ReactNode
}

/**
 * VideosProvider component
 * 
 * Provides video data and real-time updates to child components.
 * Maintains a single Supabase subscription for video changes.
 * 
 * The provider fetches videos on mount and subscribes to postgres changes
 * for real-time updates (INSERT, UPDATE, DELETE operations).
 * 
 * @param {VideosProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the context
 */
export const VideosProvider = ({ children }: VideosProviderProps) => {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Track subscription to prevent multiple subscriptions
  const subscriptionRef = useRef<boolean>(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  /**
   * Fetch videos from Supabase
   * Queries all videos for the current user, ordered by creation date (newest first)
   */
  const fetchVideos = useCallback(async () => {
    if (!user?.id) {
      console.log('[VideosContext] No user ID, skipping fetch')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
      
      if (fetchError) throw fetchError
      
      // Transform snake_case to camelCase for consistency
      const transformedData = (data || []).map(video => ({
        id: video.id,
        youtubeId: video.youtubeId,
        title: video.title,
        channelName: video.channelName,
        thumbnailUrl: video.thumbnailUrl,
        status: video.status,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        duration: video.duration,
        error: video.error,
        userId: video.userId,
        zeroentropyCollectionId: video.zeroentropyCollectionId,
      })) as Video[]
      
      setVideos(transformedData)
    } catch (err) {
      console.error('[VideosContext] Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch videos')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  // Set up subscription and fetch initial data
  useEffect(() => {
    if (!user?.id) {
      console.log('[VideosContext] No user ID, clearing videos')
      setVideos([])
      setIsLoading(false)
      return
    }

    // Check if subscription already exists
    if (subscriptionRef.current) {
      console.log('[VideosContext] Subscription already exists, skipping...')
      return
    }

    // Initial fetch
    fetchVideos()
    
    subscriptionRef.current = true
    
    // Create unique channel name for this user
    const channelName = `video-changes-${user.id}-${Date.now()}`
    
    // Set up real-time subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          console.log('[VideosContext] Video change detected:', payload.eventType)
          // Handle INSERT: add new video to the beginning of the array
          if (payload.eventType === 'INSERT') {
            const newVideo = payload.new as Video
            setVideos((prev) => [newVideo, ...prev])
          }
          
          // Handle UPDATE: replace video in array
          console.log('payload.new', payload.new)
          if (payload.eventType === 'UPDATE') {
            const updatedVideo = payload.new as Video
            setVideos((prev) =>
              prev.map((v) => (v.id === payload.new.id ? updatedVideo : v))
            )
          }
          
          // Handle DELETE: remove video from array
          if (payload.eventType === 'DELETE') {
            console.log("DELETE", payload.old)
            setVideos((prev) => prev.filter((v) => v.id !== payload.old.id))
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[VideosContext] Successfully subscribed to video changes')
          channelRef.current = channel
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[VideosContext] Error subscribing to video changes', {
            status,
            channelName,
            userId: user.id,
            error: err
          })
          setError('Failed to connect to real-time updates')
        } else if (status === 'TIMED_OUT') {
          console.warn('[VideosContext] Subscription timed out', {
            channelName,
            userId: user.id
          })
          setError('Connection to real-time updates timed out')
        } else if (status === 'CLOSED') {
          console.warn('[VideosContext] Subscription closed', {
            channelName,
            userId: user.id
          })
        }
      })

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('[VideosContext] Cleaning up subscription')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      subscriptionRef.current = false
    }
  }, [user?.id, fetchVideos])

  /**
   * Refetch videos manually
   * Can be called from consumer components to refresh the data
   */
  const refetch = useCallback(async () => {
    if (!user?.id) {
      console.log('[VideosContext] No user ID for refetch')
      return
    }
    
    await fetchVideos()
  }, [user?.id, fetchVideos])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = {
    videos,
    isLoading,
    error,
    refetch
  }

  return (
    <VideosContext.Provider value={contextValue}>
      {children}
    </VideosContext.Provider>
  )
}
