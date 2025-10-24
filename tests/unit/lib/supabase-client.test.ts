// Mock environment variables
const originalEnv = process.env

describe('Supabase Client Configuration Tests', () => {
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
    it('1.5.1 should throw error when NEXT_SUPABASE_URL is missing', () => {
      // Remove the environment variable
      delete process.env.NEXT_SUPABASE_URL
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      expect(() => {
        require('@/lib/supabase/client')
      }).toThrow(
        'Missing Supabase environment variables. ' +
          'Please ensure NEXT_SUPABASE_URL and NEXT_SUPABASE_ANON_KEY are set in .env.local'
      )
    })

    it('1.5.2 should throw error when NEXT_SUPABASE_ANON_KEY is missing', () => {
      // Remove the environment variable
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_SUPABASE_ANON_KEY

      expect(() => {
        require('@/lib/supabase/client')
      }).toThrow(
        'Missing Supabase environment variables. ' +
          'Please ensure NEXT_SUPABASE_URL and NEXT_SUPABASE_ANON_KEY are set in .env.local'
      )
    })

    it('1.5.3 should throw error when both environment variables are missing', () => {
      // Remove both environment variables
      delete process.env.NEXT_SUPABASE_URL
      delete process.env.NEXT_SUPABASE_ANON_KEY

      expect(() => {
        require('@/lib/supabase/client')
      }).toThrow(
        'Missing Supabase environment variables. ' +
          'Please ensure NEXT_SUPABASE_URL and NEXT_SUPABASE_ANON_KEY are set in .env.local'
      )
    })

    it('1.5.4 should not throw error when both environment variables are present', () => {
      // Set both environment variables
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      // This should not throw
      expect(() => {
        require('@/lib/supabase/client')
      }).not.toThrow()
    })
  })

  describe('Client Initialization', () => {
    beforeEach(() => {
      // Set up environment variables for successful initialization
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'
    })

    it('1.5.5 should use correct environment variables', () => {
      // Set environment variables
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      // Import the module
      const clientModule = require('@/lib/supabase/client')

      // Check that the module exports supabase
      expect(clientModule.supabase).toBeDefined()
      expect(clientModule.supabase).not.toBeNull()
    })

    it('1.5.6 should export supabase client instance', () => {
      // Set environment variables
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      // Import the module
      const { supabase } = require('@/lib/supabase/client')

      expect(supabase).toBeDefined()
      expect(supabase).not.toBeNull()
    })

    it('1.5.7 should have correct client structure', () => {
      // Set environment variables
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      // Import the module
      const { supabase } = require('@/lib/supabase/client')

      // Check that supabase has the expected structure
      expect(supabase).toBeDefined()
      expect(supabase.auth).toBeDefined()
      expect(supabase.from).toBeDefined()
      expect(typeof supabase.from).toBe('function')
    })
  })

  describe('Auth Configuration', () => {
    beforeEach(() => {
      // Set up environment variables for successful initialization
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'
    })

    it('1.5.8 should have auth property on supabase client', () => {
      // Set environment variables
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      // Import the module
      const { supabase } = require('@/lib/supabase/client')

      expect(supabase.auth).toBeDefined()
      expect(supabase.auth).not.toBeNull()
    })

    it('1.5.9 should have required auth methods', () => {
      // Set environment variables
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      // Import the module
      const { supabase } = require('@/lib/supabase/client')

      expect(supabase.auth.signInWithOtp).toBeDefined()
      expect(supabase.auth.signOut).toBeDefined()
      expect(supabase.auth.getSession).toBeDefined()
      expect(supabase.auth.onAuthStateChange).toBeDefined()
    })

    it('1.5.10 should have database query method', () => {
      // Set environment variables
      process.env.NEXT_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_SUPABASE_ANON_KEY = 'test-anon-key'

      // Import the module
      const { supabase } = require('@/lib/supabase/client')

      expect(supabase.from).toBeDefined()
      expect(typeof supabase.from).toBe('function')
    })
  })
})
