import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))

// Get the mocked functions
const mockSupabase = require('@/lib/supabase/client').supabase
const mockGetSession = mockSupabase.auth.getSession
const mockOnAuthStateChange = mockSupabase.auth.onAuthStateChange
const mockSignInWithOtp = mockSupabase.auth.signInWithOtp
const mockSignOut = mockSupabase.auth.signOut

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock window.location
const mockLocation = {
  href: 'http://localhost:3000/',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
}

// Mock window.location using Object.defineProperty
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
  configurable: true,
})

describe('Integration Tests - Complete Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    
    // Reset location
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/',
        origin: 'http://localhost:3000',
        pathname: '/',
        search: '',
        hash: '',
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
      },
      writable: true,
      configurable: true,
    })
  })

  describe('Complete Authentication Flow', () => {
    it('1.6.1 should complete full login flow (email → magic link → authenticated)', async () => {
      // Mock initial state - no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Mock successful login
      mockSignInWithOtp.mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      })

      // Mock auth state change listener
      let authStateCallback: any = null
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })

      const TestComponent = () => {
        const { user, session, login, isLoading } = useAuth()

        const handleLogin = async () => {
          try {
            await login('test@example.com')
          } catch (error) {
            console.error('Login error:', error)
          }
        }

        return (
          <div>
            <div data-testid="user-status">
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid="session-status">
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid="loading-status">
              {isLoading ? 'loading' : 'idle'}
            </div>
            <button onClick={handleLogin} data-testid="login-btn">
              Login
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially should be loading
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading')
      expect(screen.getByTestId('user-status')).toHaveTextContent('not authenticated')
      expect(screen.getByTestId('session-status')).toHaveTextContent('no session')

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
      })

      // Click login button
      const loginBtn = screen.getByTestId('login-btn')
      await userEvent.click(loginBtn)

      // Wait for login to complete
      await waitFor(() => {
        expect(mockSignInWithOtp).toHaveBeenCalledWith({
          email: 'test@example.com',
          options: {
            emailRedirectTo: 'http://localhost:3000/',
          },
        })
      })

      // Simulate successful authentication via auth state change
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 3600000, // 1 hour from now
      }

      act(() => {
        authStateCallback({
          event: 'SIGNED_IN',
          session: mockSession,
        })
      })

      // Wait for auth state to update
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('session-status')).toHaveTextContent('session active')
      })
    })

    it('1.6.2 should complete full logout flow (authenticated → logout → unauthenticated)', async () => {
      // Mock initial state - user is authenticated
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock successful logout
      mockSignOut.mockResolvedValue({ error: null })

      // Mock auth state change listener
      let authStateCallback: any = null
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })

      const TestComponent = () => {
        const { user, session, logout, isLoading } = useAuth()
        const [isLoggingOut, setIsLoggingOut] = React.useState(false)

        const handleLogout = async () => {
          setIsLoggingOut(true)
          try {
            await logout()
          } catch (error) {
            console.error('Logout error:', error)
          } finally {
            setIsLoggingOut(false)
          }
        }

        return (
          <div>
            <div data-testid="user-status">
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid="session-status">
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid="loading-status">
              {isLoading ? 'loading' : 'idle'}
            </div>
            <div data-testid="logout-status">
              {isLoggingOut ? 'logging out' : 'idle'}
            </div>
            <button onClick={handleLogout} data-testid="logout-btn">
              Logout
            </button>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
      })

      // Initially should be authenticated
      expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
      expect(screen.getByTestId('session-status')).toHaveTextContent('session active')

      // Click logout button
      const logoutBtn = screen.getByTestId('logout-btn')
      await userEvent.click(logoutBtn)

      // Should show logging out state
      expect(screen.getByTestId('logout-status')).toHaveTextContent('logging out')

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('logout-status')).toHaveTextContent('idle')
      })

      // Verify logout was called
      expect(mockSignOut).toHaveBeenCalled()

      // Simulate successful logout via auth state change
      act(() => {
        authStateCallback({
          event: 'SIGNED_OUT',
          session: null,
        })
      })

      // Wait for auth state to update
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('not authenticated')
        expect(screen.getByTestId('session-status')).toHaveTextContent('no session')
      })
    })

    it('1.6.3 should persist session across page refreshes', async () => {
      // Mock localStorage to return a stored session
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }

      // Mock getSession to return the stored session
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock auth state change listener
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      const TestComponent = () => {
        const { user, session, isLoading } = useAuth()

        return (
          <div>
            <div data-testid="user-status">
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid="session-status">
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid="loading-status">
              {isLoading ? 'loading' : 'idle'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially should be loading
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading')

      // Wait for session to be restored
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('session-status')).toHaveTextContent('session active')
      })

      // Verify getSession was called to restore session
      expect(mockGetSession).toHaveBeenCalled()
    })

    it('1.6.4 should persist session across browser restarts (localStorage)', async () => {
      // Mock localStorage to simulate browser restart
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }

      // Mock localStorage.getItem to return stored session data
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockSession))

      // Mock getSession to return the stored session
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock auth state change listener
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      const TestComponent = () => {
        const { user, session, isLoading } = useAuth()

        return (
          <div>
            <div data-testid="user-status">
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid="session-status">
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid="loading-status">
              {isLoading ? 'loading' : 'idle'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for session to be restored from localStorage
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('session-status')).toHaveTextContent('session active')
      })

      // Verify getSession was called to restore session
      expect(mockGetSession).toHaveBeenCalled()
    })

    it('1.6.5 should maintain consistent auth state across multiple tabs', async () => {
      // Mock initial state - no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Mock auth state change listener
      let authStateCallback: any = null
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })

      const TestComponent = ({ tabId }: { tabId: string }) => {
        const { user, session, isLoading } = useAuth()

        return (
          <div>
            <div data-testid={`user-status-${tabId}`}>
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid={`session-status-${tabId}`}>
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid={`loading-status-${tabId}`}>
              {isLoading ? 'loading' : 'idle'}
            </div>
          </div>
        )
      }

      // Render two tabs
      const { rerender: rerenderTab1 } = render(
        <AuthProvider>
          <TestComponent tabId="tab1" />
        </AuthProvider>
      )

      const { rerender: rerenderTab2 } = render(
        <AuthProvider>
          <TestComponent tabId="tab2" />
        </AuthProvider>
      )

      // Both tabs should start with no session
      await waitFor(() => {
        expect(screen.getByTestId('loading-status-tab1')).toHaveTextContent('idle')
        expect(screen.getByTestId('loading-status-tab2')).toHaveTextContent('idle')
      })

      expect(screen.getByTestId('user-status-tab1')).toHaveTextContent('not authenticated')
      expect(screen.getByTestId('user-status-tab2')).toHaveTextContent('not authenticated')

      // Simulate authentication in one tab
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }

      act(() => {
        authStateCallback({
          event: 'SIGNED_IN',
          session: mockSession,
        })
      })

      // Both tabs should update to authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('user-status-tab1')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('user-status-tab2')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('session-status-tab1')).toHaveTextContent('session active')
        expect(screen.getByTestId('session-status-tab2')).toHaveTextContent('session active')
      })
    })

    it('1.6.6 should propagate auth state updates across tabs', async () => {
      // Mock initial state - user is authenticated
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock auth state change listener
      let authStateCallback: any = null
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })

      const TestComponent = ({ tabId }: { tabId: string }) => {
        const { user, session, logout, isLoading } = useAuth()
        const [isLoggingOut, setIsLoggingOut] = React.useState(false)

        const handleLogout = async () => {
          setIsLoggingOut(true)
          try {
            await logout()
          } catch (error) {
            console.error('Logout error:', error)
          } finally {
            setIsLoggingOut(false)
          }
        }

        return (
          <div>
            <div data-testid={`user-status-${tabId}`}>
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid={`session-status-${tabId}`}>
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid={`loading-status-${tabId}`}>
              {isLoading ? 'loading' : 'idle'}
            </div>
            <div data-testid={`logout-status-${tabId}`}>
              {isLoggingOut ? 'logging out' : 'idle'}
            </div>
            <button onClick={handleLogout} data-testid={`logout-btn-${tabId}`}>
              Logout
            </button>
          </div>
        )
      }

      // Render two tabs
      render(
        <AuthProvider>
          <TestComponent tabId="tab1" />
        </AuthProvider>
      )

      render(
        <AuthProvider>
          <TestComponent tabId="tab2" />
        </AuthProvider>
      )

      // Both tabs should start authenticated
      await waitFor(() => {
        expect(screen.getByTestId('loading-status-tab1')).toHaveTextContent('idle')
        expect(screen.getByTestId('loading-status-tab2')).toHaveTextContent('idle')
      })

      expect(screen.getByTestId('user-status-tab1')).toHaveTextContent('authenticated: test@example.com')
      expect(screen.getByTestId('user-status-tab2')).toHaveTextContent('authenticated: test@example.com')

      // Logout from tab1
      const logoutBtn1 = screen.getByTestId('logout-btn-tab1')
      await userEvent.click(logoutBtn1)

      // Wait for logout to complete
      await waitFor(() => {
        expect(screen.getByTestId('logout-status-tab1')).toHaveTextContent('idle')
      })

      // Simulate logout via auth state change
      act(() => {
        authStateCallback({
          event: 'SIGNED_OUT',
          session: null,
        })
      })

      // Both tabs should update to unauthenticated state
      await waitFor(() => {
        expect(screen.getByTestId('user-status-tab1')).toHaveTextContent('not authenticated')
        expect(screen.getByTestId('user-status-tab2')).toHaveTextContent('not authenticated')
        expect(screen.getByTestId('session-status-tab1')).toHaveTextContent('no session')
        expect(screen.getByTestId('session-status-tab2')).toHaveTextContent('no session')
      })
    })

    it('1.6.7 should handle magic link callback URL correctly', async () => {
      // Mock URL with magic link callback
      mockLocation.href = 'http://localhost:3000/?access_token=abc123&refresh_token=def456&type=magiclink'
      mockLocation.search = '?access_token=abc123&refresh_token=def456&type=magiclink'

      // Mock initial state - no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Mock auth state change listener
      let authStateCallback: any = null
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })

      const TestComponent = () => {
        const { user, session, isLoading } = useAuth()

        return (
          <div>
            <div data-testid="user-status">
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid="session-status">
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid="loading-status">
              {isLoading ? 'loading' : 'idle'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
      })

      // Simulate successful authentication via magic link callback
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'abc123',
        refresh_token: 'def456',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }

      act(() => {
        authStateCallback({
          event: 'SIGNED_IN',
          session: mockSession,
        })
      })

      // Should be authenticated after magic link callback
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('session-status')).toHaveTextContent('session active')
      })
    })

    it('1.6.8 should handle token refresh automatically before expiration', async () => {
      // Mock initial state - user is authenticated with expiring token
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 1000, // Expires in 1 second
      }

      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock auth state change listener
      let authStateCallback: any = null
      mockOnAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } },
        }
      })

      const TestComponent = () => {
        const { user, session, isLoading } = useAuth()

        return (
          <div>
            <div data-testid="user-status">
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid="session-status">
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid="loading-status">
              {isLoading ? 'loading' : 'idle'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
      })

      // Should be authenticated initially
      expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
      expect(screen.getByTestId('session-status')).toHaveTextContent('session active')

      // Simulate token refresh via auth state change
      const refreshedSession = {
        ...mockSession,
        access_token: 'new-access-token-456',
        refresh_token: 'new-refresh-token-789',
        expires_at: Date.now() + 3600000, // 1 hour from now
      }

      act(() => {
        authStateCallback({
          event: 'TOKEN_REFRESHED',
          session: refreshedSession,
        })
      })

      // Should still be authenticated with refreshed token
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('session-status')).toHaveTextContent('session active')
      })
    })

    it('1.6.9 should restore auth state correctly on app initialization', async () => {
      // Mock localStorage to return stored session
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z',
      }
      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        user: mockUser,
        expires_at: Date.now() + 3600000,
      }

      // Mock getSession to return the stored session
      mockGetSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      // Mock auth state change listener
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      const TestComponent = () => {
        const { user, session, isLoading } = useAuth()

        return (
          <div>
            <div data-testid="user-status">
              {user ? `authenticated: ${user.email}` : 'not authenticated'}
            </div>
            <div data-testid="session-status">
              {session ? 'session active' : 'no session'}
            </div>
            <div data-testid="loading-status">
              {isLoading ? 'loading' : 'idle'}
            </div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially should be loading while restoring session
      expect(screen.getByTestId('loading-status')).toHaveTextContent('loading')

      // Wait for session to be restored
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('idle')
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated: test@example.com')
        expect(screen.getByTestId('session-status')).toHaveTextContent('session active')
      })

      // Verify getSession was called to restore session
      expect(mockGetSession).toHaveBeenCalled()
    })
  })
})
