/**
 * CurrentUserAvatar Component
 *
 * Displays the current user's avatar with automatic fallback to initials.
 * Uses OAuth provider profile images when available (Google, GitHub),
 * or generates initials from the user's name/email for magic link users.
 *
 * Features:
 * - Displays OAuth profile pictures automatically
 * - Generates initials from display name (e.g., "John Doe" → "JD")
 * - Falls back to email initials for magic link users
 * - Uses shadcn/ui Avatar components
 * - Responsive and accessible
 *
 * The component follows Supabase UI patterns and integrates seamlessly with
 * the existing authentication system.
 *
 * Usage:
 * ```tsx
 * import { CurrentUserAvatar } from '@/components/auth/current-user-avatar'
 *
 * <CurrentUserAvatar />
 * ```
 */

'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'

/**
 * Generate initials from a display name
 *
 * Takes a name and generates initials by:
 * 1. Splitting the name by spaces
 * 2. Taking the first letter of each word
 * 3. Uppercasing and joining the letters
 * 4. Limiting to 2 characters for visual balance
 *
 * Examples:
 * - "John Doe" → "JD"
 * - "Alice" → "A"
 * - "Bob Smith Jones" → "BS"
 *
 * @param {string} name - The display name to convert to initials
 * @returns {string} The generated initials (max 2 characters, uppercase)
 */
function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/)

  if (parts.length === 0) {
    return 'U' // Default to "U" for "User"
  }

  if (parts.length === 1) {
    // Single word: take first letter
    return parts[0][0].toUpperCase()
  }

  // Multiple words: take first letter of first two words
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/**
 * CurrentUserAvatar Component
 *
 * Renders an avatar for the currently authenticated user with the following behavior:
 * - If OAuth provider supplies an avatar URL, displays the profile image
 * - If no image is available, shows initials generated from the user's name
 * - For magic link users (email only), generates initials from email username
 *
 * The component uses the useCurrentUserImage and useCurrentUserName hooks
 * to extract user metadata from the authentication context.
 *
 * @returns {JSX.Element} The avatar component with image or initials fallback
 */
export function CurrentUserAvatar() {
  const profileImage = useCurrentUserImage()
  const userName = useCurrentUserName()
  const initials = generateInitials(userName)

  return (
    <Avatar>
      {profileImage && (
        <AvatarImage src={profileImage} alt={`${userName}'s profile picture`} />
      )}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}
