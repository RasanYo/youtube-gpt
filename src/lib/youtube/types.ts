export interface VideoMetadata {
  id: string
  title: string
  description: string
  duration: number
  durationFormatted: string
  thumbnail: string
  channel: {
    id: string
    name: string
    url: string
  }
  views: number
  uploadedAt: string
  url: string
}

export interface ChannelMetadata {
  id: string
  name: string
  url: string
  icon: string
  subscribers: string
  verified: boolean
}

export interface YouTubeProcessResult {
  success: boolean
  data?: VideoMetadata | ChannelMetadata
  error?: string
  type:
    | 'video'
    | 'channel'
    | 'playlist'
    | 'invalid'
    | 'auth_required'
    | 'auth_error'
    | 'processing_error'
}
