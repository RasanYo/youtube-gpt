import {
  estimateTokens,
  createChunk,
  getOverlappingSegments,
  chunkTranscriptSegments,
  getChunkingStats,
  DEFAULT_CHUNKING_CONFIG,
} from '@/lib/zeroentropy/chunking'
import { TranscriptSegment } from '@/lib/zeroentropy/types'

describe('estimateTokens', () => {
  it('should estimate tokens correctly for simple text', () => {
    const text = 'This is a test' // 14 characters
    const tokens = estimateTokens(text)
    expect(tokens).toBeGreaterThan(0)
    expect(tokens).toBeLessThanOrEqual(14)
  })

  it('should handle empty string', () => {
    expect(estimateTokens('')).toBe(0)
  })

  it('should estimate roughly 1 token per 4 characters', () => {
    const text = 'a'.repeat(400) // 400 characters
    const tokens = estimateTokens(text)
    expect(tokens).toBe(100)
  })
})

describe('createChunk', () => {
  const mockSegments: TranscriptSegment[] = [
    { text: 'Hello world', start: 0, duration: 2, language: 'en' },
    { text: 'How are you', start: 2, duration: 2, language: 'en' },
    { text: 'I am fine', start: 4, duration: 2, language: 'en' },
  ]

  it('should create chunk from segments', () => {
    const chunk = createChunk(mockSegments, 0, 'user1', 'video1', 'Test Video')

    expect(chunk.text).toBe('Hello world How are you I am fine')
    expect(chunk.start).toBe(0)
    expect(chunk.end).toBe(6)
    expect(chunk.duration).toBe(6)
    expect(chunk.segmentCount).toBe(3)
    expect(chunk.chunkIndex).toBe(0)
    expect(chunk.userId).toBe('user1')
    expect(chunk.videoId).toBe('video1')
    expect(chunk.videoTitle).toBe('Test Video')
    expect(chunk.language).toBe('en')
  })

  it('should throw error for empty segments', () => {
    expect(() => createChunk([], 0, 'user1', 'video1', 'Test Video')).toThrow(
      'Cannot create chunk from empty segments array'
    )
  })

  it('should handle single segment', () => {
    const chunk = createChunk([mockSegments[0]], 0, 'user1', 'video1', 'Test Video')

    expect(chunk.text).toBe('Hello world')
    expect(chunk.start).toBe(0)
    expect(chunk.end).toBe(2)
    expect(chunk.segmentCount).toBe(1)
  })
})

describe('getOverlappingSegments', () => {
  const mockSegments: TranscriptSegment[] = [
    { text: 'a'.repeat(40), start: 0, duration: 2, language: 'en' }, // ~10 tokens
    { text: 'b'.repeat(40), start: 2, duration: 2, language: 'en' }, // ~10 tokens
    { text: 'c'.repeat(40), start: 4, duration: 2, language: 'en' }, // ~10 tokens
    { text: 'd'.repeat(40), start: 6, duration: 2, language: 'en' }, // ~10 tokens
  ]

  it('should return segments that fit within overlap target', () => {
    const overlap = getOverlappingSegments(mockSegments, 15)

    expect(overlap.length).toBeGreaterThan(0)
    expect(overlap.length).toBeLessThanOrEqual(2)
  })

  it('should return empty array if overlap target is 0', () => {
    const overlap = getOverlappingSegments(mockSegments, 0)
    expect(overlap).toEqual([])
  })

  it('should work backwards from end of segments', () => {
    const overlap = getOverlappingSegments(mockSegments, 25)

    // Should contain the last 2 segments (20 tokens)
    expect(overlap.length).toBe(2)
    expect(overlap[0].text).toBe('c'.repeat(40))
    expect(overlap[1].text).toBe('d'.repeat(40))
  })
})

describe('chunkTranscriptSegments', () => {
  it('should handle empty segments', () => {
    const chunks = chunkTranscriptSegments([], 'user1', 'video1', 'Test Video')
    expect(chunks).toEqual([])
  })

  it('should create single chunk for very short transcript', () => {
    const segments: TranscriptSegment[] = [
      { text: 'Short text', start: 0, duration: 2, language: 'en' },
    ]

    const chunks = chunkTranscriptSegments(segments, 'user1', 'video1', 'Test Video')

    expect(chunks.length).toBe(1)
    expect(chunks[0].text).toBe('Short text')
    expect(chunks[0].chunkIndex).toBe(0)
  })

  it('should create multiple chunks for long transcript', () => {
    // Create segments that will exceed target token count
    const segments: TranscriptSegment[] = []
    for (let i = 0; i < 50; i++) {
      segments.push({
        text: 'a'.repeat(100), // ~25 tokens each
        start: i * 2,
        duration: 2,
        language: 'en',
      })
    }

    const chunks = chunkTranscriptSegments(segments, 'user1', 'video1', 'Test Video')

    expect(chunks.length).toBeGreaterThan(1)

    // Verify chunk indexes are sequential
    chunks.forEach((chunk, idx) => {
      expect(chunk.chunkIndex).toBe(idx)
    })
  })

  it('should respect token constraints', () => {
    const segments: TranscriptSegment[] = []
    for (let i = 0; i < 100; i++) {
      segments.push({
        text: 'a'.repeat(80), // ~20 tokens each
        start: i * 2,
        duration: 2,
        language: 'en',
      })
    }

    const chunks = chunkTranscriptSegments(segments, 'user1', 'video1', 'Test Video')

    // Verify each chunk is within token constraints (except possibly the last one)
    chunks.forEach((chunk, index) => {
      const tokens = estimateTokens(chunk.text)
      const isLastChunk = index === chunks.length - 1

      // Last chunk can be shorter
      if (!isLastChunk) {
        expect(tokens).toBeGreaterThanOrEqual(DEFAULT_CHUNKING_CONFIG.minTokens)
      }
      expect(tokens).toBeLessThanOrEqual(DEFAULT_CHUNKING_CONFIG.maxTokens + 100) // Allow some buffer for overlap
    })
  })

  it('should maintain temporal order', () => {
    const segments: TranscriptSegment[] = []
    for (let i = 0; i < 30; i++) {
      segments.push({
        text: `Segment ${i}`,
        start: i * 10,
        duration: 10,
        language: 'en',
      })
    }

    const chunks = chunkTranscriptSegments(segments, 'user1', 'video1', 'Test Video')

    // Verify chunks are in temporal order
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i].start).toBeGreaterThanOrEqual(chunks[i - 1].start)
    }
  })

  it('should preserve all metadata', () => {
    const segments: TranscriptSegment[] = [
      { text: 'Test segment', start: 0, duration: 5, language: 'en' },
    ]

    const chunks = chunkTranscriptSegments(segments, 'user1', 'video1', 'Test Video')

    expect(chunks[0].userId).toBe('user1')
    expect(chunks[0].videoId).toBe('video1')
    expect(chunks[0].videoTitle).toBe('Test Video')
  })

  it('should handle custom config', () => {
    const segments: TranscriptSegment[] = []
    for (let i = 0; i < 50; i++) {
      segments.push({
        text: 'a'.repeat(40), // ~10 tokens each
        start: i * 2,
        duration: 2,
        language: 'en',
      })
    }

    const customConfig = {
      targetTokens: 100,
      minTokens: 80,
      maxTokens: 120,
      overlapPercentage: 0.05,
    }

    const chunks = chunkTranscriptSegments(segments, 'user1', 'video1', 'Test Video', customConfig)

    expect(chunks.length).toBeGreaterThan(0)

    // Verify chunks respect custom config
    chunks.forEach(chunk => {
      const tokens = estimateTokens(chunk.text)
      expect(tokens).toBeGreaterThanOrEqual(customConfig.minTokens)
    })
  })
})

describe('getChunkingStats', () => {
  it('should return zero stats for empty chunks', () => {
    const stats = getChunkingStats([])

    expect(stats.totalChunks).toBe(0)
    expect(stats.avgTokensPerChunk).toBe(0)
    expect(stats.avgSegmentsPerChunk).toBe(0)
    expect(stats.avgDurationPerChunk).toBe(0)
  })

  it('should calculate stats correctly', () => {
    const segments: TranscriptSegment[] = []
    for (let i = 0; i < 50; i++) {
      segments.push({
        text: 'a'.repeat(100), // ~25 tokens each
        start: i * 2,
        duration: 2,
        language: 'en',
      })
    }

    const chunks = chunkTranscriptSegments(segments, 'user1', 'video1', 'Test Video')
    const stats = getChunkingStats(chunks)

    expect(stats.totalChunks).toBe(chunks.length)
    expect(stats.avgTokensPerChunk).toBeGreaterThan(0)
    expect(stats.avgSegmentsPerChunk).toBeGreaterThan(0)
    expect(stats.avgDurationPerChunk).toBeGreaterThan(0)
    expect(stats.minTokensPerChunk).toBeGreaterThan(0)
    expect(stats.maxTokensPerChunk).toBeGreaterThan(0)
    expect(stats.minTokensPerChunk).toBeLessThanOrEqual(stats.maxTokensPerChunk)
  })
})
