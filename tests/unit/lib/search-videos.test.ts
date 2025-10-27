import { searchVideos, SearchResult } from '@/lib/search-videos'

// Mock the ZeroEntropy client
const mockTopSnippets = jest.fn()
const mockClient = {
  queries: {
    topSnippets: mockTopSnippets
  }
}

jest.mock('@/lib/zeroentropy/client', () => ({
  getZeroEntropyClient: jest.fn(() => mockClient)
}))

// Mock the collections module
jest.mock('@/lib/zeroentropy/collections', () => ({
  getOrCreateUserCollection: jest.fn().mockResolvedValue('test-collection')
}))

describe('searchVideos - Chunk Support', () => {
  beforeEach(() => {
    mockTopSnippets.mockClear()
  })

  it('should parse chunk-based paths correctly', async () => {
    mockTopSnippets.mockResolvedValue({
      results: [
        {
          path: 'video-123-chunk0',
          content: 'This is a test chunk with multiple segments combined.',
          score: 0.95
        },
        {
          path: 'video-123-chunk1',
          content: 'This is another test chunk.',
          score: 0.85
        }
      ],
      document_results: [
        {
          path: 'video-123-chunk0',
          metadata: {
            videoId: 'video-123',
            videoTitle: 'Test Video',
            startTime: '0',
            endTime: '10',
            chunkIndex: '0',
            segmentCount: '5',
            isChunk: 'true'
          }
        },
        {
          path: 'video-123-chunk1',
          metadata: {
            videoId: 'video-123',
            videoTitle: 'Test Video',
            startTime: '8',
            endTime: '18',
            chunkIndex: '1',
            segmentCount: '5',
            isChunk: 'true'
          }
        }
      ]
    })

    const results = await searchVideos({
      query: 'test query',
      userId: 'user-123'
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      videoId: 'video-123',
      videoTitle: 'Test Video',
      startTime: 0,
      endTime: 10,
      content: 'This is a test chunk with multiple segments combined.',
      path: 'video-123-chunk0'
    })
    expect(results[1]).toMatchObject({
      videoId: 'video-123',
      videoTitle: 'Test Video',
      startTime: 8,
      endTime: 18,
      content: 'This is another test chunk.',
      path: 'video-123-chunk1'
    })
  })

  it('should parse legacy segment-based paths correctly', async () => {
    mockTopSnippets.mockResolvedValue({
      results: [
        {
          path: 'video-456-0',
          content: 'This is a single segment.',
          score: 0.90
        },
        {
          path: 'video-456-1',
          content: 'This is another segment.',
          score: 0.80
        }
      ],
      document_results: [
        {
          path: 'video-456-0',
          metadata: {
            videoId: 'video-456',
            videoTitle: 'Legacy Video',
            startTime: '0',
            endTime: '5',
            segmentIndex: '0',
            isChunk: 'false'
          }
        },
        {
          path: 'video-456-1',
          metadata: {
            videoId: 'video-456',
            videoTitle: 'Legacy Video',
            startTime: '5',
            endTime: '10',
            segmentIndex: '1',
            isChunk: 'false'
          }
        }
      ]
    })

    const results = await searchVideos({
      query: 'test query',
      userId: 'user-123'
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      videoId: 'video-456',
      videoTitle: 'Legacy Video',
      startTime: 0,
      endTime: 5,
      content: 'This is a single segment.',
      path: 'video-456-0'
    })
    expect(results[1]).toMatchObject({
      videoId: 'video-456',
      videoTitle: 'Legacy Video',
      startTime: 5,
      endTime: 10,
      content: 'This is another segment.',
      path: 'video-456-1'
    })
  })

  it('should handle video IDs with dashes in legacy format', async () => {
    mockTopSnippets.mockResolvedValue({
      results: [
        {
          path: 'video-abc-def-123-0',
          content: 'Video with dashes in ID.',
          score: 0.92
        }
      ],
      document_results: [
        {
          path: 'video-abc-def-123-0',
          metadata: {
            videoId: 'video-abc-def-123',
            videoTitle: 'Dashed Video',
            startTime: '0',
            endTime: '5',
            segmentIndex: '0',
            isChunk: 'false'
          }
        }
      ]
    })

    const results = await searchVideos({
      query: 'test query',
      userId: 'user-123'
    })

    expect(results).toHaveLength(1)
    expect(results[0].videoId).toBe('video-abc-def-123')
  })

  it('should handle video IDs with dashes in chunk format', async () => {
    mockTopSnippets.mockResolvedValue({
      results: [
        {
          path: 'video-abc-def-123-chunk0',
          content: 'Chunked video with dashes in ID.',
          score: 0.92
        }
      ],
      document_results: [
        {
          path: 'video-abc-def-123-chunk0',
          metadata: {
            videoId: 'video-abc-def-123',
            videoTitle: 'Dashed Video',
            startTime: '0',
            endTime: '10',
            chunkIndex: '0',
            segmentCount: '5',
            isChunk: 'true'
          }
        }
      ]
    })

    const results = await searchVideos({
      query: 'test query',
      userId: 'user-123'
    })

    expect(results).toHaveLength(1)
    expect(results[0].videoId).toBe('video-abc-def-123')
  })

  it('should handle mixed chunk and segment results', async () => {
    mockTopSnippets.mockResolvedValue({
      results: [
        {
          path: 'video-123-chunk0',
          content: 'This is a chunk.',
          score: 0.95
        },
        {
          path: 'video-456-0',
          content: 'This is a segment.',
          score: 0.90
        }
      ],
      document_results: [
        {
          path: 'video-123-chunk0',
          metadata: {
            videoId: 'video-123',
            videoTitle: 'New Video',
            startTime: '0',
            endTime: '10',
            chunkIndex: '0',
            segmentCount: '5',
            isChunk: 'true'
          }
        },
        {
          path: 'video-456-0',
          metadata: {
            videoId: 'video-456',
            videoTitle: 'Old Video',
            startTime: '0',
            endTime: '5',
            segmentIndex: '0',
            isChunk: 'false'
          }
        }
      ]
    })

    const results = await searchVideos({
      query: 'test query',
      userId: 'user-123'
    })

    expect(results).toHaveLength(2)
    expect(results[0].videoId).toBe('video-123')
    expect(results[0].path).toBe('video-123-chunk0')
    expect(results[1].videoId).toBe('video-456')
    expect(results[1].path).toBe('video-456-0')
  })

  it('should apply video ID filter correctly', async () => {
    mockTopSnippets.mockResolvedValue({
      results: [],
      document_results: []
    })

    await searchVideos({
      query: 'test query',
      userId: 'user-123',
      videoIds: ['video-1', 'video-2']
    })

    expect(mockTopSnippets).toHaveBeenCalledWith({
      collection_name: 'test-collection',
      query: 'test query',
      k: 10,
      filter: {
        videoId: {
          $in: ['video-1', 'video-2']
        }
      },
      include_document_metadata: true,
      precise_responses: true
    })
  })

  it('should handle missing metadata gracefully', async () => {
    mockTopSnippets.mockResolvedValue({
      results: [
        {
          path: 'video-123-chunk0',
          content: 'Test content',
          score: 0.95
        }
      ],
      document_results: []
    })

    const results = await searchVideos({
      query: 'test query',
      userId: 'user-123'
    })

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      videoId: 'video-123',
      videoTitle: undefined,
      startTime: 0,
      endTime: 30, // Default fallback
      content: 'Test content',
      path: 'video-123-chunk0'
    })
  })
})
