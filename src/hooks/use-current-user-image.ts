/**
 * useCurrentUserImage Hook
 *
 * Custom hook to extract the profile image/avatar URL from the current user's metadata.
 * Supports multiple OAuth providers which may store avatar URLs in different metadata fields.
 *
 * The hook checks multiple possible avatar field names in the following priority order:
 * 1. user_metadata.avatar_url (GitHub, many providers)
 * 2. user_metadata.picture (Google)
 * 3. user_metadata.image_url (alternative naming)
 *
 * For magic link users (passwordless email), there is no avatar URL, so it returns null.
 * Components should implement a fallback (e.g., initials) when this hook returns null.
 *
 * Usage:
 * ```tsx
 * const profileImage = useCurrentUserImage()
 *
 * if (profileImage) {
 *   return <img src={profileImage} alt="Profile" />
 * } else {
 *   return <AvatarFallback>{initials}</AvatarFallback>
 * }
 * ```
 *
 * @returns {string | null} The user's avatar URL, or null if no avatar is available
 */

'use client'

import { useAuth } from '@/contexts/AuthContext'

/**
 * Extract the current user's profile image URL from OAuth provider metadata
 *
 * This hook attempts to find the user's avatar/profile image by checking
 * multiple possible metadata field names used by different OAuth providers:
 * - avatar_url: Used by GitHub and other providers
 * - picture: Used by Google OAuth
 * - image_url: Alternative field name used by some providers
 *
 * The hook checks each field in priority order and returns the first non-empty value found.
 * If no avatar URL is found (e.g., for magic link users), it returns null.
 *
 * @returns {string | null} The avatar URL if found, otherwise null
 */
export function useCurrentUserImage(): string | null {
  const { user } = useAuth()

  if (!user?.user_metadata) {
    return null
  }

  // Check multiple possible avatar field names (different providers use different names)
  const avatarUrl =
    user.user_metadata.avatar_url ||
    user.user_metadata.picture ||
    user.user_metadata.image_url ||
    null

  return avatarUrl
}
