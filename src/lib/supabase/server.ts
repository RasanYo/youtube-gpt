/**
 * Supabase Server-Side Client Helper
 *
 * This module provides a server-side Supabase client for use in API routes,
 * Server Components, and Server Actions. It uses the @supabase/ssr package
 * which is specifically designed for server-side rendering and cookie-based
 * authentication.
 *
 * Key Features:
 * - Cookie-based session management
 * - Automatic token refresh
 * - Works in server-side context (API routes, Server Components)
 * - Proper authentication flow for SSR/API handlers
 *
 * Usage:
 * ```typescript
 * import { createClient } from '@/lib/supabase/server'
 *
 * // In API route or Server Component
 * const supabase = await createClient()
 * const { data, error } = await supabase.auth.getUser()
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
  )
}

/**
 * Creates a server-side Supabase client with cookie-based authentication
 *
 * This function should be called in the context of:
 * - API route handlers
 * - Server Components
 * - Server Actions
 *
 * The client uses cookies to maintain the authentication session,
 * which is the recommended approach for SSR applications.
 *
 * @returns {Promise<SupabaseClient>} An authenticated Supabase client instance
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   
 *   if (!user) {
 *     return new Response('Unauthorized', { status: 401 })
 *   }
 *   
 *   // Use client for database operations
 *   const { data } = await supabase.from('videos').select('*')
 * }
 * ```
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch (error) {
          // The setAll method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.warn('Failed to set cookies in server component:', error)
        }
      },
    },
  })
}

