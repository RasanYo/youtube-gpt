describe('ZeroEntropy Client Configuration Tests', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv }
    // Clear module cache
    jest.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('Environment Variables', () => {
    it('should throw error when ZEROENTROPY_API_KEY is missing', () => {
      // Remove the environment variable
      delete process.env.ZEROENTROPY_API_KEY

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getZeroEntropyClient } = require('@/lib/zeroentropy/client')
        getZeroEntropyClient()
      }).toThrow('ZEROENTROPY_API_KEY environment variable is not set')
    })

    it('should not throw error when ZEROENTROPY_API_KEY is present', () => {
      // Set the environment variable
      process.env.ZEROENTROPY_API_KEY = 'test-api-key'

      // This should not throw
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@/lib/zeroentropy/client')
      }).not.toThrow()
    })
  })

  describe('Client Initialization', () => {
    beforeEach(() => {
      // Set up environment variables for successful initialization
      process.env.ZEROENTROPY_API_KEY = 'test-api-key'
    })

    it('should create client instance with correct API key', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getZeroEntropyClient } = require('@/lib/zeroentropy/client')
      
      const client = getZeroEntropyClient()
      expect(client).toBeDefined()
      expect(client).not.toBeNull()
    })

    it('should return same instance on multiple calls (singleton)', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getZeroEntropyClient } = require('@/lib/zeroentropy/client')
      
      const client1 = getZeroEntropyClient()
      const client2 = getZeroEntropyClient()
      
      expect(client1).toBe(client2)
    })

    it('should reset client instance when resetZeroEntropyClient is called', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getZeroEntropyClient, resetZeroEntropyClient } = require('@/lib/zeroentropy/client')
      
      const client1 = getZeroEntropyClient()
      resetZeroEntropyClient()
      const client2 = getZeroEntropyClient()
      
      expect(client1).not.toBe(client2)
    })

    it('should return true when ZeroEntropy is properly configured', () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isZeroEntropyConfigured } = require('@/lib/zeroentropy/client')
      
      expect(isZeroEntropyConfigured()).toBe(true)
    })

    it('should return false when ZeroEntropy is not configured', () => {
      delete process.env.ZEROENTROPY_API_KEY
      jest.resetModules()
      
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { isZeroEntropyConfigured } = require('@/lib/zeroentropy/client')
      
      expect(isZeroEntropyConfigured()).toBe(false)
    })
  })
})
