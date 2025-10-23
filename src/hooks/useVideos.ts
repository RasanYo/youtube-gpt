import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Video } from '@/lib/supabase/types'
import { useAuth } from '@/contexts/AuthContext'

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) {
      setVideos([])
      setIsLoading(false)
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
        console.error('Error fetching videos:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch videos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideos()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('video-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          console.log('Video change detected:', payload)
          
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
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to video changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to video changes')
          setError('Failed to connect to real-time updates')
        }
      })

    return () => {
      supabase.removeChannel(channel)
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
