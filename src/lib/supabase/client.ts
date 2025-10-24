/**
 * Supabase Client Singleton
 *
 * This module provides a singleton instance of the Supabase client for use
 * throughout the React application.
 *
 * Configuration:
 * - PKCE Flow: Enhanced security for single-page applications by using
 *   Proof Key for Code Exchange instead of implicit grant flow
 * - Session Persistence: Auth state is stored in localStorage to maintain
 *   sessions across page refreshes and browser restarts
 * - Auto Refresh: Automatically refreshes auth tokens before expiration
 * - Session Detection: Detects auth callbacks in URL (magic link redirects)
 *
 * Usage:
 * ```typescript
 * import { supabase } from '@/lib/supabase/client'
 *
 * // Query data
 * const { data, error } = await supabase.from('videos').select('*')
 *
 * // Auth operations
 * await supabase.auth.signInWithOtp({ email: 'user@example.com' })
 * ```
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
      'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local',
  )
}

/**
 * Singleton Supabase client instance
 *
 * This client is configured with:
 * - persistSession: true - Stores auth tokens in localStorage
 * - autoRefreshToken: true - Refreshes tokens automatically before expiration
 * - detectSessionInUrl: true - Handles magic link callback URLs
 * - flowType: 'pkce' - Uses Proof Key for Code Exchange for enhanced security
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

/**
 * Database type - using Supabase generated types
 * This will be updated when we generate types from our Supabase schema
 */
export type Database = any

/**
 * Type helper for the Supabase client instance
 * Use this when you need to type-hint the client in function parameters
 */
export type SupabaseClient = typeof supabase
