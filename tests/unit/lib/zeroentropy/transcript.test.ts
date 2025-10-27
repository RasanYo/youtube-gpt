import {
  processTranscriptSegments,
  validateTranscriptQuality,
  handleTranscriptEdgeCases,
  getTranscriptProcessingMetrics
} from '@/lib/zeroentropy/transcript'
import type { TranscriptData, ProcessedTranscriptSegment } from '@/lib/zeroentropy/types'

describe('ZeroEntropy Transcript Processing Tests', () => {
  const mockTranscriptData: TranscriptData = {
    transcript: [
      {
        text: 'Hello world, this is a test transcript.',
        start: 0,
        duration: 4.0,
        language: 'en'
      },
      {
        text: 'This is the second segment with more content.',
        start: 4.0,
        duration: 4.5,
        language: 'en'
      },
      {
        text: 'And this is the final segment.',
        start: 8.5,
        duration: 2.5,
        language: 'en'
      }
    ],
    metadata: {
      totalSegments: 3,
      totalDuration: 11.0,
      totalTextLength: 112,
      language: 'en',
      extractedAt: '2024-01-01T00:00:00.000Z',
      processingTimeMs: 1500
    }
  }

  const mockUserId = 'test-user-123'
  const mockVideoId = 'test-video-456'

  describe('processTranscriptSegments', () => {
    it('should process transcript segments into chunks with user and video context', () => {
      const result = processTranscriptSegments(mockTranscriptData, mockUserId, mockVideoId, 'Test Video')

      // With short segments, should create a single chunk
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        text: 'Hello world, this is a test transcript. This is the second segment with more content. And this is the final segment.',
        start: 0,
        end: 11,
        duration: 11,
        language: 'en',
        userId: mockUserId,
        videoId: mockVideoId,
        videoTitle: 'Test Video',
        segmentCount: 3,
        chunkIndex: 0
      })
    })

    it('should handle empty transcript data', () => {
      const emptyData: TranscriptData = {
        transcript: [],
        metadata: {
          totalSegments: 0,
          totalDuration: 0,
          totalTextLength: 0,
          language: 'en',
          extractedAt: '2024-01-01T00:00:00.000Z',
          processingTimeMs: 0
        }
      }

      const result = processTranscriptSegments(emptyData, mockUserId, mockVideoId, 'Test Video')
      expect(result).toHaveLength(0)
    })

    it('should skip segments with empty text and create chunk', () => {
      const dataWithEmptySegment: TranscriptData = {
        transcript: [
          {
            text: 'Valid segment',
            start: 0,
            duration: 2,
            language: 'en'
          },
          {
            text: '',
            start: 2,
            duration: 1,
            language: 'en'
          },
          {
            text: 'Another valid segment',
            start: 3,
            duration: 2,
            language: 'en'
          }
        ],
        metadata: {
          totalSegments: 3,
          totalDuration: 5,
          totalTextLength: 30,
          language: 'en',
          extractedAt: '2024-01-01T00:00:00.000Z',
          processingTimeMs: 1000
        }
      }

      const result = processTranscriptSegments(dataWithEmptySegment, mockUserId, mockVideoId, 'Test Video')
      // Should create a single chunk from the 2 valid segments (empty segment skipped)
      expect(result).toHaveLength(1)
      expect(result[0].segmentCount).toBe(2)
    })

    it('should skip segments with invalid timestamps', () => {
      const dataWithInvalidSegment: TranscriptData = {
        transcript: [
          {
            text: 'Valid segment',
            start: 0,
            duration: 2,
            language: 'en'
          },
          {
            text: 'Invalid segment',
            start: -1, // Invalid start time
            duration: 1,
            language: 'en'
          }
        ],
        metadata: {
          totalSegments: 2,
          totalDuration: 3,
          totalTextLength: 30,
          language: 'en',
          extractedAt: '2024-01-01T00:00:00.000Z',
          processingTimeMs: 1000
        }
      }

      const result = processTranscriptSegments(dataWithInvalidSegment, mockUserId, mockVideoId, 'Test Video')
      // Should create a single chunk from the 1 valid segment (invalid segment skipped)
      expect(result).toHaveLength(1)
      expect(result[0].segmentCount).toBe(1)
    })
  })

  describe('validateTranscriptQuality', () => {
    it('should validate good quality transcript', () => {
      const result = validateTranscriptQuality(mockTranscriptData)
      
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.metrics.totalSegments).toBe(3)
      expect(result.metrics.totalDuration).toBe(11.0)
      expect(result.metrics.totalTextLength).toBe(114)
    })

    it('should detect poor quality transcript', () => {
      const poorQualityData: TranscriptData = {
        transcript: [
          {
            text: 'a',
            start: 0,
            duration: 1,
            language: 'en'
          }
        ],
        metadata: {
          totalSegments: 1,
          totalDuration: 1,
          totalTextLength: 1,
          language: 'en',
          extractedAt: '2024-01-01T00:00:00.000Z',
          processingTimeMs: 1000
        }
      }
      
      const result = validateTranscriptQuality(poorQualityData)
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Transcript too short - likely poor quality or auto-generated captions disabled')
      expect(result.issues).toContain('Video too short - minimum 10 seconds required')
    })

    it('should detect too many empty segments', () => {
      const dataWithManyEmptySegments: TranscriptData = {
        transcript: [
          { text: '', start: 0, duration: 1, language: 'en' },
          { text: '', start: 1, duration: 1, language: 'en' },
          { text: 'Valid content', start: 2, duration: 1, language: 'en' }
        ],
        metadata: {
          totalSegments: 3,
          totalDuration: 3,
          totalTextLength: 12,
          language: 'en',
          extractedAt: '2024-01-01T00:00:00.000Z',
          processingTimeMs: 1000
        }
      }
      
      const result = validateTranscriptQuality(dataWithManyEmptySegments)
      
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('Too many empty segments: 2/3 (67%)')
    })
  })

  describe('handleTranscriptEdgeCases', () => {
    it('should merge very short segments with adjacent segments', () => {
      const segmentsWithShortSegment: ProcessedTranscriptSegment[] = [
        {
          text: 'First segment',
          start: 0,
          end: 2,
          duration: 2,
          language: 'en',
          segmentIndex: 0,
          userId: mockUserId,
          videoId: mockVideoId,
          videoTitle: 'Test Video'
        },
        {
          text: 'a',
          start: 2,
          end: 2.5,
          duration: 0.5, // Very short segment
          language: 'en',
          segmentIndex: 1,
          userId: mockUserId,
          videoId: mockVideoId,
          videoTitle: 'Test Video'
        },
        {
          text: 'Third segment',
          start: 2.5,
          end: 5,
          duration: 2.5,
          language: 'en',
          segmentIndex: 2,
          userId: mockUserId,
          videoId: mockVideoId,
          videoTitle: 'Test Video'
        }
      ]

      const result = handleTranscriptEdgeCases(segmentsWithShortSegment)

      expect(result).toHaveLength(2) // Should merge short segment
      expect(result[0].text).toBe('First segment')
      expect(result[0].start).toBe(0)
      expect(result[0].end).toBe(2)
      expect(result[1].text).toBe('a Third segment')
      expect(result[1].start).toBe(2)
      expect(result[1].end).toBe(5)
    })

    it('should fix negative start times', () => {
      const segmentsWithNegativeStart: ProcessedTranscriptSegment[] = [
        {
          text: 'Segment with negative start',
          start: -1,
          end: 2,
          duration: 3,
          language: 'en',
          segmentIndex: 0,
          userId: mockUserId,
          videoId: mockVideoId,
          videoTitle: 'Test Video'
        }
      ]

      const result = handleTranscriptEdgeCases(segmentsWithNegativeStart)

      expect(result[0].start).toBe(0)
      expect(result[0].end).toBe(3)
    })
  })

  describe('getTranscriptProcessingMetrics', () => {
    it('should calculate correct metrics', () => {
      const segments: ProcessedTranscriptSegment[] = [
        {
          text: 'Hello world',
          start: 0,
          end: 2,
          duration: 2,
          language: 'en',
          segmentIndex: 0,
          userId: mockUserId,
          videoId: mockVideoId,
          videoTitle: 'Test Video'
        },
        {
          text: 'This is a test',
          start: 2,
          end: 4,
          duration: 2,
          language: 'en',
          segmentIndex: 1,
          userId: mockUserId,
          videoId: mockVideoId,
          videoTitle: 'Test Video'
        }
      ]
      
      const result = getTranscriptProcessingMetrics(segments)
      
      expect(result.totalSegments).toBe(2)
      expect(result.totalDuration).toBe(4)
      expect(result.totalTextLength).toBe(25)
      expect(result.averageSegmentLength).toBe(12.5)
      expect(result.averageSegmentDuration).toBe(2)
      expect(result.languageDistribution).toEqual({ en: 2 })
    })
  })
})
