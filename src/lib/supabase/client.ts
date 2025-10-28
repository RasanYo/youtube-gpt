/**
 * Supabase Browser Client
 *
 * This module provides a browser-side Supabase client for client components.
 * Uses @supabase/ssr for cookie-based authentication that works seamlessly
 * with server-side routes.
 *
 * Key Features:
 * - Cookie-based session management (not localStorage)
 * - Automatic cookie handling for API routes
 * - Session persists across page reloads
 * - Works with server-side rendering
 * - PKCE flow enabled by default for enhanced security
 *
 * Usage:
 * ```typescript
 * import { supabase } from '@/lib/supabase/client'
 *
 * // In client components
 * const { data, error } = await supabase.from('videos').select('*')
 * await supabase.auth.signInWithOtp({ email: 'user@example.com' })
 * ```
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local',
  )
}

/**
 * Browser Supabase client instance using @supabase/ssr
 *
 * This client:
 * - Stores session in cookies (automatically handled by @supabase/ssr)
 * - Works seamlessly with server-side API routes
 * - Uses PKCE flow by default for enhanced security
 * - Automatically manages cookie refresh
 * - No need to configure persistSession, autoRefreshToken, etc. (handled by SSR package)
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

/**
 * Type helper for the Supabase client instance
 * Use this when you need to type-hint the client in function parameters
 */
export type SupabaseClient = typeof supabase
