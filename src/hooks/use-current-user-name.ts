/**
 * useCurrentUserName Hook
 *
 * Custom hook to extract a display name for the current user from their profile data.
 * Implements a fallback chain to ensure a name is always returned.
 *
 * Fallback chain (in priority order):
 * 1. user_metadata.full_name (OAuth providers like Google provide full name)
 * 2. user_metadata.name (alternative field name)
 * 3. user_metadata.display_name (some providers use this field)
 * 4. user.email (email address as fallback for magic link users)
 * 5. Email username (part before @ symbol)
 * 6. "User" (ultimate fallback if everything else fails)
 *
 * This ensures all users have a presentable display name, whether they signed in
 * via OAuth (which provides full name) or magic link (which only provides email).
 *
 * Usage:
 * ```tsx
 * const userName = useCurrentUserName()
 * return <div>Welcome, {userName}!</div>
 * ```
 *
 * @returns {string} The user's display name (never returns null/undefined)
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'

/**
 * Extract the current user's display name with intelligent fallback logic
 *
 * This hook attempts to find the best display name for the user by checking
 * multiple metadata fields and falling back gracefully:
 * 1. Check full_name from OAuth metadata (Google, GitHub display name)
 * 2. Check name field as alternative
 * 3. Check display_name field
 * 4. Fall back to email address if no name is available
 * 5. Extract username from email (before @ symbol)
 * 6. Ultimate fallback to "User" if everything else fails
 *
 * @returns {string} A user-friendly display name (always returns a string, never null)
 */
export function useCurrentUserName(): string {
  const { user } = useAuth()

  if (!user) {
    return 'User'
  }

  // Try to get name from OAuth metadata first
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.display_name

  if (displayName) {
    return displayName
  }

  // Fall back to email if no display name
  if (user.email) {
    // For magic link users, show the email username (before @) for brevity
    const emailUsername = user.email.split('@')[0]
    return emailUsername || user.email
  }

  // Ultimate fallback
  return 'User'
}
