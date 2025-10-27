/**
 * Unit tests for Langfuse client
 * 
 * Tests cover:
 * - Configuration checking
 * - Graceful degradation without credentials
 */

describe('Langfuse Client', () => {
  describe('Configuration Checking', () => {
    it('should export isLangfuseConfigured function', () => {
      // Dynamic import to avoid initialization issues
      const { isLangfuseConfigured } = require('@/lib/langfuse/client')
      expect(typeof isLangfuseConfigured).toBe('function')
    })

    it('should not throw when checking configuration', () => {
      const { isLangfuseConfigured } = require('@/lib/langfuse/client')
      expect(() => isLangfuseConfigured()).not.toThrow()
    })

    it('should return a boolean value', () => {
      const { isLangfuseConfigured } = require('@/lib/langfuse/client')
      const result = isLangfuseConfigured()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Graceful Degradation', () => {
    it('should export client without errors', () => {
      const { langfuse } = require('@/lib/langfuse/client')
      expect(langfuse).toBeDefined()
    })

    it('should have trace method', () => {
      const { langfuse } = require('@/lib/langfuse/client')
      expect(typeof langfuse.trace).toBe('function')
    })
  })
})

