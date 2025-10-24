import { triggerVideoProcessing } from '@/lib/inngest/triggers'
import { inngest } from '@/lib/inngest/client'
import type { Video } from '@/lib/supabase/types'

// Mock Inngest client
jest.mock('@/lib/inngest/client', () => ({
  inngest: {
    send: jest.fn()
  }
}))

// Mock console methods
jest.mock('console', () => ({
  log: jest.fn(),
  error: jest.fn()
}))

describe('triggerVideoProcessing', () => {
  const mockVideo: Video = {
    id: 'test-video-id',
    userId: 'test-user-id',
    youtubeId: 'A2yW_J6kwgM',
    title: 'Test Video',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    channelName: 'Test Channel',
    duration: 300,
    status: 'QUEUED',
    error: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock to resolve by default
    ;(inngest.send as jest.Mock).mockResolvedValue(undefined)
  })

  it('should send correct event to Inngest', async () => {
    await triggerVideoProcessing(mockVideo)

    expect(inngest.send).toHaveBeenCalledWith({
      name: 'video.transcript.processing.requested',
      data: {
        video: mockVideo
      }
    })
  })

  it('should log the trigger action', async () => {
    const consoleSpy = jest.spyOn(console, 'log')

    await triggerVideoProcessing(mockVideo)

    expect(consoleSpy).toHaveBeenCalledWith(
      `[triggerVideoProcessing] Triggering processing for video: ${mockVideo.id}`
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      `[triggerVideoProcessing] Event sent for video: ${mockVideo.id}`
    )
  })

  it('should handle Inngest send errors', async () => {
    const error = new Error('Inngest send failed')
    ;(inngest.send as jest.Mock).mockRejectedValue(error)

    await expect(triggerVideoProcessing(mockVideo)).rejects.toThrow('Inngest send failed')
  })

  it('should work with different video statuses', async () => {
    const videosWithDifferentStatuses: Video[] = [
      { ...mockVideo, status: 'PENDING' },
      { ...mockVideo, status: 'QUEUED' },
      { ...mockVideo, status: 'PROCESSING' },
      { ...mockVideo, status: 'TRANSCRIPT_EXTRACTING' },
      { ...mockVideo, status: 'READY' },
      { ...mockVideo, status: 'FAILED' }
    ]

    for (const video of videosWithDifferentStatuses) {
      await triggerVideoProcessing(video)

      expect(inngest.send).toHaveBeenCalledWith({
        name: 'video.transcript.processing.requested',
        data: {
          video
        }
      })
    }
  })

  it('should work with videos that have errors', async () => {
    const videoWithError: Video = {
      ...mockVideo,
      status: 'FAILED',
      error: 'Previous processing failed'
    }

    await triggerVideoProcessing(videoWithError)

    expect(inngest.send).toHaveBeenCalledWith({
      name: 'video.transcript.processing.requested',
      data: {
        video: videoWithError
      }
    })
  })

  it('should work with videos that have null error', async () => {
    const videoWithNullError: Video = {
      ...mockVideo,
      error: null
    }

    await triggerVideoProcessing(videoWithNullError)

    expect(inngest.send).toHaveBeenCalledWith({
      name: 'video.transcript.processing.requested',
      data: {
        video: videoWithNullError
      }
    })
  })

  it('should preserve all video properties', async () => {
    const complexVideo: Video = {
      id: 'complex-video-id',
      userId: 'complex-user-id',
      youtubeId: 'dQw4w9WgXcQ',
      title: 'Complex Video with Special Characters: !@#$%^&*()',
      thumbnailUrl: 'https://example.com/complex-thumb.jpg?param=value',
      channelName: 'Complex Channel Name',
      duration: 12345,
      status: 'QUEUED',
      error: null,
      createdAt: '2025-01-01T12:34:56.789Z',
      updatedAt: '2025-01-01T12:34:56.789Z'
    }

    await triggerVideoProcessing(complexVideo)

    expect(inngest.send).toHaveBeenCalledWith({
      name: 'video.transcript.processing.requested',
      data: {
        video: complexVideo
      }
    })
  })
})
