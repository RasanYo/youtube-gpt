/**
 * Authentication Helper Functions
 *
 * Centralized authentication operations for the YouTube GPT application.
 * These helpers wrap Supabase Auth methods with consistent error handling
 * and configuration.
 */

import { supabase } from './client'

/**
 * Send a magic link to the user's email for passwordless authentication
 *
 * @param email - User's email address
 * @returns Promise that resolves when magic link is sent
 * @throws Error if email sending fails
 *
 * @example
 * ```typescript
 * try {
 *   await signInWithMagicLink('user@example.com');
 *   // Show success message: "Check your email for the magic link"
 * } catch (error) {
 *   // Handle error: "Failed to send magic link"
 * }
 * ```
 */
export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  })

  if (error) throw error
  return data
}

/**
 * Sign out the current user and clear their session
 *
 * @returns Promise that resolves when user is signed out
 * @throws Error if sign out fails
 *
 * @example
 * ```typescript
 * try {
 *   await signOut();
 *   // Redirect to login page
 * } catch (error) {
 *   // Handle error: "Failed to sign out"
 * }
 * ```
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get the current authenticated user
 *
 * This method verifies the user's JWT token and returns fresh user data.
 * Use this when you need to verify authentication status programmatically.
 *
 * @returns Promise that resolves with the current user or null
 * @throws Error if token validation fails
 *
 * @example
 * ```typescript
 * try {
 *   const user = await getCurrentUser();
 *   if (user) {
 *     console.log('Authenticated as:', user.email);
 *   } else {
 *     console.log('Not authenticated');
 *   }
 * } catch (error) {
 *   // Handle error: "Failed to get user"
 * }
 * ```
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  return user
}

/**
 * Get the current session
 *
 * This returns the cached session from localStorage without validating
 * the JWT token. Use this for quick auth checks.
 *
 * @returns Promise that resolves with the current session or null
 *
 * @example
 * ```typescript
 * const session = await getCurrentSession();
 * if (session) {
 *   console.log('Session expires at:', session.expires_at);
 * }
 * ```
 */
export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}
