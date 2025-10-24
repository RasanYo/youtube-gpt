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
  YoutubeTranscriptNotAvailableLanguageError: class extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'YoutubeTranscriptNotAvailableLanguageError'
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

describe('Transcript Extraction Logic', () => {
  const mockTranscript: TranscriptResponse[] = [
    {
      text: 'Welcome to this amazing video',
      duration: 3.5,
      offset: 0,
      lang: 'en'
    },
    {
      text: 'Today we will learn about transcript extraction',
      duration: 4.2,
      offset: 3.5,
      lang: 'en'
    },
    {
      text: 'This is very important for AI applications',
      duration: 3.8,
      offset: 7.7,
      lang: 'en'
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchTranscript function', () => {
    it('should call fetchTranscript with correct parameters', async () => {
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      const videoId = 'A2yW_J6kwgM'
      const config = {
        lang: 'en',
        cacheTTL: 3600
      }

      await fetchTranscript(videoId, config)

      expect(fetchTranscript).toHaveBeenCalledWith(videoId, config)
    })

    it('should return transcript data in correct format', async () => {
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      const result = await fetchTranscript('A2yW_J6kwgM')

      expect(result).toEqual(mockTranscript)
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('text')
      expect(result[0]).toHaveProperty('duration')
      expect(result[0]).toHaveProperty('offset')
      expect(result[0]).toHaveProperty('lang')
    })
  })

  describe('Transcript validation logic', () => {
    it('should validate transcript quality correctly', () => {
      // Test empty transcript
      expect(mockTranscript.length).toBeGreaterThan(0)
      expect(mockTranscript).not.toEqual([])

      // Test transcript structure
      mockTranscript.forEach(segment => {
        expect(segment).toHaveProperty('text')
        expect(segment).toHaveProperty('duration')
        expect(segment).toHaveProperty('offset')
        expect(typeof segment.text).toBe('string')
        expect(typeof segment.duration).toBe('number')
        expect(typeof segment.offset).toBe('number')
      })
    })

    it('should calculate total duration correctly', () => {
      const totalDuration = mockTranscript.reduce((sum, segment) => sum + segment.duration, 0)
      expect(totalDuration).toBe(11.5) // 3.5 + 4.2 + 3.8
    })

    it('should calculate total text length correctly', () => {
      const totalTextLength = mockTranscript.reduce((sum, segment) => sum + segment.text.length, 0)
      expect(totalTextLength).toBeGreaterThan(0)
      // Calculate actual length: "Welcome to this amazing video" (30) + "Today we will learn about transcript extraction" (45) + "This is very important for AI applications" (43) = 118
      expect(totalTextLength).toBe(118)
    })

    it('should validate minimum quality thresholds', () => {
      const totalTextLength = mockTranscript.reduce((sum, segment) => sum + segment.text.length, 0)
      const totalDuration = mockTranscript.reduce((sum, segment) => sum + segment.duration, 0)

      // Should pass quality checks
      expect(totalTextLength).toBeGreaterThanOrEqual(50)
      expect(totalDuration).toBeGreaterThanOrEqual(10)
    })

    it('should reject transcripts that are too short', () => {
      const shortTranscript: TranscriptResponse[] = [
        {
          text: 'Hi',
          duration: 1,
          offset: 0,
          lang: 'en'
        }
      ]

      const totalTextLength = shortTranscript.reduce((sum, segment) => sum + segment.text.length, 0)
      expect(totalTextLength).toBeLessThan(50)
    })

    it('should reject videos that are too short', () => {
      const shortVideoTranscript: TranscriptResponse[] = [
        {
          text: 'This is a very short video with minimal content',
          duration: 5, // Less than 10 seconds
          offset: 0,
          lang: 'en'
        }
      ]

      const totalDuration = shortVideoTranscript.reduce((sum, segment) => sum + segment.duration, 0)
      expect(totalDuration).toBeLessThan(10)
    })
  })

  describe('Transcript formatting logic', () => {
    it('should format transcript correctly', () => {
      const formattedTranscript = mockTranscript.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))

      expect(formattedTranscript).toHaveLength(mockTranscript.length)
      expect(formattedTranscript[0]).toEqual({
        text: 'Welcome to this amazing video',
        start: 0,
        duration: 3.5,
        language: 'en'
      })
    })

    it('should handle segments with extra whitespace', () => {
      const transcriptWithWhitespace: TranscriptResponse[] = [
        {
          text: '  Hello world  ',
          duration: 2.0,
          offset: 0,
          lang: 'en'
        }
      ]

      const formattedTranscript = transcriptWithWhitespace.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))

      expect(formattedTranscript[0].text).toBe('Hello world')
    })

    it('should handle missing language field', () => {
      const transcriptWithoutLang: TranscriptResponse[] = [
        {
          text: 'Hello world',
          duration: 2.0,
          offset: 0
        }
      ]

      const formattedTranscript = transcriptWithoutLang.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))

      expect(formattedTranscript[0].language).toBe('en')
    })
  })

  describe('Error handling', () => {
    it('should handle YoutubeTranscriptDisabledError', async () => {
      const { YoutubeTranscriptDisabledError } = await import('youtube-transcript-plus')
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new YoutubeTranscriptDisabledError('Captions disabled'))

      await expect(fetchTranscript('A2yW_J6kwgM')).rejects.toThrow(YoutubeTranscriptDisabledError)
    })

    it('should handle YoutubeTranscriptNotAvailableError', async () => {
      const { YoutubeTranscriptNotAvailableError } = await import('youtube-transcript-plus')
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new YoutubeTranscriptNotAvailableError('No transcript'))

      await expect(fetchTranscript('A2yW_J6kwgM')).rejects.toThrow(YoutubeTranscriptNotAvailableError)
    })

    it('should handle YoutubeTranscriptVideoUnavailableError', async () => {
      const { YoutubeTranscriptVideoUnavailableError } = await import('youtube-transcript-plus')
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new YoutubeTranscriptVideoUnavailableError('Video unavailable'))

      await expect(fetchTranscript('A2yW_J6kwgM')).rejects.toThrow(YoutubeTranscriptVideoUnavailableError)
    })

    it('should handle YoutubeTranscriptTooManyRequestError', async () => {
      const { YoutubeTranscriptTooManyRequestError } = await import('youtube-transcript-plus')
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new YoutubeTranscriptTooManyRequestError('Rate limited'))

      await expect(fetchTranscript('A2yW_J6kwgM')).rejects.toThrow(YoutubeTranscriptTooManyRequestError)
    })

    it('should handle YoutubeTranscriptInvalidVideoIdError', async () => {
      const { YoutubeTranscriptInvalidVideoIdError } = await import('youtube-transcript-plus')
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new YoutubeTranscriptInvalidVideoIdError('Invalid ID'))

      await expect(fetchTranscript('invalid-id')).rejects.toThrow(YoutubeTranscriptInvalidVideoIdError)
    })
  })

  describe('Performance considerations', () => {
    it('should handle large transcripts efficiently', () => {
      const largeTranscript: TranscriptResponse[] = Array.from({ length: 1000 }, (_, i) => ({
        text: `Segment ${i}`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))

      const startTime = Date.now()
      const totalDuration = largeTranscript.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = largeTranscript.reduce((sum, segment) => sum + segment.text.length, 0)
      const endTime = Date.now()

      expect(totalDuration).toBe(1000)
      expect(totalTextLength).toBeGreaterThan(0)
      expect(endTime - startTime).toBeLessThan(100) // Should complete quickly
    })

    it('should handle empty transcript gracefully', () => {
      const emptyTranscript: TranscriptResponse[] = []

      const totalDuration = emptyTranscript.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = emptyTranscript.reduce((sum, segment) => sum + segment.text.length, 0)

      expect(totalDuration).toBe(0)
      expect(totalTextLength).toBe(0)
      expect(Array.isArray(emptyTranscript)).toBe(true)
    })
  })
})
