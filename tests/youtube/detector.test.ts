import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectYouTubeType } from '../../src/lib/youtube/detector'
import { YouTube } from 'youtube-sr'

// Mock youtube-sr
vi.mock('youtube-sr', () => ({
  YouTube: {
    isPlaylist: vi.fn(),
    validate: vi.fn()
  }
}))

const mockYouTube = YouTube as any
describe('YouTube URL Detector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  describe('Video URL Detection', () => {
    it('should detect standard video URLs', () => {
      const testCases = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/v/dQw4w9WgXcQ'
      ]

      testCases.forEach(url => {
        // Mock the YouTube methods for this test
        mockYouTube.isPlaylist.mockReturnValue(false)
        mockYouTube.validate.mockReturnValue(true)
        
        const result = detectYouTubeType(url)
        expect(result.type).toBe('video')
        expect(result.id).toBe('dQw4w9WgXcQ')
        expect(result.originalUrl).toBe(url)
      })
    })


    it('should handle video URLs with hash fragments', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ#t=30s'
      
      mockYouTube.isPlaylist.mockReturnValue(false)
      mockYouTube.validate.mockReturnValue(true)
      
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
        mockYouTube.isPlaylist.mockReturnValue(true)
        mockYouTube.validate.mockReturnValue(false)
        
        const result = detectYouTubeType(url)
        expect(result.type).toBe('playlist')
        expect(result.originalUrl).toBe(url)
      })
    })
  })
  })

  describe('Invalid Input Handling', () => {
    it('should handle empty or null inputs', () => {
      expect(detectYouTubeType('')).toEqual({
        type: 'invalid',
        id: null,
        originalUrl: ''
      })
      
      expect(detectYouTubeType(null as any)).toEqual({
        type: 'invalid',
        id: null,
        originalUrl: null
      })
      
      expect(detectYouTubeType(undefined as any)).toEqual({
        type: 'invalid',
        id: null,
        originalUrl: undefined
      })
    })

    it('should handle non-string inputs', () => {
      expect(detectYouTubeType(123 as any)).toEqual({
        type: 'invalid',
        id: null,
        originalUrl: 123
      })
    })
  })

  describe('URL Normalization', () => {
    it('should trim whitespace from URLs', () => {
      const url = '  https://www.youtube.com/watch?v=dQw4w9WgXcQ  '
      
      mockYouTube.isPlaylist.mockReturnValue(false)
      mockYouTube.validate.mockReturnValue(true)
      
      const result = detectYouTubeType(url)
      
      expect(result.type).toBe('video')
      expect(result.id).toBe('dQw4w9WgXcQ')
      expect(result.originalUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    })
  })


