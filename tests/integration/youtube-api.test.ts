import { describe, it, expect } from "vitest"
import YouTube from "youtube-sr"

/**
 * YouTube API Integration Test
 *
 * Simple test to verify YouTube API functionality using youtube-sr package.
 * This test fetches metadata for a known public video to confirm API access works.
 */

describe("YouTube API Integration", () => {
  it("should fetch video metadata successfully", async () => {
    // Using a well-known public video ID (Rick Astley - Never Gonna Give You Up)
    const testVideoId = "dQw4w9WgXcQ"
    const videoUrl = `https://www.youtube.com/watch?v=${testVideoId}`

    // Fetch video metadata
    const video = await YouTube.getVideo(videoUrl)

    // Verify video data is returned
    expect(video).toBeDefined()
    expect(video?.id).toBe(testVideoId)
    expect(video?.title).toBeTruthy()
    expect(video?.channel?.name).toBeTruthy()
    expect(video?.duration).toBeGreaterThan(0)
  })

  it("should search for videos by query", async () => {
    // Simple search test
    const searchQuery = "javascript tutorial"
    const results = await YouTube.search(searchQuery, {
      limit: 3,
      type: "video",
    })

    // Verify search returns results
    expect(results).toBeDefined()
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(3)

    // Verify first result has required fields
    const firstResult = results[0]
    expect(firstResult.id).toBeTruthy()
    expect(firstResult.title).toBeTruthy()
  })
})
