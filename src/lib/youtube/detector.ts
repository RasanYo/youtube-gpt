/**
 * YouTube URL type detector
 * Detects whether a YouTube URL is a video, channel, or playlist
 */

export interface YoutubeUrlInfo {
  type: 'video' | 'channel' | 'unknown'
  id: string | null
}

export function detectYouTubeType(url: string): YoutubeUrlInfo {
  try {
    const urlObject = new URL(url)
    const hostname = urlObject.hostname
    const pathname = urlObject.pathname
    const searchParams = urlObject.searchParams

    // Detecting video URLs
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      // URL case: watch?v=
      if (pathname === '/watch') {
        const videoId = searchParams.get('v')
        if (videoId) {
          return { type: 'video', id: videoId }
        }
      }
      // URL case: shorts/
      if (pathname.startsWith('/shorts/')) {
        const videoId = pathname.substring('/shorts/'.length)
        // Basic validation for shorts ID length (usually 11 characters)
        if (videoId && videoId.length >= 11) {
          // You might want more robust validation here
          return { type: 'video', id: videoId }
        }
      }
      // URL case: embed/ (commonly used for integrations)
      if (pathname.startsWith('/embed/')) {
        const videoId = pathname.substring('/embed/'.length)
        // Basic validation for embed ID length (usually 11 characters)
        if (videoId && videoId.length >= 11) {
          // You might want more robust validation here
          return { type: 'video', id: videoId }
        }
      }
    } else if (hostname === 'youtu.be') {
      // URL case: youtu.be/
      const videoId = pathname.substring(1) // Removes the leading '/'
      // Basic validation for youtu.be ID length (usually 11 characters)
      if (videoId && videoId.length >= 11) {
        // You might want more robust validation here
        return { type: 'video', id: videoId }
      }
    }

    // Detecting channel URLs
    if (hostname === 'www.youtube.com' || hostname === 'youtube.com') {
      const pathnameParts = pathname.split('/').filter((part) => part !== '') // Splits pathname and removes empty parts

      // URL case: /channel/
      if (pathnameParts[0] === 'channel' && pathnameParts.length > 1) {
        const channelId = pathnameParts[1]
        // Basic validation for channel ID (starts with UC)
        if (channelId && channelId.startsWith('UC')) {
          // You might want more robust validation here
          return { type: 'channel', id: channelId }
        }
      }
      // URL case: /user/ (legacy)
      if (pathnameParts[0] === 'user' && pathnameParts.length > 1) {
        const username = pathnameParts[1]
        // For /user/ or /@handle URLs, we cannot get the ID directly.
        // We return the type and name/handle for further API lookup.
        return { type: 'channel', id: username } // Here, the ID is actually the username
      }
      // URL case: /@handle (modern)
      if (
        pathnameParts[0] &&
        pathnameParts[0].startsWith('@') &&
        pathnameParts.length > 0
      ) {
        const handle = pathnameParts[0]
        // For /user/ or /@handle URLs, we cannot get the ID directly.
        // We return the type and name/handle for further API lookup.
        return { type: 'channel', id: handle } // Here, the ID is actually the handle
      }
    }

    // If no known type is detected
    return { type: 'unknown', id: null }
  } catch (error) {
    console.error('Error during URL analysis:', error)
    return { type: 'unknown', id: null }
  }
}
