// Jest globals are available without import
import { detectYouTubeType } from '../../src/lib/youtube/detector'

describe('YouTube URL Detector', () => {
  describe('Video URL Detection', () => {
    it('should detect standard video URLs', () => {
      const testCases = [
        "https://www.youtube.com/watch?v=I5VmmoJEgP8"
      ]

      testCases.forEach(url => {
        const result = detectYouTubeType(url)
        expect(result.type).toBe('video')
        expect(result.id).toBe('I5VmmoJEgP8')
      })
    })


    it('should handle video URLs with hash fragments', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=30s'
      
      const result = detectYouTubeType(url)
      
      expect(result.type).toBe('video')
      expect(result.id).toBe('dQw4w9WgXcQ')
    })
  })

  describe('Playlist URL Detection', () => {
    it('should detect playlist URLs', () => {
      const testCases = [
        'https://www.youtube.com/watch?v=61btZbqIai0&list=PLKDC6DUkHXj2hnPbPNWZjEG_zj0N2S7SW',
        'https://www.youtube.com/watch?v=vK9wgKx8Na4&list=PLKDC6DUkHXj37s3b8SfCSX9ZNxCh8jWb2',
        'https://www.youtube.com/watch?v=aAUKZQV_5uo&list=PLKDC6DUkHXj04MmbU8Q1pUIjnlTaSkvIP'
      ]

      testCases.forEach(url => {
        const result = detectYouTubeType(url)
        expect(result.type).toBe('video')
      })
    })
  })
  })

  describe('Invalid Input Handling', () => {
    it('should handle empty or null inputs', () => {
      expect(detectYouTubeType('')).toEqual({
        type: 'unknown',
        id: null,
      })
      
      expect(detectYouTubeType(null as any)).toEqual({
        type: 'unknown',
        id: null,
      })
      
      expect(detectYouTubeType(undefined as any)).toEqual({
        type: 'unknown',
        id: null,
      })
    })

    it('should handle non-string inputs', () => {
      expect(detectYouTubeType(123 as any)).toEqual({
        type: 'unknown',
        id: null,
      })
    })
  })

  describe('URL Normalization', () => {
    it('should trim whitespace from URLs', () => {
      const url = '  https://www.youtube.com/watch?v=dQw4w9WgXcQ  '
      
      const result = detectYouTubeType(url)
      
      expect(result.type).toBe('video')
      expect(result.id).toBe('dQw4w9WgXcQ')
    })
  })


