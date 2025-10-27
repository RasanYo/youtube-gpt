import { ProcessedTranscriptSegment } from '@/lib/zeroentropy/types'

// Create mock client functions
const mockAdd = jest.fn().mockResolvedValue({})
const mockDelete = jest.fn().mockResolvedValue({})
const mockGetInfo = jest.fn().mockResolvedValue({ document: {} })
const mockGetInfoList = jest.fn().mockResolvedValue({ documents: [] })

const mockClient = {
  documents: {
    add: mockAdd,
    delete: mockDelete,
    getInfo: mockGetInfo,
    getInfoList: mockGetInfoList
  }
}

// Mock the ZeroEntropy client
jest.mock('@/lib/zeroentropy/client', () => ({
  getZeroEntropyClient: jest.fn(() => mockClient)
}))

// Mock the segment-metadata module
jest.mock('@/lib/zeroentropy/segment-metadata', () => ({
  createPageContent: jest.fn((segment) => ({
    searchableText: segment.text
  }))
}))

import { indexTranscriptPage, batchIndexPages, deleteVideoPages } from '@/lib/zeroentropy/pages'

describe('ZeroEntropy Pages - Chunking Support', () => {
  const mockCollectionName = 'test-collection'

  beforeEach(() => {
    mockAdd.mockClear()
    mockDelete.mockClear()
    mockGetInfo.mockClear()
    mockGetInfoList.mockClear()
    mockAdd.mockResolvedValue({})
    mockDelete.mockResolvedValue({})
    mockGetInfo.mockResolvedValue({ document: {} })
    mockGetInfoList.mockResolvedValue({ documents: [] })
  })

  describe('indexTranscriptPage', () => {
    it('should index a chunk with chunk-specific metadata', async () => {
      const chunk: ProcessedTranscriptSegment = {
        text: 'This is a test chunk with multiple segments combined.',
        start: 0,
        end: 10,
        duration: 10,
        userId: 'user-123',
        videoId: 'video-456',
        videoTitle: 'Test Video',
        chunkIndex: 0,
        segmentCount: 5,
        language: 'en'
      }

      const pageId = await indexTranscriptPage(chunk, mockCollectionName)

      expect(pageId).toBe('video-456-chunk0')

      expect(mockAdd).toHaveBeenCalledWith({
        collection_name: mockCollectionName,
        path: 'video-456-chunk0',
        content: {
          type: 'text',
          text: chunk.text
        },
        metadata: expect.objectContaining({
          videoId: 'video-456',
          userId: 'user-123',
          videoTitle: 'Test Video',
          startTime: '0',
          endTime: '10',
          duration: '10',
          language: 'en',
          chunkIndex: '0',
          segmentCount: '5',
          isChunk: 'true'
        })
      })
    })

    it('should index a legacy segment with backward compatibility', async () => {
      const segment: ProcessedTranscriptSegment = {
        text: 'This is a single segment.',
        start: 0,
        end: 5,
        duration: 5,
        userId: 'user-123',
        videoId: 'video-456',
        videoTitle: 'Test Video',
        segmentIndex: 0,
        language: 'en'
      }

      const pageId = await indexTranscriptPage(segment, mockCollectionName)

      expect(pageId).toBe('video-456-0')

      expect(mockAdd).toHaveBeenCalledWith({
        collection_name: mockCollectionName,
        path: 'video-456-0',
        content: {
          type: 'text',
          text: segment.text
        },
        metadata: expect.objectContaining({
          videoId: 'video-456',
          userId: 'user-123',
          videoTitle: 'Test Video',
          startTime: '0',
          endTime: '5',
          duration: '5',
          language: 'en',
          segmentIndex: '0',
          isChunk: 'false'
        })
      })
    })

    it('should generate correct chunk IDs for multiple chunks', async () => {
      const chunks: ProcessedTranscriptSegment[] = [
        {
          text: 'Chunk 0',
          start: 0,
          end: 10,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 0,
          segmentCount: 3,
          language: 'en'
        },
        {
          text: 'Chunk 1',
          start: 8,
          end: 18,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 1,
          segmentCount: 3,
          language: 'en'
        }
      ]

      const pageId0 = await indexTranscriptPage(chunks[0], mockCollectionName)
      const pageId1 = await indexTranscriptPage(chunks[1], mockCollectionName)

      expect(pageId0).toBe('video-456-chunk0')
      expect(pageId1).toBe('video-456-chunk1')
    })
  })

  describe('batchIndexPages', () => {
    it('should batch index multiple chunks', async () => {
      const chunks: ProcessedTranscriptSegment[] = [
        {
          text: 'Chunk 0',
          start: 0,
          end: 10,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 0,
          segmentCount: 3,
          language: 'en'
        },
        {
          text: 'Chunk 1',
          start: 8,
          end: 18,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 1,
          segmentCount: 3,
          language: 'en'
        },
        {
          text: 'Chunk 2',
          start: 16,
          end: 26,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 2,
          segmentCount: 3,
          language: 'en'
        }
      ]

      const pageIds = await batchIndexPages(chunks, mockCollectionName)

      expect(pageIds).toHaveLength(3)
      expect(pageIds).toEqual([
        'video-456-chunk0',
        'video-456-chunk1',
        'video-456-chunk2'
      ])
    })

    it('should handle empty chunks array', async () => {
      const pageIds = await batchIndexPages([], mockCollectionName)
      expect(pageIds).toEqual([])
    })

    it('should continue processing on individual failures', async () => {
      let callCount = 0
      mockAdd.mockImplementation(() => {
        callCount++
        if (callCount === 2) {
          throw new Error('Failed to index')
        }
        return Promise.resolve({})
      })

      const chunks: ProcessedTranscriptSegment[] = [
        {
          text: 'Chunk 0',
          start: 0,
          end: 10,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 0,
          segmentCount: 3,
          language: 'en'
        },
        {
          text: 'Chunk 1',
          start: 8,
          end: 18,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 1,
          segmentCount: 3,
          language: 'en'
        },
        {
          text: 'Chunk 2',
          start: 16,
          end: 26,
          duration: 10,
          userId: 'user-123',
          videoId: 'video-456',
          videoTitle: 'Test Video',
          chunkIndex: 2,
          segmentCount: 3,
          language: 'en'
        }
      ]

      const pageIds = await batchIndexPages(chunks, mockCollectionName)

      // Should have 2 successful (chunk 1 failed)
      expect(pageIds).toHaveLength(2)
    })
  })

  describe('deleteVideoPages', () => {
    it('should delete all pages for a video (chunk format)', async () => {
      mockGetInfoList.mockResolvedValue({
        documents: [
          { path: 'video-456-chunk0' },
          { path: 'video-456-chunk1' },
          { path: 'video-456-chunk2' },
          { path: 'other-video-789-chunk0' }
        ]
      })

      const deletedCount = await deleteVideoPages('video-456', mockCollectionName)

      expect(deletedCount).toBe(3)
      expect(mockDelete).toHaveBeenCalledTimes(3)
    })

    it('should delete all pages for a video (segment format)', async () => {
      mockGetInfoList.mockResolvedValue({
        documents: [
          { path: 'video-456-0' },
          { path: 'video-456-1' },
          { path: 'video-456-2' },
          { path: 'other-video-789-0' }
        ]
      })

      const deletedCount = await deleteVideoPages('video-456', mockCollectionName)

      expect(deletedCount).toBe(3)
      expect(mockDelete).toHaveBeenCalledTimes(3)
    })
  })
})
