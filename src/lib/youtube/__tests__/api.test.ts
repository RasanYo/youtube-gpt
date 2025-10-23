import { describe, it, expect } from 'vitest'
import { processYouTubeUrl } from '../api'

describe('processYouTubeUrl', () => {
  it('should process valid YouTube video URLs', async () => {
    const testUrls = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    ]

    for (const url of testUrls) {
      const result = await processYouTubeUrl(url)
      expect(result.success).toBe(true)
      expect(result.type).toBe('video')
      expect(result.data).toBeDefined()
    }
  })

  it('should process valid YouTube channel URLs', async () => {
    const testUrls = [
      'https://www.youtube.com/channel/UCuAXFkgsw1L7xaCfnd5JJOw',
      'https://www.youtube.com/@example',
      'https://www.youtube.com/user/example'
    ]

    for (const url of testUrls) {
      const result = await processYouTubeUrl(url)
      expect(result.success).toBe(true)
      expect(result.type).toBe('channel')
      expect(result.data).toBeDefined()
    }
  })

  it('should reject invalid URLs', async () => {
    const testUrls = [
      '',
      'not-a-url',
      'https://example.com',
      'https://www.youtube.com/watch',
      'https://www.youtube.com/watch?v=',
      'https://www.youtube.com/invalid'
    ]

    for (const url of testUrls) {
      const result = await processYouTubeUrl(url)
      expect(result.success).toBe(false)
      expect(result.type).toBe('invalid')
      expect(result.error).toBeDefined()
    }
  })

  it('should handle null and undefined inputs', async () => {
    const result1 = await processYouTubeUrl('')
    expect(result1.success).toBe(false)
    expect(result1.error).toContain('Invalid URL')

    const result2 = await processYouTubeUrl(null as any)
    expect(result2.success).toBe(false)
    expect(result2.error).toContain('Invalid URL')
  })
})
