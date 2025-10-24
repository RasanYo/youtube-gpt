import { triggerVideoProcessing } from '@/lib/inngest/triggers'
import { processVideo } from '@/lib/inngest/functions/process-video'
import { supabase } from '@/lib/supabase/client'
import { fetchTranscript } from 'youtube-transcript-plus'
import type { Video } from '@/lib/supabase/types'

// Mock dependencies for integration testing
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ error: null }))
        }))
      }))
    }))
  }
}))

jest.mock('youtube-transcript-plus', () => ({
  fetchTranscript: jest.fn(),
  YoutubeTranscriptDisabledError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'YoutubeTranscriptDisabledError'
    }
  },
  YoutubeTranscriptNotAvailableError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'YoutubeTranscriptNotAvailableError'
    }
  },
  YoutubeTranscriptVideoUnavailableError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'YoutubeTranscriptVideoUnavailableError'
    }
  },
  YoutubeTranscriptTooManyRequestError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'YoutubeTranscriptTooManyRequestError'
    }
  },
  YoutubeTranscriptInvalidVideoIdError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'YoutubeTranscriptInvalidVideoIdError'
    }
  }
}))

// Mock Inngest
jest.mock('@/lib/inngest/client', () => ({
  inngest: {
    createFunction: jest.fn((config, event, handler) => ({
      id: config.id,
      name: config.name,
      retries: config.retries,
      timeouts: config.timeouts,
      event: event.event,
      handler
    })),
    send: jest.fn()
  }
}))

describe('Video Processing Integration Tests', () => {
  const mockVideo: Video = {
    id: 'integration-test-video-id',
    userId: 'integration-test-user-id',
    youtubeId: 'A2yW_J6kwgM',
    title: 'Integration Test Video',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    channelName: 'Integration Test Channel',
    duration: 300,
    status: 'QUEUED',
    error: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z'
  }

  const mockTranscript = [
    {
      text: 'Welcome to this integration test video',
      duration: 3.5,
      offset: 0,
      lang: 'en'
    },
    {
      text: 'We are testing the complete video processing pipeline',
      duration: 4.2,
      offset: 3.5,
      lang: 'en'
    },
    {
      text: 'This includes transcript extraction and validation',
      duration: 3.8,
      offset: 7.7,
      lang: 'en'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('End-to-End Video Processing Flow', () => {
    it('should process video from QUEUED to READY status successfully', async () => {
      // Mock successful transcript extraction
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      // Mock step function that tracks all steps
      const stepCalls: Array<{ stepName: string; success: boolean; error?: string }> = []
      const mockStep = jest.fn().mockImplementation(async (stepName, stepFn) => {
        try {
          const result = await stepFn()
          stepCalls.push({ stepName, success: true })
          return result
        } catch (error) {
          stepCalls.push({ 
            stepName, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          throw error
        }
      })

      const event = {
        data: { video: mockVideo }
      }

      // Test the complete flow
      await processVideo.handler({ event, step: mockStep })

      // Verify all expected steps were called
      expect(stepCalls).toHaveLength(4)
      expect(stepCalls[0].stepName).toBe('update-status-to-processing')
      expect(stepCalls[0].success).toBe(true)
      expect(stepCalls[1].stepName).toBe('update-status-to-transcript-extracting')
      expect(stepCalls[1].success).toBe(true)
      expect(stepCalls[2].stepName).toBe('extract-transcript')
      expect(stepCalls[2].success).toBe(true)
      expect(stepCalls[3].stepName).toBe('update-status-to-ready')
      expect(stepCalls[3].success).toBe(true)

      // Verify transcript extraction was called with correct parameters
      expect(fetchTranscript).toHaveBeenCalledWith('A2yW_J6kwgM', {
        lang: 'en',
        cacheTTL: 3600
      })

      // Verify database updates were called
      expect(supabase.from).toHaveBeenCalledWith('videos')
    })

    it('should handle transcript extraction failure and update status to FAILED', async () => {
      const { YoutubeTranscriptDisabledError } = await import('youtube-transcript-plus')
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new YoutubeTranscriptDisabledError('Captions disabled'))

      const stepCalls: Array<{ stepName: string; success: boolean; error?: string }> = []
      const mockStep = jest.fn().mockImplementation(async (stepName, stepFn) => {
        try {
          const result = await stepFn()
          stepCalls.push({ stepName, success: true })
          return result
        } catch (error) {
          stepCalls.push({ 
            stepName, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          throw error
        }
      })

      const event = {
        data: { video: mockVideo }
      }

      // Test should throw error
      await expect(processVideo.handler({ event, step: mockStep })).rejects.toThrow()

      // Verify steps were called up to the failure point
      expect(stepCalls.length).toBeGreaterThanOrEqual(3)
      expect(stepCalls[0].stepName).toBe('update-status-to-processing')
      expect(stepCalls[0].success).toBe(true)
      expect(stepCalls[1].stepName).toBe('update-status-to-transcript-extracting')
      expect(stepCalls[1].success).toBe(true)
      expect(stepCalls[2].stepName).toBe('extract-transcript')
      expect(stepCalls[2].success).toBe(false)
    })

    it('should validate transcript quality and reject poor quality transcripts', async () => {
      // Mock a poor quality transcript (too short)
      const poorQualityTranscript = [
        {
          text: 'Hi',
          duration: 1,
          offset: 0,
          lang: 'en'
        }
      ]
      ;(fetchTranscript as jest.Mock).mockResolvedValue(poorQualityTranscript)

      const stepCalls: Array<{ stepName: string; success: boolean; error?: string }> = []
      const mockStep = jest.fn().mockImplementation(async (stepName, stepFn) => {
        try {
          const result = await stepFn()
          stepCalls.push({ stepName, success: true })
          return result
        } catch (error) {
          stepCalls.push({ 
            stepName, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          throw error
        }
      })

      const event = {
        data: { video: mockVideo }
      }

      // Test should throw error due to poor quality
      await expect(processVideo.handler({ event, step: mockStep })).rejects.toThrow(
        'Transcript too short'
      )

      // Verify transcript extraction was attempted
      expect(stepCalls.some(call => call.stepName === 'extract-transcript')).toBe(true)
    })
  })

  describe('Trigger Integration', () => {
    it('should trigger video processing with correct event structure', async () => {
      const { inngest } = await import('@/lib/inngest/client')
      
      await triggerVideoProcessing(mockVideo)

      expect(inngest.send).toHaveBeenCalledWith({
        name: 'video.transcript.processing.requested',
        data: {
          video: mockVideo
        }
      })
    })

    it('should handle trigger errors gracefully', async () => {
      const { inngest } = await import('@/lib/inngest/client')
      const error = new Error('Inngest connection failed')
      ;(inngest.send as jest.Mock).mockRejectedValue(error)

      await expect(triggerVideoProcessing(mockVideo)).rejects.toThrow('Inngest connection failed')
    })
  })

  describe('Database Integration', () => {
    it('should update video status through all processing stages', async () => {
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      const mockStep = jest.fn().mockImplementation(async (stepName, stepFn) => {
        return await stepFn()
      })

      const event = {
        data: { video: mockVideo }
      }

      await processVideo.handler({ event, step: mockStep })

      // Verify database was called for each status update
      expect(supabase.from).toHaveBeenCalledWith('videos')
      expect(supabase.from().update).toHaveBeenCalledTimes(4) // PROCESSING, TRANSCRIPT_EXTRACTING, READY, plus any internal calls
    })

    it('should handle database errors during status updates', async () => {
      // Mock database error
      const mockSupabase = {
        from: jest.fn(() => ({
          update: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ error: { message: 'Database connection failed' } }))
            }))
          }))
        }))
      }

      // Replace the mock
      jest.doMock('@/lib/supabase/client', () => ({
        supabase: mockSupabase
      }))

      const mockStep = jest.fn().mockImplementation(async (stepName, stepFn) => {
        return await stepFn()
      })

      const event = {
        data: { video: mockVideo }
      }

      await expect(processVideo.handler({ event, step: mockStep })).rejects.toThrow(
        'Database connection failed'
      )
    })
  })

  describe('Error Recovery and Retry Logic', () => {
    it('should handle transient network errors', async () => {
      // Mock a transient error that succeeds on retry
      let callCount = 0
      ;(fetchTranscript as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          throw new Error('Network timeout')
        }
        return Promise.resolve(mockTranscript)
      })

      const mockStep = jest.fn().mockImplementation(async (stepName, stepFn) => {
        return await stepFn()
      })

      const event = {
        data: { video: mockVideo }
      }

      // This test demonstrates that the function would fail on first attempt
      // In a real scenario, Inngest would retry based on the retry configuration
      await expect(processVideo.handler({ event, step: mockStep })).rejects.toThrow('Network timeout')
    })

    it('should handle different types of YouTube errors appropriately', async () => {
      const errorTypes = [
        { error: 'YoutubeTranscriptDisabledError', expectedMessage: 'Captions are disabled' },
        { error: 'YoutubeTranscriptNotAvailableError', expectedMessage: 'No transcript available' },
        { error: 'YoutubeTranscriptVideoUnavailableError', expectedMessage: 'Video is unavailable' },
        { error: 'YoutubeTranscriptTooManyRequestError', expectedMessage: 'Too many requests' },
        { error: 'YoutubeTranscriptInvalidVideoIdError', expectedMessage: 'Invalid YouTube video ID' }
      ]

      for (const { error, expectedMessage } of errorTypes) {
        const { [error]: ErrorClass } = await import('youtube-transcript-plus')
        ;(fetchTranscript as jest.Mock).mockRejectedValue(new ErrorClass('Test error'))

        const mockStep = jest.fn().mockImplementation(async (stepName, stepFn) => {
          return await stepFn()
        })

        const event = {
          data: { video: mockVideo }
        }

        await expect(processVideo.handler({ event, step: mockStep })).rejects.toThrow(expectedMessage)
      }
    })
  })
})
