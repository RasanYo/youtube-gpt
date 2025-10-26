import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Video } from '@/lib/supabase/types'
import { useAuth } from '@/contexts/AuthContext'

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  
  // Track subscription to prevent multiple subscriptions
  const subscriptionRef = useRef<boolean>(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {

    
    if (!user?.id) {
      console.log('[useVideos] No user ID, clearing videos')
      setVideos([])
      setIsLoading(false)
      return
    }

    // Check if subscription already exists
    if (subscriptionRef.current) {
      console.log('[useVideos] Subscription already exists, skipping...')
      return
    }

    // Initial fetch
    const fetchVideos = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
        
        if (error) throw error
        setVideos(data || [])
      } catch (err) {
        console.error('[useVideos] Error fetching videos:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()

    
    subscriptionRef.current = true
    
    const channelName = `video-changes-${user.id}-${Date.now()}`
    
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
          console.log('[useVideos] Video change detected:', payload)
          
          if (payload.eventType === 'INSERT') {
            setVideos((prev) => [payload.new as Video, ...prev])
          }
          if (payload.eventType === 'UPDATE') {
            setVideos((prev) =>
              prev.map((v) => (v.id === payload.new.id ? payload.new as Video : v))
            )
          }
          if (payload.eventType === 'DELETE') {
            setVideos((prev) => prev.filter((v) => v.id !== payload.old.id))
          }
        }
      )
      .subscribe((status, err) => {
        
        if (status === 'SUBSCRIBED') {
          // console.log('[useVideos] Successfully subscribed to video changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useVideos] Error subscribing to video changes', {
            status,
            channelName,
            userId: user.id,
            error: err
          })
          setError('Failed to connect to real-time updates')
        } else if (status === 'TIMED_OUT') {
          console.warn('[useVideos] Subscription timed out', {
            channelName,
            userId: user.id
          })
          setError('Connection to real-time updates timed out')
        } else if (status === 'CLOSED') {
          console.warn('[useVideos] Subscription closed', {
            channelName,
            userId: user.id
          })
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      subscriptionRef.current = false
    }
  }, [user?.id])

  const refetch = async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false })
      
      if (error) throw error
      setVideos(data || [])
    } catch (err) {
      console.error('Error refetching videos:', err)
      setError(err instanceof Error ? err.message : 'Failed to refetch videos')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    videos,
    isLoading,
    error,
    refetch
  }
}
