/**
 * Unit tests for Langfuse AI SDK integration helpers
 * 
 * Tests cover:
 * - shouldTrace() helper function
 * - Integration with isLangfuseConfigured
 */

import { shouldTrace } from '@/lib/langfuse/ai-sdk'
import { isLangfuseConfigured } from '@/lib/langfuse/client'

jest.mock('@/lib/langfuse/client')

describe('Langfuse AI SDK Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('shouldTrace', () => {
    it('should return true when Langfuse is configured', () => {
      ;(isLangfuseConfigured as jest.Mock).mockReturnValue(true)

      expect(shouldTrace()).toBe(true)
      expect(isLangfuseConfigured).toHaveBeenCalled()
    })

    it('should return false when Langfuse is not configured', () => {
      ;(isLangfuseConfigured as jest.Mock).mockReturnValue(false)

      expect(shouldTrace()).toBe(false)
      expect(isLangfuseConfigured).toHaveBeenCalled()
    })
  })
})

