/**
 * YouTube URL type detector
 * Detects whether a YouTube URL is a video, channel, or playlist
 */

export type YouTubeUrlType = 'video' | 'channel' | 'playlist' | 'invalid'

export interface YouTubeUrlInfo {
  type: YouTubeUrlType
  id: string | null
  originalUrl: string
}

/**
 * Detects the type of YouTube URL (video, channel, or playlist)
 * 
 * @param url - The YouTube URL to analyze
 * @returns An object containing the type, id, and original URL
 * 
 * @example
 * detectYouTubeType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // Returns: { type: 'video', id: 'dQw4w9WgXcQ', originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
 * 
 * detectYouTubeType('https://www.youtube.com/@username')
 * // Returns: { type: 'channel', id: '@username', originalUrl: 'https://www.youtube.com/@username' }
 * 
 * detectYouTubeType('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
 * // Returns: { type: 'playlist', id: 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf', originalUrl: 'https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf' }
 */
export function detectYouTubeType(url: string): YouTubeUrlInfo {
  if (!url || typeof url !== 'string') {
    return { type: 'invalid', id: null, originalUrl: url }
  }

  try {
    // Parse the URL
    const cleanedUrl = url.trim()
    const urlObj = new URL(cleanedUrl)
    const hostname = urlObj.hostname.replace('www.', '').replace('m.', '')
    const pathname = urlObj.pathname
    const searchParams = urlObj.searchParams

    // Check if it's a valid YouTube domain
    if (!['youtube.com', 'youtu.be'].includes(hostname)) {
      return { type: 'invalid', id: null, originalUrl: cleanedUrl }
    }

    // Check for playlist in query parameters (takes precedence)
    // Note: A URL can have both video and playlist, but if list= is present, it's primarily a playlist
    const playlistId = searchParams.get('list')
    if (playlistId && !pathname.includes('/embed')) {
      // Exclude "RD" (radio/mix) and "UL" (uploads) auto-generated playlists
      // These are typically treated as video contexts rather than user playlists
      if (!playlistId.startsWith('RD') && !playlistId.startsWith('UL')) {
        return { type: 'playlist', id: playlistId, originalUrl: cleanedUrl }
      }
    }

    // Check for explicit playlist path
    if (pathname.startsWith('/playlist')) {
      const listId = searchParams.get('list')
      return { type: 'playlist', id: listId || null, originalUrl: cleanedUrl }
    }

    // Check for video patterns
    // Pattern 1: /watch?v=VIDEO_ID
    if (pathname === '/watch' || pathname.startsWith('/watch')) {
      const videoId = searchParams.get('v')
      if (videoId) {
        return { type: 'video', id: videoId, originalUrl: cleanedUrl }
      }
    }

    // Pattern 2: youtu.be/VIDEO_ID (short URL)
    if (hostname === 'youtu.be') {
      const videoId = pathname.substring(1).split('?')[0]
      if (videoId) {
        return { type: 'video', id: videoId, originalUrl: cleanedUrl }
      }
    }

    // Pattern 3: /embed/VIDEO_ID
    if (pathname.startsWith('/embed/')) {
      const videoId = pathname.substring(7).split('?')[0]
      if (videoId) {
        return { type: 'video', id: videoId, originalUrl: cleanedUrl }
      }
    }

    // Pattern 4: /v/VIDEO_ID (old format)
    if (pathname.startsWith('/v/')) {
      const videoId = pathname.substring(3).split('?')[0]
      if (videoId) {
        return { type: 'video', id: videoId, originalUrl: cleanedUrl }
      }
    }

    // Pattern 5: /shorts/VIDEO_ID (YouTube Shorts)
    if (pathname.startsWith('/shorts/')) {
      const videoId = pathname.substring(8).split('?')[0]
      if (videoId) {
        return { type: 'video', id: videoId, originalUrl: cleanedUrl }
      }
    }

    // Check for channel patterns
    // Pattern 1: /channel/CHANNEL_ID
    if (pathname.startsWith('/channel/')) {
      const channelId = pathname.substring(9).split('/')[0]
      return { type: 'channel', id: channelId, originalUrl: cleanedUrl }
    }

    // Pattern 2: /c/CUSTOM_NAME
    if (pathname.startsWith('/c/')) {
      const customName = pathname.substring(3).split('/')[0]
      return { type: 'channel', id: customName, originalUrl: cleanedUrl }
    }

    // Pattern 3: /@USERNAME (handle format)
    if (pathname.startsWith('/@')) {
      const username = pathname.substring(1).split('/')[0]
      return { type: 'channel', id: username, originalUrl: cleanedUrl }
    }

    // Pattern 4: /user/USERNAME
    if (pathname.startsWith('/user/')) {
      const username = pathname.substring(6).split('/')[0]
      return { type: 'channel', id: username, originalUrl: cleanedUrl }
    }

    // If no pattern matches, return invalid
    return { type: 'invalid', id: null, originalUrl: cleanedUrl }

  } catch (error) {
    // If URL parsing fails, return invalid
    return { type: 'invalid', id: null, originalUrl: url }
  }
}
