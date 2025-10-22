/**
 * Unit Tests for AuthContext
 *
 * Tests the AuthContext provider and useAuth hook
 * Validates authentication state management and Supabase integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

describe('AuthContext', () => {
  let mockSubscription: { unsubscribe: () => void }

  beforeEach(() => {
    mockSubscription = { unsubscribe: vi.fn() }

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleError.mockRestore()
    })

    it('should provide auth context when inside AuthProvider', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current).toBeDefined()
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(typeof result.current.login).toBe('function')
      expect(typeof result.current.logout).toBe('function')
    })
  })

  describe('Initial session loading', () => {
    it('should start with isLoading true', () => {
      vi.mocked(supabase.auth.getSession).mockImplementation(
        () =>
          new Promise(() => {
            // Never resolve to keep loading state
          }),
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should load initial session on mount', async () => {
      const mockUser: Partial<User> = {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      const mockSession: Partial<Session> = {
        access_token: 'token123',
        user: mockUser as User,
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })

    it('should handle null session on mount', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    it('should set isLoading to false after session loads', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })
  })

  describe('Auth state change listener', () => {
    it('should subscribe to auth state changes on mount', () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledTimes(1)
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(
        expect.any(Function),
      )
    })

    it('should unsubscribe on unmount', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(mockSubscription.unsubscribe).not.toHaveBeenCalled()
      })

      unmount()

      expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(1)
    })

    it('should update user state when auth state changes to signed in', async () => {
      let authStateCallback: (event: string, session: Session | null) => void

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(
        (callback) => {
          authStateCallback = callback
          return { data: { subscription: mockSubscription } }
        },
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.user).toBeNull()

      const mockUser: Partial<User> = {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      const mockSession: Partial<Session> = {
        access_token: 'token123',
        user: mockUser as User,
      }

      act(() => {
        authStateCallback!('SIGNED_IN', mockSession as Session)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })

    it('should clear user state when auth state changes to signed out', async () => {
      let authStateCallback: (event: string, session: Session | null) => void

      const mockUser: Partial<User> = {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      const mockSession: Partial<Session> = {
        access_token: 'token123',
        user: mockUser as User,
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      })

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation(
        (callback) => {
          authStateCallback = callback
          return { data: { subscription: mockSubscription } }
        },
      )

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
      })

      act(() => {
        authStateCallback!('SIGNED_OUT', null)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })
  })

  describe('login method', () => {
    it('should call supabase signInWithOtp with correct parameters', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: {},
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com')
      })

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: 'http://localhost:8080/',
        },
      })
    })

    it('should throw error when login fails', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const mockError = new Error('Login failed')
      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: {},
        error: mockError,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.login('test@example.com')
        }),
      ).rejects.toThrow('Login failed')
    })

    it('should not update state immediately after login call', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: {},
        error: null,
      })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login('test@example.com')
      })

      // User should still be null until auth state change event fires
      expect(result.current.user).toBeNull()
    })
  })

  describe('logout method', () => {
    it('should call supabase signOut', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1)
    })

    it('should throw error when logout fails', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      })

      const mockError = new Error('Logout failed')
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: mockError })

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.logout()
        }),
      ).rejects.toThrow('Logout failed')
    })
  })
})
