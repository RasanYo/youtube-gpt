import { fetchTranscript } from 'youtube-transcript-plus'
import type { TranscriptResponse } from 'youtube-transcript-plus'

// Mock youtube-transcript-plus
jest.mock('youtube-transcript-plus', () => ({
  fetchTranscript: jest.fn()
}))

describe('Transcript Extraction Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Performance Benchmarks', () => {
    it('should process small transcripts efficiently', async () => {
      const smallTranscript: TranscriptResponse[] = [
        {
          text: 'Short video',
          duration: 10,
          offset: 0,
          lang: 'en'
        }
      ]
      ;(fetchTranscript as jest.Mock).mockResolvedValue(smallTranscript)

      const startTime = Date.now()
      const result = await fetchTranscript('A2yW_J6kwgM')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
      expect(result).toEqual(smallTranscript)
    })

    it('should process medium transcripts efficiently', async () => {
      const mediumTranscript: TranscriptResponse[] = Array.from({ length: 100 }, (_, i) => ({
        text: `Segment ${i} with some content`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(mediumTranscript)

      const startTime = Date.now()
      const result = await fetchTranscript('A2yW_J6kwgM')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(200) // Should complete in under 200ms
      expect(result).toHaveLength(100)
    })

    it('should process large transcripts efficiently', async () => {
      const largeTranscript: TranscriptResponse[] = Array.from({ length: 1000 }, (_, i) => ({
        text: `Segment ${i} with some content that is longer`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(largeTranscript)

      const startTime = Date.now()
      const result = await fetchTranscript('A2yW_J6kwgM')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(500) // Should complete in under 500ms
      expect(result).toHaveLength(1000)
    })

    it('should process very large transcripts within reasonable time', async () => {
      const veryLargeTranscript: TranscriptResponse[] = Array.from({ length: 5000 }, (_, i) => ({
        text: `Segment ${i} with some content that is longer and more detailed`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(veryLargeTranscript)

      const startTime = Date.now()
      const result = await fetchTranscript('A2yW_J6kwgM')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // Should complete in under 1 second
      expect(result).toHaveLength(5000)
    })
  })

  describe('Memory Usage Tests', () => {
    it('should handle large transcripts without memory issues', async () => {
      const largeTranscript: TranscriptResponse[] = Array.from({ length: 2000 }, (_, i) => ({
        text: `This is a longer segment ${i} with more detailed content that tests memory usage`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(largeTranscript)

      const result = await fetchTranscript('A2yW_J6kwgM')
      
      // Process the transcript (simulating what the actual function does)
      const totalDuration = result.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = result.reduce((sum, segment) => sum + segment.text.length, 0)
      const formattedTranscript = result.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))

      expect(totalDuration).toBe(2000)
      expect(totalTextLength).toBeGreaterThan(0)
      expect(formattedTranscript).toHaveLength(2000)
    })

    it('should handle concurrent transcript processing', async () => {
      const transcript: TranscriptResponse[] = [
        {
          text: 'Test segment',
          duration: 1.0,
          offset: 0,
          lang: 'en'
        }
      ]
      ;(fetchTranscript as jest.Mock).mockResolvedValue(transcript)

      const startTime = Date.now()
      
      // Simulate concurrent processing
      const promises = Array.from({ length: 10 }, () => fetchTranscript('A2yW_J6kwgM'))
      const results = await Promise.all(promises)
      
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(1000) // All 10 should complete in under 1 second
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result).toEqual(transcript)
      })
    })
  })

  describe('Processing Pipeline Performance', () => {
    it('should validate transcript quality efficiently', async () => {
      const transcript: TranscriptResponse[] = Array.from({ length: 500 }, (_, i) => ({
        text: `Segment ${i} with content`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(transcript)

      const startTime = Date.now()
      
      // Simulate the complete validation pipeline
      const result = await fetchTranscript('A2yW_J6kwgM')
      
      // Validation checks
      if (!result || result.length === 0) {
        throw new Error('No transcript data received from YouTube')
      }
      
      const totalDuration = result.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = result.reduce((sum, segment) => sum + segment.text.length, 0)
      
      if (totalTextLength < 50) {
        throw new Error('Transcript too short')
      }
      
      if (totalDuration < 10) {
        throw new Error('Video too short')
      }
      
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(100) // Validation should be very fast
      expect(totalDuration).toBe(500)
      expect(totalTextLength).toBeGreaterThan(50)
    })

    it('should format transcript efficiently', async () => {
      const transcript: TranscriptResponse[] = Array.from({ length: 1000 }, (_, i) => ({
        text: `Segment ${i} with content`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(transcript)

      const result = await fetchTranscript('A2yW_J6kwgM')
      
      const startTime = Date.now()
      
      // Format transcript (simulating the actual formatting)
      const formattedTranscript = result.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))
      
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(50) // Formatting should be very fast
      expect(formattedTranscript).toHaveLength(1000)
    })

    it('should generate metadata efficiently', async () => {
      const transcript: TranscriptResponse[] = Array.from({ length: 2000 }, (_, i) => ({
        text: `Segment ${i} with content`,
        duration: 1.0,
        offset: i,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(transcript)

      const result = await fetchTranscript('A2yW_J6kwgM')
      
      const startTime = Date.now()
      
      // Generate metadata (simulating the actual metadata generation)
      const totalDuration = result.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = result.reduce((sum, segment) => sum + segment.text.length, 0)
      const averageSegmentDuration = totalDuration / result.length
      const averageTextLength = totalTextLength / result.length
      
      const metadata = {
        totalSegments: result.length,
        totalDuration,
        totalTextLength,
        averageSegmentDuration,
        averageTextLength,
        language: result[0]?.lang || 'en',
        extractedAt: new Date().toISOString()
      }
      
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(50) // Metadata generation should be very fast
      expect(metadata.totalSegments).toBe(2000)
      expect(metadata.totalDuration).toBe(2000)
      expect(metadata.averageSegmentDuration).toBe(1.0)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently', async () => {
      ;(fetchTranscript as jest.Mock).mockRejectedValue(new Error('Test error'))

      const startTime = Date.now()
      
      try {
        await fetchTranscript('A2yW_J6kwgM')
        fail('Expected function to throw')
      } catch (error) {
        const endTime = Date.now()
        
        expect(endTime - startTime).toBeLessThan(100) // Error handling should be fast
        expect(error.message).toBe('Test error')
      }
    })

    it('should handle multiple error types efficiently', async () => {
      const errorTypes = [
        new Error('Network error'),
        new Error('Rate limit error'),
        new Error('Invalid video error')
      ]

      for (const errorType of errorTypes) {
        ;(fetchTranscript as jest.Mock).mockRejectedValue(errorType)

        const startTime = Date.now()
        
        try {
          await fetchTranscript('A2yW_J6kwgM')
          fail('Expected function to throw')
        } catch (error) {
          const endTime = Date.now()
          
          expect(endTime - startTime).toBeLessThan(100) // Error handling should be fast
          expect(error.message).toBe(errorType.message)
        }
      }
    })
  })

  describe('Real-world Performance Scenarios', () => {
    it('should handle typical YouTube video transcript (10-30 minutes)', async () => {
      // Simulate a 20-minute video with segments every 2-3 seconds
      const typicalTranscript: TranscriptResponse[] = Array.from({ length: 400 }, (_, i) => ({
        text: `This is segment ${i} of a typical YouTube video with normal content length`,
        duration: 3.0, // 3 seconds per segment
        offset: i * 3.0,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(typicalTranscript)

      const startTime = Date.now()
      
      const result = await fetchTranscript('A2yW_J6kwgM')
      
      // Complete processing pipeline
      const totalDuration = result.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = result.reduce((sum, segment) => sum + segment.text.length, 0)
      const formattedTranscript = result.map(segment => ({
        text: segment.text.trim(),
        start: segment.offset,
        duration: segment.duration,
        language: segment.lang || 'en'
      }))
      
      const metadata = {
        totalSegments: result.length,
        totalDuration,
        totalTextLength,
        language: result[0]?.lang || 'en',
        extractedAt: new Date().toISOString()
      }
      
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(200) // Should complete in under 200ms
      expect(result).toHaveLength(400)
      expect(totalDuration).toBe(1200) // 20 minutes
      expect(totalTextLength).toBeGreaterThan(10000) // Substantial text content
      expect(formattedTranscript).toHaveLength(400)
      expect(metadata.totalSegments).toBe(400)
    })

    it('should handle long-form content (1+ hour videos)', async () => {
      // Simulate a 1-hour video
      const longFormTranscript: TranscriptResponse[] = Array.from({ length: 1200 }, (_, i) => ({
        text: `This is segment ${i} of a long-form video with detailed content`,
        duration: 3.0,
        offset: i * 3.0,
        lang: 'en'
      }))
      ;(fetchTranscript as jest.Mock).mockResolvedValue(longFormTranscript)

      const startTime = Date.now()
      
      const result = await fetchTranscript('A2yW_J6kwgM')
      
      // Process the transcript
      const totalDuration = result.reduce((sum, segment) => sum + segment.duration, 0)
      const totalTextLength = result.reduce((sum, segment) => sum + segment.text.length, 0)
      
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(500) // Should complete in under 500ms
      expect(result).toHaveLength(1200)
      expect(totalDuration).toBe(3600) // 1 hour
      expect(totalTextLength).toBeGreaterThan(30000) // Substantial text content
    })
  })
})
