/**
 * Unit Tests for Authentication Helper Functions
 *
 * Tests the auth helper functions in src/lib/supabase/auth.ts
 * Validates magic link authentication, sign out, and user/session retrieval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signInWithMagicLink, signOut, getCurrentUser, getCurrentSession } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
  },
}));

describe('Authentication Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signInWithMagicLink', () => {
    it('should send magic link with correct email and redirect URL', async () => {
      const mockEmail = 'test@example.com';
      const mockData = { user: null, session: null };

      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await signInWithMagicLink(mockEmail);

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: mockEmail,
        options: {
          emailRedirectTo: expect.stringContaining(window.location.origin),
        },
      });
      expect(result).toEqual(mockData);
    });

    it('should throw error when magic link fails', async () => {
      const mockError = new Error('Failed to send magic link');

      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(signInWithMagicLink('test@example.com')).rejects.toThrow(
        'Failed to send magic link'
      );
    });

    it('should use correct redirect URL format', async () => {
      const mockEmail = 'user@domain.com';

      vi.mocked(supabase.auth.signInWithOtp).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });

      await signInWithMagicLink(mockEmail);

      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            emailRedirectTo: 'http://localhost:8080/',
          },
        })
      );
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut method', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await signOut();

      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should throw error when sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: mockError });

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });

    it('should not throw when sign out succeeds', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      await expect(signOut()).resolves.not.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    const mockUser: Partial<User> = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    it('should return current user when authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser as User },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toEqual(mockUser);
      expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    });

    it('should return null when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const user = await getCurrentUser();

      expect(user).toBeNull();
    });

    it('should throw error when token validation fails', async () => {
      const mockError = new Error('Invalid token');

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: mockError,
      });

      await expect(getCurrentUser()).rejects.toThrow('Invalid token');
    });
  });

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
    };

    it('should return current session when it exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession as Session },
        error: null,
      });

      const session = await getCurrentSession();

      expect(session).toEqual(mockSession);
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
    });

    it('should return null when no session exists', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await getCurrentSession();

      expect(session).toBeNull();
    });

    it('should not throw error even if session retrieval fails', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: new Error('Session error'),
      });

      const session = await getCurrentSession();

      expect(session).toBeNull();
    });
  });
});
