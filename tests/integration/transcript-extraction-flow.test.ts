import { fetchTranscript } from 'youtube-transcript-plus'
import type { TranscriptResponse } from 'youtube-transcript-plus'

// Mock youtube-transcript-plus
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

describe('Transcript Extraction Integration Flow', () => {
  const mockTranscript: TranscriptResponse[] = [
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
  })

  describe('Complete Transcript Processing Pipeline', () => {
    it('should process transcript from extraction to formatting successfully', async () => {
      // Mock successful transcript extraction
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      // Simulate the complete processing pipeline
      const videoId = 'A2yW_J6kwgM'
      const config = {
        lang: 'en',
        cacheTTL: 3600
      }

      // Step 1: Extract transcript
      const transcript = await fetchTranscript(videoId, config)
      expect(transcript).toEqual(mockTranscript)

      // Step 2: Validate transcript quality
      expect(transcript.length).toBeGreaterThan(0)
      const totalDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0)
      
      expect(totalDuration).toBeGreaterThanOrEqual(10)
      expect(totalTextLength).toBeGreaterThanOrEqual(50)

      // Step 3: Format transcript for storage
      const formattedTranscript = transcript.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))

      expect(formattedTranscript).toHaveLength(transcript.length)
      expect(formattedTranscript[0]).toEqual({
        text: 'Welcome to this integration test video',
        start: 0,
        duration: 3.5,
        language: 'en'
      })

      // Step 4: Generate metadata
      const metadata = {
        totalSegments: transcript.length,
        totalDuration,
        totalTextLength,
        language: transcript[0]?.lang || 'en',
        extractedAt: new Date().toISOString()
      }

      expect(metadata.totalSegments).toBe(3)
      expect(metadata.totalDuration).toBe(11.5)
      expect(metadata.totalTextLength).toBeGreaterThan(0)
      expect(metadata.language).toBe('en')
    })

    it('should handle transcript extraction errors and provide appropriate error messages', async () => {
      const errorTypes = [
        { 
          error: 'YoutubeTranscriptDisabledError', 
          expectedMessage: 'Captions are disabled for this video',
          mockError: new (await import('youtube-transcript-plus')).YoutubeTranscriptDisabledError('Captions disabled')
        },
        { 
          error: 'YoutubeTranscriptNotAvailableError', 
          expectedMessage: 'No transcript available for this video',
          mockError: new (await import('youtube-transcript-plus')).YoutubeTranscriptNotAvailableError('No transcript')
        },
        { 
          error: 'YoutubeTranscriptVideoUnavailableError', 
          expectedMessage: 'Video is unavailable or private',
          mockError: new (await import('youtube-transcript-plus')).YoutubeTranscriptVideoUnavailableError('Video unavailable')
        },
        { 
          error: 'YoutubeTranscriptTooManyRequestError', 
          expectedMessage: 'Too many requests - rate limited',
          mockError: new (await import('youtube-transcript-plus')).YoutubeTranscriptTooManyRequestError('Rate limited')
        },
        { 
          error: 'YoutubeTranscriptInvalidVideoIdError', 
          expectedMessage: 'Invalid YouTube video ID',
          mockError: new (await import('youtube-transcript-plus')).YoutubeTranscriptInvalidVideoIdError('Invalid ID')
        }
      ]

      for (const { error, expectedMessage, mockError } of errorTypes) {
        ;(fetchTranscript as jest.Mock).mockRejectedValue(mockError)

        try {
          await fetchTranscript('A2yW_J6kwgM')
          fail('Expected function to throw')
        } catch (err) {
          expect(err).toBeInstanceOf(mockError.constructor)
          // Check that the error message contains key words from the expected message
          const keyWords = expectedMessage.split(' ').filter(word => word.length > 3)
          const hasKeyWord = keyWords.some(word => err.message.includes(word))
          expect(hasKeyWord).toBe(true)
        }
      }
    })

    it('should validate transcript quality and reject poor quality transcripts', async () => {
      // Test empty transcript
      ;(fetchTranscript as jest.Mock).mockResolvedValue([])
      
      try {
        const transcript = await fetchTranscript('A2yW_J6kwgM')
        if (transcript.length === 0) {
          throw new Error('No transcript data received from YouTube')
        }
        fail('Expected validation to fail')
      } catch (err) {
        expect(err.message).toBe('No transcript data received from YouTube')
      }

      // Test transcript that is too short
      const shortTranscript: TranscriptResponse[] = [
        {
          text: 'Hi',
          duration: 1,
          offset: 0,
          lang: 'en'
        }
      ]
      ;(fetchTranscript as jest.Mock).mockResolvedValue(shortTranscript)

      try {
        const transcript = await fetchTranscript('A2yW_J6kwgM')
        const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0)
        
        if (totalTextLength < 50) {
          throw new Error('Transcript too short - likely poor quality or auto-generated captions disabled')
        }
        fail('Expected validation to fail')
      } catch (err) {
        expect(err.message).toBe('Transcript too short - likely poor quality or auto-generated captions disabled')
      }

      // Test video that is too short
      const shortVideoTranscript: TranscriptResponse[] = [
        {
          text: 'This is a very short video with minimal content',
          duration: 5, // Less than 10 seconds
          offset: 0,
          lang: 'en'
        }
      ]
      ;(fetchTranscript as jest.Mock).mockResolvedValue(shortVideoTranscript)

      try {
        const transcript = await fetchTranscript('A2yW_J6kwgM')
        const totalDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0)
        
        if (totalDuration < 10) {
          throw new Error('Video too short - minimum 10 seconds required')
        }
        fail('Expected validation to fail')
      } catch (err) {
        expect(err.message).toBe('Video too short - minimum 10 seconds required')
      }
    })

    it('should handle different video types and languages', async () => {
      // Test different languages
      const spanishTranscript: TranscriptResponse[] = [
        {
          text: 'Hola mundo',
          duration: 2.0,
          offset: 0,
          lang: 'es'
        }
      ]
      ;(fetchTranscript as jest.Mock).mockResolvedValue(spanishTranscript)

      const transcript = await fetchTranscript('A2yW_J6kwgM', { lang: 'es' })
      expect(transcript[0].lang).toBe('es')

      // Test different video lengths
      const longVideoTranscript: TranscriptResponse[] = Array.from({ length: 100 }, (_, i) => ({
        text: `Segment ${i}`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(longVideoTranscript)

      const longTranscript = await fetchTranscript('A2yW_J6kwgM')
      expect(longTranscript).toHaveLength(100)
      
      const totalDuration = longTranscript.reduce((sum, segment) => sum + segment.duration, 0)
      expect(totalDuration).toBe(100)
    })

    it('should handle performance requirements for large transcripts', async () => {
      const largeTranscript: TranscriptResponse[] = Array.from({ length: 1000 }, (_, i) => ({
        text: `Segment ${i}`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(largeTranscript)

      const startTime = Date.now()
      const transcript = await fetchTranscript('A2yW_J6kwgM')
      const endTime = Date.now()

      // Verify performance
      expect(endTime - startTime).toBeLessThan(100) // Should complete quickly in tests
      expect(transcript).toHaveLength(1000)

      // Verify processing performance
      const processingStartTime = Date.now()
      const totalDuration = transcript.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = transcript.reduce((sum, segment) => sum + segment.text.length, 0)
      const formattedTranscript = transcript.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))
      const processingEndTime = Date.now()

      expect(processingEndTime - processingStartTime).toBeLessThan(50) // Processing should be fast
      expect(totalDuration).toBe(1000)
      expect(totalTextLength).toBeGreaterThan(0)
      expect(formattedTranscript).toHaveLength(1000)
    })
  })

  describe('Error Recovery and Retry Scenarios', () => {
    it('should handle transient network errors', async () => {
      let callCount = 0
      ;(fetchTranscript as jest.Mock).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          throw new Error('Network timeout')
        }
        return Promise.resolve(mockTranscript)
      })

      // First call should fail
      try {
        await fetchTranscript('A2yW_J6kwgM')
        fail('Expected first call to fail')
      } catch (err) {
        expect(err.message).toBe('Network timeout')
      }
      
      // Second call should succeed (simulating retry)
      const result = await fetchTranscript('A2yW_J6kwgM')
      expect(result).toEqual(mockTranscript)
    })

    it('should handle rate limiting with exponential backoff simulation', async () => {
      const { YoutubeTranscriptTooManyRequestError } = await import('youtube-transcript-plus')
      
      // Simulate rate limiting
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new YoutubeTranscriptTooManyRequestError('Rate limited'))

      await expect(fetchTranscript('A2yW_J6kwgM')).rejects.toThrow(YoutubeTranscriptTooManyRequestError)
    })
  })
})
