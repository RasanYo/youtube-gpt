/**
 * Unit Tests for Authentication Helper Functions
 *
 * Tests the auth helper functions in src/lib/supabase/auth.ts
 * Validates magic link authentication, sign out, and user/session retrieval
 */

// Jest globals are available without import
import {
  signInWithMagicLink,
  signOut,
  getCurrentUser,
  getCurrentSession,
} from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn(),
    },
  },
}))

describe('Authentication Helper Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signInWithMagicLink', () => {
    it('should send magic link with correct email and redirect URL', async () => {
      const mockEmail = 'test@example.com'
      const mockData = { user: null, session: null }

      (supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        data: mockData,
        error: null,
      })

      const result = await signInWithMagicLink(mockEmail)

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: mockEmail,
        options: {
          emailRedirectTo: expect.stringContaining(window.location.origin),
        },
      })
      expect(result).toEqual(mockData)
    })

    it('should throw error when magic link fails', async () => {
      const mockError = new Error('Failed to send magic link')

      (supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      })

      await expect(signInWithMagicLink('test@example.com')).rejects.toThrow(
        'Failed to send magic link',
      )
    })

    it('should use correct redirect URL format', async () => {
      const mockEmail = 'user@domain.com'

      (supabase.auth.signInWithOtp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      await signInWithMagicLink(mockEmail)

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            emailRedirectTo: 'http://localhost:8080/',
          },
        }),
      )
    })
  })

  describe('signOut', () => {
    it('should call supabase signOut method', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })

      await signOut()

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed')
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: mockError })

      await expect(signOut()).rejects.toThrow('Sign out failed')
    })

    it('should not throw when sign out succeeds', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })

      await expect(signOut()).resolves.not.toThrow()
    })
  })

  describe('getCurrentUser', () => {
    const mockUser: Partial<User> = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }

    it('should return current user when authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser as User },
        error: null,
      })

      const user = await getCurrentUser()

      expect(user).toEqual(mockUser)
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1)
    })

    it('should return null when not authenticated', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const user = await getCurrentUser()

      expect(user).toBeNull()
    })

    it('should throw error when token validation fails', async () => {
      const mockError = new Error('Invalid token')

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: mockError,
      })

      await expect(getCurrentUser()).rejects.toThrow('Invalid token')
    })
  })

  describe('getCurrentSession', () => {
    const mockSession: Partial<Session> = {
      access_token: 'token123',
      refresh_token: 'refresh123',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as User,
    }

    it('should return current session when it exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      })

      const session = await getCurrentSession()

      expect(session).toEqual(mockSession)
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1)
    })

    it('should return null when no session exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const session = await getCurrentSession()

      expect(session).toBeNull()
    })

    it('should not throw error even if session retrieval fails', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: new Error('Session error'),
      })

      const session = await getCurrentSession()

      expect(session).toBeNull()
    })
  })
})
