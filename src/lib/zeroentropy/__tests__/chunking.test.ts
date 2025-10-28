/**
 * Unit tests for hierarchical chunking functionality
 */

import { getLevel2ChunkConfig, chunkHierarchically } from '../chunking'
import type { TranscriptData } from '../types'

describe('getLevel2ChunkConfig', () => {
  it('should return null for videos shorter than 15 minutes', () => {
    // Test various short video durations
    expect(getLevel2ChunkConfig(5 * 60)).toBeNull()      // 5 minutes
    expect(getLevel2ChunkConfig(10 * 60)).toBeNull()    // 10 minutes
    expect(getLevel2ChunkConfig(14 * 60 + 59)).toBeNull() // 14:59
  })

  it('should return correct config for 15-30 minute videos', () => {
    const config = getLevel2ChunkConfig(20 * 60) // 20 minutes
    expect(config).not.toBeNull()
    expect(config!.minChunkDuration).toBe(120)   // 2 minutes
    expect(config!.maxChunkDuration).toBe(240)   // 4 minutes
    expect(config!.targetChunkDuration).toBe(180) // 3 minutes
  })

  it('should return correct config for 30-60 minute videos', () => {
    const config = getLevel2ChunkConfig(45 * 60) // 45 minutes
    expect(config).not.toBeNull()
    expect(config!.minChunkDuration).toBe(180)   // 3 minutes
    expect(config!.maxChunkDuration).toBe(360)   // 6 minutes
    expect(config!.targetChunkDuration).toBe(270) // 4.5 minutes
  })

  it('should return correct config for 60-120 minute videos', () => {
    const config = getLevel2ChunkConfig(90 * 60) // 90 minutes
    expect(config).not.toBeNull()
    expect(config!.minChunkDuration).toBe(300)   // 5 minutes
    expect(config!.maxChunkDuration).toBe(600)   // 10 minutes
    expect(config!.targetChunkDuration).toBe(450) // 7.5 minutes
  })

  it('should return correct config for 120+ minute videos', () => {
    const config = getLevel2ChunkConfig(150 * 60) // 150 minutes
    expect(config).not.toBeNull()
    expect(config!.minChunkDuration).toBe(600)   // 10 minutes
    expect(config!.maxChunkDuration).toBe(1200)  // 20 minutes
    expect(config!.targetChunkDuration).toBe(900) // 15 minutes
  })

  it('should handle edge cases correctly', () => {
    // Exactly 15 minutes
    const config15 = getLevel2ChunkConfig(15 * 60)
    expect(config15).not.toBeNull()
    expect(config15!.minChunkDuration).toBe(120)

    // Exactly 30 minutes (should be in 15-30 range)
    const config30 = getLevel2ChunkConfig(30 * 60)
    expect(config30).not.toBeNull()
    expect(config30!.minChunkDuration).toBe(120)

    // Exactly 60 minutes (should be in 30-60 range)
    const config60 = getLevel2ChunkConfig(60 * 60)
    expect(config60).not.toBeNull()
    expect(config60!.minChunkDuration).toBe(180)

    // Exactly 120 minutes (should be in 60-120 range)
    const config120 = getLevel2ChunkConfig(120 * 60)
    expect(config120).not.toBeNull()
    expect(config120!.minChunkDuration).toBe(300)
  })
})

describe('chunkHierarchically', () => {
  // Helper function to create mock transcript data
  const createMockTranscriptData = (durationMinutes: number): TranscriptData => {
    const segments = []
    const segmentDuration = 10 // 10 seconds per segment (more realistic)
    const totalSegments = Math.ceil((durationMinutes * 60) / segmentDuration)
    
    for (let i = 0; i < totalSegments; i++) {
      // Create longer text content to match realistic transcript segments
      const text = `This is segment ${i + 1} with substantial content about the topic being discussed. It contains multiple sentences and provides detailed information that would typically be found in a YouTube transcript. The content is designed to be realistic and substantial enough to create meaningful chunks when processed by the chunking algorithm.`
      segments.push({
        text,
        start: i * segmentDuration,
        duration: segmentDuration,
        language: 'en'
      })
    }
    
    return {
      transcript: segments,
      metadata: {
        totalSegments: segments.length,
        totalDuration: durationMinutes * 60,
        totalTextLength: segments.reduce((sum, seg) => sum + seg.text.length, 0),
        language: 'en',
        extractedAt: new Date().toISOString(),
        processingTimeMs: 1000
      }
    }
  }

  it('should create only Level 1 chunks for short videos (< 15 min)', () => {
    const transcriptData = createMockTranscriptData(10) // 10 minute video
    const result = chunkHierarchically(
      transcriptData,
      'user123',
      'video123',
      'Short Video',
      10 * 60 // 10 minutes
    )

    expect(result.level1Chunks.length).toBeGreaterThan(0)
    expect(result.level2Chunks.length).toBe(0)
    
    // All Level 1 chunks should have chunkLevel "1"
    result.level1Chunks.forEach(chunk => {
      expect(chunk.chunkLevel).toBe("1")
      expect(chunk.userId).toBe('user123')
      expect(chunk.videoId).toBe('video123')
      expect(chunk.videoTitle).toBe('Short Video')
    })
  })

  it('should create both Level 1 and Level 2 chunks for long videos (> 15 min)', () => {
    const transcriptData = createMockTranscriptData(60) // 60 minute video
    const result = chunkHierarchically(
      transcriptData,
      'user123',
      'video123',
      'Long Video',
      60 * 60 // 60 minutes
    )

    expect(result.level1Chunks.length).toBeGreaterThan(0)
    expect(result.level2Chunks.length).toBeGreaterThan(0)
    
    // All Level 1 chunks should have chunkLevel "1"
    result.level1Chunks.forEach(chunk => {
      expect(chunk.chunkLevel).toBe("1")
    })
    
    // All Level 2 chunks should have chunkLevel "2"
    result.level2Chunks.forEach(chunk => {
      expect(chunk.chunkLevel).toBe("2")
      expect(chunk.userId).toBe('user123')
      expect(chunk.videoId).toBe('video123')
      expect(chunk.videoTitle).toBe('Long Video')
    })
  })

  it('should create Level 2 chunks with appropriate duration ranges', () => {
    const transcriptData = createMockTranscriptData(60) // 60 minute video
    const result = chunkHierarchically(
      transcriptData,
      'user123',
      'video123',
      'Long Video',
      60 * 60 // 60 minutes
    )

    // Level 2 chunks should be within the expected duration range for 60-min videos
    // Expected range: 3-6 minutes (180-360 seconds)
    result.level2Chunks.forEach(chunk => {
      expect(chunk.duration).toBeGreaterThanOrEqual(180) // At least 3 minutes
      expect(chunk.duration).toBeLessThanOrEqual(360)     // At most 6 minutes
    })
  })

  it('should preserve all transcript content across both levels', () => {
    const transcriptData = createMockTranscriptData(30) // 30 minute video
    const result = chunkHierarchically(
      transcriptData,
      'user123',
      'video123',
      'Medium Video',
      30 * 60 // 30 minutes
    )

    // Calculate total text length in both levels
    const level1TextLength = result.level1Chunks.reduce((sum, chunk) => sum + chunk.text.length, 0)
    const level2TextLength = result.level2Chunks.reduce((sum, chunk) => sum + chunk.text.length, 0)
    const originalTextLength = transcriptData.transcript.reduce((sum, seg) => sum + seg.text.length, 0)

    // Level 1 should contain all original content (may have some overlap)
    expect(level1TextLength).toBeGreaterThanOrEqual(originalTextLength)
    
    // Level 2 should contain most of the original content (allowing for some loss due to chunking)
    // We expect at least 95% of the content to be preserved
    const preservationRatio = level2TextLength / originalTextLength
    expect(preservationRatio).toBeGreaterThanOrEqual(0.95)
  })

  it('should handle edge case of empty transcript', () => {
    const emptyTranscriptData: TranscriptData = {
      transcript: [],
      metadata: {
        totalSegments: 0,
        totalDuration: 0,
        totalTextLength: 0,
        language: 'en',
        extractedAt: new Date().toISOString(),
        processingTimeMs: 0
      }
    }

    const result = chunkHierarchically(
      emptyTranscriptData,
      'user123',
      'video123',
      'Empty Video',
      0
    )

    expect(result.level1Chunks.length).toBe(0)
    expect(result.level2Chunks.length).toBe(0)
  })
})
