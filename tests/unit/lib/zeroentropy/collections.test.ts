// Mock ZeroEntropy client before importing the functions
const mockCollections = {
  add: jest.fn(),
  getList: jest.fn(),
  delete: jest.fn()
}

const mockClient = {
  collections: mockCollections
}

jest.mock('@/lib/zeroentropy/client', () => ({
  getZeroEntropyClient: jest.fn(() => mockClient)
}))

import {
  createUserCollection,
  collectionExists,
  getOrCreateUserCollection,
  deleteUserCollection,
  listUserCollections
} from '@/lib/zeroentropy/collections'

describe('ZeroEntropy Collection Management Tests', () => {
  const mockUserId = 'test-user-123'
  const mockCollectionName = `user-${mockUserId}-videos`

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementations
    mockCollections.add.mockClear()
    mockCollections.getList.mockClear()
    mockCollections.delete.mockClear()
  })

  describe('createUserCollection', () => {
    it('should create a new collection successfully', async () => {
      mockCollections.add.mockResolvedValue({ message: 'Success!' })
      
      const result = await createUserCollection(mockUserId)
      
      expect(result).toBe(mockCollectionName)
      expect(mockCollections.add).toHaveBeenCalledWith({
        collection_name: mockCollectionName
      })
    })

    it('should return collection name if collection already exists', async () => {
      const error = new Error('Collection already exists')
      ;(error as any).status = 409
      mockCollections.add.mockRejectedValue(error)
      
      const result = await createUserCollection(mockUserId)
      
      expect(result).toBe(mockCollectionName)
    })

    it('should throw error for other failures', async () => {
      const error = new Error('API Error')
      ;(error as any).status = 500
      mockCollections.add.mockRejectedValue(error)
      
      await expect(createUserCollection(mockUserId)).rejects.toThrow('Failed to create collection: API Error')
    })
  })

  describe('collectionExists', () => {
    it('should return true if collection exists', async () => {
      mockCollections.getList.mockResolvedValue({
        collection_names: [mockCollectionName, 'other-collection']
      })
      
      const result = await collectionExists(mockCollectionName)
      
      expect(result).toBe(true)
      expect(mockCollections.getList).toHaveBeenCalled()
    })

    it('should return false if collection does not exist', async () => {
      mockCollections.getList.mockResolvedValue({
        collection_names: ['other-collection']
      })
      
      const result = await collectionExists(mockCollectionName)
      
      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      mockCollections.getList.mockRejectedValue(new Error('API Error'))
      
      const result = await collectionExists(mockCollectionName)
      
      expect(result).toBe(false)
    })
  })

  describe('getOrCreateUserCollection', () => {
    it('should return existing collection if it exists', async () => {
      mockCollections.getList.mockResolvedValue({
        collection_names: [mockCollectionName]
      })
      
      const result = await getOrCreateUserCollection(mockUserId)
      
      expect(result).toBe(mockCollectionName)
      expect(mockCollections.add).not.toHaveBeenCalled()
    })

    it('should create collection if it does not exist', async () => {
      mockCollections.getList.mockResolvedValue({
        collection_names: []
      })
      mockCollections.add.mockResolvedValue({ message: 'Success!' })
      
      const result = await getOrCreateUserCollection(mockUserId)
      
      expect(result).toBe(mockCollectionName)
      expect(mockCollections.add).toHaveBeenCalledWith({
        collection_name: mockCollectionName
      })
    })
  })

  describe('deleteUserCollection', () => {
    it('should delete collection successfully', async () => {
      mockCollections.delete.mockResolvedValue({ message: 'Success!' })
      
      const result = await deleteUserCollection(mockUserId)
      
      expect(result).toBe(true)
      expect(mockCollections.delete).toHaveBeenCalledWith({
        collection_name: mockCollectionName
      })
    })

    it('should return true if collection does not exist', async () => {
      const error = new Error('Collection not found')
      ;(error as any).status = 404
      mockCollections.delete.mockRejectedValue(error)
      
      const result = await deleteUserCollection(mockUserId)
      
      expect(result).toBe(true)
    })

    it('should throw error for other failures', async () => {
      const error = new Error('API Error')
      ;(error as any).status = 500
      mockCollections.delete.mockRejectedValue(error)
      
      await expect(deleteUserCollection(mockUserId)).rejects.toThrow('Failed to delete collection: API Error')
    })
  })

  describe('listUserCollections', () => {
    it('should return user collections only', async () => {
      mockCollections.getList.mockResolvedValue({
        collection_names: [
          `user-${mockUserId}-videos`,
          'user-other-user-videos',
          'some-other-collection'
        ]
      })
      
      const result = await listUserCollections(mockUserId)
      
      expect(result).toEqual([`user-${mockUserId}-videos`])
    })

    it('should return empty array if no user collections exist', async () => {
      mockCollections.getList.mockResolvedValue({
        collection_names: ['other-collection']
      })
      
      const result = await listUserCollections(mockUserId)
      
      expect(result).toEqual([])
    })

    it('should throw error on API failure', async () => {
      mockCollections.getList.mockRejectedValue(new Error('API Error'))
      
      await expect(listUserCollections(mockUserId)).rejects.toThrow('Failed to list collections: API Error')
    })
  })
})
