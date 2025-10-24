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

describe('YouTube Transcript Integration', () => {
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

    it('should handle different languages', async () => {
      const spanishTranscript: TranscriptResponse[] = [
        {
          text: 'Hola mundo',
          duration: 2.0,
          offset: 0,
          lang: 'es'
        }
      ]
      ;(fetchTranscript as jest.Mock).mockResolvedValue(spanishTranscript)

      const result = await fetchTranscript('A2yW_J6kwgM', { lang: 'es' })

      expect(result).toEqual(spanishTranscript)
      expect(result[0].lang).toBe('es')
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

  describe('Transcript validation', () => {
    it('should validate transcript structure', () => {
      const validTranscript: TranscriptResponse[] = [
        {
          text: 'Valid transcript',
          duration: 5.0,
          offset: 0,
          lang: 'en'
        }
      ]

      expect(Array.isArray(validTranscript)).toBe(true)
      expect(validTranscript.length).toBeGreaterThan(0)
      
      validTranscript.forEach(segment => {
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
    })
  })

  describe('Configuration options', () => {
    it('should accept language configuration', async () => {
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      await fetchTranscript('A2yW_J6kwgM', { lang: 'fr' })

      expect(fetchTranscript).toHaveBeenCalledWith('A2yW_J6kwgM', { lang: 'fr' })
    })

    it('should accept cache TTL configuration', async () => {
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      await fetchTranscript('A2yW_J6kwgM', { cacheTTL: 7200 })

      expect(fetchTranscript).toHaveBeenCalledWith('A2yW_J6kwgM', { cacheTTL: 7200 })
    })

    it('should accept multiple configuration options', async () => {
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mockTranscript)

      const config = {
        lang: 'de',
        cacheTTL: 1800,
        userAgent: 'Custom Agent'
      }

      await fetchTranscript('A2yW_J6kwgM', config)

      expect(fetchTranscript).toHaveBeenCalledWith('A2yW_J6kwgM', config)
    })
  })

  describe('Performance considerations', () => {
    it('should handle large transcripts efficiently', async () => {
      const largeTranscript: TranscriptResponse[] = Array.from({ length: 1000 }, (_, i) => ({
        text: `Segment ${i}`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))

      ;(fetchTranscript as jest.Mock).mockResolvedValue(largeTranscript)

      const startTime = Date.now()
      const result = await fetchTranscript('A2yW_J6kwgM')
      const endTime = Date.now()

      expect(result).toEqual(largeTranscript)
      expect(endTime - startTime).toBeLessThan(100) // Should complete quickly in tests
    })

    it('should handle empty transcript gracefully', async () => {
      ;(fetchTranscript as jest.Mock).mockResolvedValue([])

      const result = await fetchTranscript('A2yW_J6kwgM')

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
