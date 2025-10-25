import {
  formatTimestamp,
  formatTimestampRange,
  createPageContent
} from '@/lib/zeroentropy/segment-metadata'
import type { ProcessedTranscriptSegment } from '@/lib/zeroentropy/types'

describe('ZeroEntropy Segment Metadata Tests', () => {
  const mockSegment: ProcessedTranscriptSegment = {
    text: 'This is a test transcript segment with some content.',
    start: 65.5, // 1:05.5
    end: 68.2,   // 1:08.2
    duration: 2.7,
    language: 'en',
    segmentIndex: 5,
    userId: 'test-user-123',
    videoId: 'test-video-456'
  }

  describe('formatTimestamp', () => {
    it('should format seconds to MM:SS format', () => {
      expect(formatTimestamp(0)).toBe('00:00')
      expect(formatTimestamp(30)).toBe('00:30')
      expect(formatTimestamp(60)).toBe('01:00')
      expect(formatTimestamp(90)).toBe('01:30')
      expect(formatTimestamp(125)).toBe('02:05')
    })

    it('should handle decimal seconds by flooring', () => {
      expect(formatTimestamp(65.5)).toBe('01:05')
      expect(formatTimestamp(68.9)).toBe('01:08')
    })

    it('should handle large numbers', () => {
      expect(formatTimestamp(3661)).toBe('61:01') // 1 hour 1 minute 1 second
    })
  })

  describe('formatTimestampRange', () => {
    it('should format timestamp range correctly', () => {
      expect(formatTimestampRange(0, 30)).toBe('00:00 - 00:30')
      expect(formatTimestampRange(65.5, 68.2)).toBe('01:05 - 01:08')
      expect(formatTimestampRange(120, 180)).toBe('02:00 - 03:00')
    })

    it('should handle same start and end times', () => {
      expect(formatTimestampRange(60, 60)).toBe('01:00 - 01:00')
    })
  })

  describe('createPageContent', () => {
    it('should create page content with searchable text', () => {
      const result = createPageContent(mockSegment)
      
      expect(result).toMatchObject({
        content: 'This is a test transcript segment with some content.',
        metadata: mockSegment,
        searchableText: expect.stringContaining('Timestamp: 01:05 - 01:08')
      })
      
      expect(result.searchableText).toContain('Content: This is a test transcript segment with some content.')
    })

    it('should include timestamp in searchable text', () => {
      const result = createPageContent(mockSegment)
      
      expect(result.searchableText).toMatch(/Timestamp: \d{2}:\d{2} - \d{2}:\d{2}/)
    })

    it('should include content in searchable text', () => {
      const result = createPageContent(mockSegment)
      
      expect(result.searchableText).toContain(`Content: ${mockSegment.text}`)
    })

    it('should preserve all metadata', () => {
      const result = createPageContent(mockSegment)
      
      expect(result.metadata).toEqual(mockSegment)
      expect(result.metadata.userId).toBe('test-user-123')
      expect(result.metadata.videoId).toBe('test-video-456')
      expect(result.metadata.segmentIndex).toBe(5)
    })

    it('should handle empty text content', () => {
      const emptySegment: ProcessedTranscriptSegment = {
        ...mockSegment,
        text: ''
      }
      
      const result = createPageContent(emptySegment)
      
      expect(result.content).toBe('')
      expect(result.searchableText).toContain('Content: ')
    })

    it('should handle long text content', () => {
      const longText = 'A'.repeat(1000)
      const longSegment: ProcessedTranscriptSegment = {
        ...mockSegment,
        text: longText
      }
      
      const result = createPageContent(longSegment)
      
      expect(result.content).toBe(longText)
      expect(result.searchableText).toContain(`Content: ${longText}`)
    })
  })
})
