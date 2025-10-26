/**
 * AuthContext
 * 
 * Manages user authentication state and operations using Supabase Auth.
 * Provides user session, authentication methods, and loading states.
 * 
 * Features:
 * - Magic link OTP authentication (passwordless email login)
 * - Real-time session state synchronization with Supabase
 * - Hydration mismatch prevention for SSR compatibility
 * - Automatic session refresh and token management
 * - Logout functionality
 * 
 * The provider implements a hydration guard to prevent SSR/client mismatches
 * in Next.js by rendering with null state until client-side hydration completes.
 * 
 * @module AuthContext
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

/**
 * Type definition for the authentication context value
 */
interface AuthContextType {
  /** Currently authenticated user, or null if not authenticated */
  user: User | null
  /** Active Supabase session, or null if not authenticated */
  session: Session | null
  /** Send a magic link OTP to the user's email for passwordless login */
  login: (email: string) => Promise<void>
  /** Sign out the current user and clear session */
  logout: () => Promise<void>
  /** Loading state for initial session fetch */
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component
 * 
 * Provides authentication state and operations to child components.
 * Manages Supabase session lifecycle including initialization, real-time updates,
 * and cleanup. Implements hydration guards to prevent Next.js SSR mismatches.
 * 
 * The provider fetches the initial session on mount, subscribes to auth state changes,
 * and properly cleans up subscriptions on unmount.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated to enable rendering
    setIsHydrated(true)
    
    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      console.log('[AuthContext] Initial session loaded:', session ? 'authenticated' : 'not authenticated')
    }).catch((error) => {
      console.error('[AuthContext] Error getting initial session:', error)
      setSession(null)
      setUser(null)
      setIsLoading(false)
    })

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      console.log('[AuthContext] Auth state changed:', _event, session ? 'authenticated' : 'not authenticated')
    })

    // Clean up subscription on unmount
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Send a magic link OTP to the user's email for passwordless authentication
   * 
   * Sends an email containing a one-time link that logs the user in when clicked.
   * The user will be redirected to the homepage after successful authentication.
   * 
   * @param {string} email - Email address to send the magic link to
   * @throws {Error} If the Supabase API call fails (network error, invalid email, etc.)
   */
  const login = async (email: string) => {
    console.log('[AuthContext] Sending magic link to:', email)
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      },
    })

    if (error) {
      console.error('[AuthContext] Login error:', error)
      throw error
    }
    
    console.log('[AuthContext] Magic link sent successfully')
  }

  /**
   * Sign out the current user and clear the session
   * 
   * Logs the user out of the application and clears all session data.
   * The auth state change listener will automatically update the context state.
   * 
   * @throws {Error} If the Supabase API call fails
   */
  const logout = async () => {
    console.log('[AuthContext] Logging out user')
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('[AuthContext] Logout error:', error)
      throw error
    }
    
    console.log('[AuthContext] User logged out successfully')
  }

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return (
      <AuthContext.Provider value={{ user: null, session: null, login, logout, isLoading: true }}>
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={{ user, session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom hook to access the authentication context
 * 
 * Must be used within an AuthProvider component tree.
 * Provides access to current user, session, and authentication operations.
 * 
 * @throws {Error} If used outside of AuthProvider
 * @returns {AuthContextType} The authentication context value
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
