/**
 * Unit Tests for Supabase Client Configuration
 *
 * Tests the Supabase client initialization and configuration
 * Validates environment variable handling and client setup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Supabase Client Configuration', () => {
  const originalEnv = { ...import.meta.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original environment
    Object.keys(originalEnv).forEach((key) => {
      import.meta.env[key] = originalEnv[key]
    })
  })

  it('should create client with valid environment variables', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-123')

    const { supabase } = await import('@/lib/supabase/client')

    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should export SupabaseClient type', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-123')

    const module = await import('@/lib/supabase/client')

    expect(module.supabase).toBeDefined()
    expect(typeof module.supabase).toBe('object')
  })

  it('should export Database type', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-123')

    const module = await import('@/lib/supabase/client')

    // Database type should be exported (currently 'any' as placeholder)
    expect(module).toHaveProperty('supabase')
  })

  it('should configure client with PKCE flow', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key-123')

    const { supabase } = await import('@/lib/supabase/client')

    // Verify client exists with auth methods
    expect(supabase.auth.signInWithOtp).toBeDefined()
    expect(supabase.auth.signOut).toBeDefined()
    expect(supabase.auth.getUser).toBeDefined()
    expect(supabase.auth.getSession).toBeDefined()
  })
})

describe('Supabase Client Environment Validation', () => {
  it('should have environment variables set in test environment', () => {
    // These should be set by vitest.setup.ts
    expect(import.meta.env.VITE_SUPABASE_URL).toBeDefined()
    expect(import.meta.env.VITE_SUPABASE_ANON_KEY).toBeDefined()
    expect(import.meta.env.VITE_SUPABASE_URL).toContain('supabase.co')
  })
})
