export interface VideoMetadata {
  id: string
  title: string
  description: string
  duration: number
  thumbnail: string
  channel: {
    id: string
    name: string
    url: string
  }
  url: string
}

export interface ChannelMetadata {
  id: string
  name: string
  url: string
}

export interface YouTubeProcessResult {
  success: boolean
  data?: VideoMetadata | ChannelMetadata
  error?: string
  type: 'video' | 'channel' | 'playlist' | 'invalid'
}
