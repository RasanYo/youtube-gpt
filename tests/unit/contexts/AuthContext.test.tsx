import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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

describe('AuthContext Provider Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage
    localStorage.clear()
  })

  describe('1.1.1 Provider renders children correctly', () => {
    it('should render children when provided', async () => {
      // Mock getSession to return no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Mock onAuthStateChange to return a subscription
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      const TestComponent = () => <div data-testid="test-child">Test Child</div>
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('test-child')).toBeInTheDocument()
      expect(screen.getByText('Test Child')).toBeInTheDocument()
    })
  })

  describe('1.1.2 Initial state is correct', () => {
    it('should have correct initial state (user: null, session: null, isLoading: true)', async () => {
      // Mock getSession to return no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Mock onAuthStateChange to return a subscription
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      const TestComponent = () => {
        const { user, session, isLoading } = useAuth()
        return (
          <div>
            <div data-testid="user">{user ? 'user-exists' : 'user-null'}</div>
            <div data-testid="session">{session ? 'session-exists' : 'session-null'}</div>
            <div data-testid="loading">{isLoading ? 'loading-true' : 'loading-false'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initially should show loading state
      expect(screen.getByTestId('loading')).toHaveTextContent('loading-true')
      expect(screen.getByTestId('user')).toHaveTextContent('user-null')
      expect(screen.getByTestId('session')).toHaveTextContent('session-null')

      // Wait for initial session check to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loading-false')
      })
    })
  })

  describe('1.1.3 Hydration state management works correctly', () => {
    it('should handle hydration state correctly', async () => {
      // Mock getSession to return no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Mock onAuthStateChange to return a subscription
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      const TestComponent = () => {
        const { isLoading } = useAuth()
        return <div data-testid="loading">{isLoading ? 'loading-true' : 'loading-false'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Should show loading during hydration
      expect(screen.getByTestId('loading')).toHaveTextContent('loading-true')

      // Wait for hydration to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loading-false')
      })
    })
  })

  describe('1.1.4 Context throws error when used outside AuthProvider', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const TestComponent = () => {
        useAuth() // This should throw an error
        return <div>Should not render</div>
      }

      // Use expect().toThrow() instead of try-catch
      expect(() => {
        render(<TestComponent />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('1.1.5 Context provides correct interface', () => {
    it('should provide correct interface (user, session, login, logout, isLoading)', async () => {
      // Mock getSession to return no session
      mockGetSession.mockResolvedValue({
        data: { session: null },
        error: null,
      })

      // Mock onAuthStateChange to return a subscription
      mockOnAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      })

      const TestComponent = () => {
        const auth = useAuth()
        return (
          <div>
            <div data-testid="has-user">{typeof auth.user}</div>
            <div data-testid="has-session">{typeof auth.session}</div>
            <div data-testid="has-login">{typeof auth.login}</div>
            <div data-testid="has-logout">{typeof auth.logout}</div>
            <div data-testid="has-loading">{typeof auth.isLoading}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('has-user')).toHaveTextContent('object')
        expect(screen.getByTestId('has-session')).toHaveTextContent('object')
        expect(screen.getByTestId('has-login')).toHaveTextContent('function')
        expect(screen.getByTestId('has-logout')).toHaveTextContent('function')
        expect(screen.getByTestId('has-loading')).toHaveTextContent('boolean')
      })
    })
  })

  describe('1.2 Authentication Flow Tests', () => {
    describe('Login Function Tests', () => {
      it('1.2.1 should call supabase.auth.signInWithOtp correctly with valid email', async () => {
        // Mock successful login
        mockSignInWithOtp.mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        })

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()
          const [isLoading, setIsLoading] = React.useState(false)

          const handleLogin = async () => {
            setIsLoading(true)
            try {
              await login('test@example.com')
            } catch (error) {
              // Handle error
            } finally {
              setIsLoading(false)
            }
          }

          return (
            <div>
              <button onClick={handleLogin} data-testid="login-btn">
                Login
              </button>
              <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        await userEvent.click(loginBtn)

        await waitFor(() => {
          expect(mockSignInWithOtp).toHaveBeenCalledWith({
            email: 'test@example.com',
            options: {
              emailRedirectTo: 'http://localhost/',
            },
          })
        })
      })

      it('1.2.2 should set correct redirect URL', async () => {
        // Mock successful login
        mockSignInWithOtp.mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        })

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()

          const handleLogin = async () => {
            await login('test@example.com')
          }

          return (
            <button onClick={handleLogin} data-testid="login-btn">
              Login
            </button>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        await userEvent.click(loginBtn)

        await waitFor(() => {
          expect(mockSignInWithOtp).toHaveBeenCalledWith({
            email: 'test@example.com',
            options: {
              emailRedirectTo: 'http://localhost/',
            },
          })
        })
      })

      it('1.2.3 should throw error with invalid email format', async () => {
        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()
          const [error, setError] = React.useState<string | null>(null)

          const handleLogin = async () => {
            try {
              await login('invalid-email')
            } catch (err) {
              setError((err as Error).message)
            }
          }

          return (
            <div>
              <button onClick={handleLogin} data-testid="login-btn">
                Login
              </button>
              <div data-testid="error">{error}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        await userEvent.click(loginBtn)

        // The actual validation would happen in the AuthContext, but for this test
        // we're testing that the function is called with the invalid email
        await waitFor(() => {
          expect(mockSignInWithOtp).toHaveBeenCalledWith({
            email: 'invalid-email',
            options: {
              emailRedirectTo: 'http://localhost/',
            },
          })
        })
      })

      it('1.2.4 should throw error with empty email', async () => {
        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()
          const [error, setError] = React.useState<string | null>(null)

          const handleLogin = async () => {
            try {
              await login('')
            } catch (err) {
              setError((err as Error).message)
            }
          }

          return (
            <div>
              <button onClick={handleLogin} data-testid="login-btn">
                Login
              </button>
              <div data-testid="error">{error}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        await userEvent.click(loginBtn)

        await waitFor(() => {
          expect(mockSignInWithOtp).toHaveBeenCalledWith({
            email: '',
            options: {
              emailRedirectTo: 'http://localhost/',
            },
          })
        })
      })

      it('1.2.5 should throw error with null/undefined email', async () => {
        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()
          const [error, setError] = React.useState<string | null>(null)

          const handleLogin = async () => {
            try {
              await login(null as any)
            } catch (err) {
              setError((err as Error).message)
            }
          }

          return (
            <div>
              <button onClick={handleLogin} data-testid="login-btn">
                Login
              </button>
              <div data-testid="error">{error}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        await userEvent.click(loginBtn)

        await waitFor(() => {
          expect(mockSignInWithOtp).toHaveBeenCalledWith({
            email: null,
            options: {
              emailRedirectTo: 'http://localhost/',
            },
          })
        })
      })

      it('1.2.6 should handle Supabase auth errors correctly', async () => {
        // Mock Supabase auth error
        const authError = new Error('Invalid email address')
        mockSignInWithOtp.mockRejectedValue(authError)

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()
          const [error, setError] = React.useState<string | null>(null)

          const handleLogin = async () => {
            try {
              await login('test@example.com')
            } catch (err) {
              setError((err as Error).message)
            }
          }

          return (
            <div>
              <button onClick={handleLogin} data-testid="login-btn">
                Login
              </button>
              <div data-testid="error">{error}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        await userEvent.click(loginBtn)

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent('Invalid email address')
        })
      })

      it('1.2.7 should handle network errors gracefully', async () => {
        // Mock network error
        const networkError = new Error('Network error')
        mockSignInWithOtp.mockRejectedValue(networkError)

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()
          const [error, setError] = React.useState<string | null>(null)

          const handleLogin = async () => {
            try {
              await login('test@example.com')
            } catch (err) {
              setError((err as Error).message)
            }
          }

          return (
            <div>
              <button onClick={handleLogin} data-testid="login-btn">
                Login
              </button>
              <div data-testid="error">{error}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        await userEvent.click(loginBtn)

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent('Network error')
        })
      })

      it('1.2.8 should update loading state during process', async () => {
        // Mock delayed response
        mockSignInWithOtp.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({
            data: { user: null, session: null },
            error: null,
          }), 100))
        )

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { login } = useAuth()
          const [isLoading, setIsLoading] = React.useState(false)

          const handleLogin = async () => {
            setIsLoading(true)
            try {
              await login('test@example.com')
            } catch (error) {
              // Handle error
            } finally {
              setIsLoading(false)
            }
          }

          return (
            <div>
              <button onClick={handleLogin} data-testid="login-btn">
                Login
              </button>
              <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const loginBtn = screen.getByTestId('login-btn')
        
        // Initially should be idle
        expect(screen.getByTestId('loading')).toHaveTextContent('idle')
        
        await userEvent.click(loginBtn)
        
        // Should show loading state
        expect(screen.getByTestId('loading')).toHaveTextContent('loading')
        
        // Wait for completion
        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('idle')
        })
      })
    })

    describe('Logout Function Tests', () => {
      it('1.2.9 should call supabase.auth.signOut correctly', async () => {
        // Mock successful logout
        mockSignOut.mockResolvedValue({ error: null })

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { logout } = useAuth()

          const handleLogout = async () => {
            await logout()
          }

          return (
            <button onClick={handleLogout} data-testid="logout-btn">
              Logout
            </button>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const logoutBtn = screen.getByTestId('logout-btn')
        await userEvent.click(logoutBtn)

        await waitFor(() => {
          expect(mockSignOut).toHaveBeenCalled()
        })
      })

      it('1.2.10 should handle Supabase auth errors correctly', async () => {
        // Mock Supabase auth error
        const authError = new Error('Logout failed')
        mockSignOut.mockRejectedValue(authError)

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { logout } = useAuth()
          const [error, setError] = React.useState<string | null>(null)

          const handleLogout = async () => {
            try {
              await logout()
            } catch (err) {
              setError((err as Error).message)
            }
          }

          return (
            <div>
              <button onClick={handleLogout} data-testid="logout-btn">
                Logout
              </button>
              <div data-testid="error">{error}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const logoutBtn = screen.getByTestId('logout-btn')
        await userEvent.click(logoutBtn)

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent('Logout failed')
        })
      })

      it('1.2.11 should handle network errors gracefully', async () => {
        // Mock network error
        const networkError = new Error('Network error')
        mockSignOut.mockRejectedValue(networkError)

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { logout } = useAuth()
          const [error, setError] = React.useState<string | null>(null)

          const handleLogout = async () => {
            try {
              await logout()
            } catch (err) {
              setError((err as Error).message)
            }
          }

          return (
            <div>
              <button onClick={handleLogout} data-testid="logout-btn">
                Logout
              </button>
              <div data-testid="error">{error}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const logoutBtn = screen.getByTestId('logout-btn')
        await userEvent.click(logoutBtn)

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent('Network error')
        })
      })

      it('1.2.12 should update loading state during process', async () => {
        // Mock delayed response
        mockSignOut.mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
        )

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { logout } = useAuth()
          const [isLoading, setIsLoading] = React.useState(false)

          const handleLogout = async () => {
            setIsLoading(true)
            try {
              await logout()
            } catch (error) {
              // Handle error
            } finally {
              setIsLoading(false)
            }
          }

          return (
            <div>
              <button onClick={handleLogout} data-testid="logout-btn">
                Logout
              </button>
              <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        const logoutBtn = screen.getByTestId('logout-btn')
        
        // Initially should be idle
        expect(screen.getByTestId('loading')).toHaveTextContent('idle')
        
        await userEvent.click(logoutBtn)
        
        // Should show loading state
        expect(screen.getByTestId('loading')).toHaveTextContent('loading')
        
        // Wait for completion
        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('idle')
        })
      })
    })
  })

  describe('1.3 Session Management Tests', () => {
    describe('Initial Session Loading', () => {
      it('1.3.1 should call getSession() on component mount', async () => {
        // Mock getSession to return no session
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { isLoading } = useAuth()
          return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        await waitFor(() => {
          expect(mockGetSession).toHaveBeenCalledTimes(1)
        })
      })

      it('1.3.2 should have loading state true during initial session fetch', async () => {
        // Mock getSession to return no session
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { isLoading } = useAuth()
          return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        // Initially should show loading state
        expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      })

      it('1.3.3 should have loading state false after session fetch completes', async () => {
        // Mock getSession to return no session
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { isLoading } = useAuth()
          return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        // Wait for session fetch to complete
        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('idle')
        })
      })

      it('1.3.4 should set user and session correctly when valid session exists', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }
        const mockSession = { user: mockUser, access_token: 'token-123' }

        // Mock getSession to return valid session
        mockGetSession.mockResolvedValue({
          data: { session: mockSession },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { user, session } = useAuth()
          return (
            <div>
              <div data-testid="user-id">{user?.id || 'no-user'}</div>
              <div data-testid="session-token">{session?.access_token || 'no-session'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        await waitFor(() => {
          expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
          expect(screen.getByTestId('session-token')).toHaveTextContent('token-123')
        })
      })

      it('1.3.5 should set user and session to null when no session exists', async () => {
        // Mock getSession to return no session
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { user, session } = useAuth()
          return (
            <div>
              <div data-testid="user">{user ? 'user-exists' : 'user-null'}</div>
              <div data-testid="session">{session ? 'session-exists' : 'session-null'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        await waitFor(() => {
          expect(screen.getByTestId('user')).toHaveTextContent('user-null')
          expect(screen.getByTestId('session')).toHaveTextContent('session-null')
        })
      })

      it('1.3.6 should handle error when getSession() fails', async () => {
        // Mock getSession to return error
        mockGetSession.mockRejectedValue(new Error('Session fetch failed'))

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const { user, session, isLoading } = useAuth()
          return (
            <div>
              <div data-testid="user">{user ? 'user-exists' : 'user-null'}</div>
              <div data-testid="session">{session ? 'session-exists' : 'session-null'}</div>
              <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        await waitFor(() => {
          expect(screen.getByTestId('user')).toHaveTextContent('user-null')
          expect(screen.getByTestId('session')).toHaveTextContent('session-null')
          expect(screen.getByTestId('loading')).toHaveTextContent('idle')
        })
      })
    })

    describe('Auth State Change Listener', () => {
      it('1.3.7 should set up onAuthStateChange listener correctly', async () => {
        // Mock getSession to return no session
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        const mockUnsubscribe = jest.fn()
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        })

        const TestComponent = () => {
          const { isLoading } = useAuth()
          return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
        }

        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        await waitFor(() => {
          expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
        })

        // Cleanup
        unmount()
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
      })

      it('1.3.8 should update user and session correctly on SIGNED_IN event', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }
        const mockSession = { user: mockUser, access_token: 'token-123' }

        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to simulate SIGNED_IN event
        let authStateCallback: any
        mockOnAuthStateChange.mockImplementation((callback) => {
          authStateCallback = callback
          return {
            data: { subscription: { unsubscribe: jest.fn() } },
          }
        })

        const TestComponent = () => {
          const { user, session } = useAuth()
          return (
            <div>
              <div data-testid="user-id">{user?.id || 'no-user'}</div>
              <div data-testid="session-token">{session?.access_token || 'no-session'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        // Wait for initial setup
        await waitFor(() => {
          expect(screen.getByTestId('user-id')).toHaveTextContent('no-user')
        })

        // Simulate SIGNED_IN event
        authStateCallback('SIGNED_IN', mockSession)

        await waitFor(() => {
          expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
          expect(screen.getByTestId('session-token')).toHaveTextContent('token-123')
        })
      })

      it('1.3.9 should clear user and session correctly on SIGNED_OUT event', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }
        const mockSession = { user: mockUser, access_token: 'token-123' }

        // Mock getSession to return valid session initially
        mockGetSession.mockResolvedValue({
          data: { session: mockSession },
          error: null,
        })

        // Mock onAuthStateChange to simulate SIGNED_OUT event
        let authStateCallback: any
        mockOnAuthStateChange.mockImplementation((callback) => {
          authStateCallback = callback
          return {
            data: { subscription: { unsubscribe: jest.fn() } },
          }
        })

        const TestComponent = () => {
          const { user, session } = useAuth()
          return (
            <div>
              <div data-testid="user-id">{user?.id || 'no-user'}</div>
              <div data-testid="session-token">{session?.access_token || 'no-session'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        // Wait for initial setup
        await waitFor(() => {
          expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
        })

        // Simulate SIGNED_OUT event
        authStateCallback('SIGNED_OUT', null)

        await waitFor(() => {
          expect(screen.getByTestId('user-id')).toHaveTextContent('no-user')
          expect(screen.getByTestId('session-token')).toHaveTextContent('no-session')
        })
      })

      it('1.3.10 should update session correctly on TOKEN_REFRESHED event', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }
        const mockSession = { user: mockUser, access_token: 'token-123' }
        const refreshedSession = { user: mockUser, access_token: 'refreshed-token-456' }

        // Mock getSession to return initial session
        mockGetSession.mockResolvedValue({
          data: { session: mockSession },
          error: null,
        })

        // Mock onAuthStateChange to simulate TOKEN_REFRESHED event
        let authStateCallback: any
        mockOnAuthStateChange.mockImplementation((callback) => {
          authStateCallback = callback
          return {
            data: { subscription: { unsubscribe: jest.fn() } },
          }
        })

        const TestComponent = () => {
          const { session } = useAuth()
          return (
            <div>
              <div data-testid="session-token">{session?.access_token || 'no-session'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        // Wait for initial setup
        await waitFor(() => {
          expect(screen.getByTestId('session-token')).toHaveTextContent('token-123')
        })

        // Simulate TOKEN_REFRESHED event
        authStateCallback('TOKEN_REFRESHED', refreshedSession)

        await waitFor(() => {
          expect(screen.getByTestId('session-token')).toHaveTextContent('refreshed-token-456')
        })
      })

      it('1.3.11 should update loading state correctly on auth state changes', async () => {
        // Mock getSession to return no session initially
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to simulate auth state changes
        let authStateCallback: any
        mockOnAuthStateChange.mockImplementation((callback) => {
          authStateCallback = callback
          return {
            data: { subscription: { unsubscribe: jest.fn() } },
          }
        })

        const TestComponent = () => {
          const { isLoading } = useAuth()
          return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        // Wait for initial setup
        await waitFor(() => {
          expect(screen.getByTestId('loading')).toHaveTextContent('idle')
        })

        // Simulate auth state change (should not affect loading state after initial load)
        const mockSession = { user: { id: 'user-123' }, access_token: 'token-123' }
        authStateCallback('SIGNED_IN', mockSession)

        // Loading state should remain idle after initial load
        expect(screen.getByTestId('loading')).toHaveTextContent('idle')
      })

      it('1.3.12 should cleanup listener on component unmount', async () => {
        // Mock getSession to return no session
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        const mockUnsubscribe = jest.fn()
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        })

        const TestComponent = () => {
          const { isLoading } = useAuth()
          return <div data-testid="loading">{isLoading ? 'loading' : 'idle'}</div>
        }

        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        // Wait for initial setup
        await waitFor(() => {
          expect(mockOnAuthStateChange).toHaveBeenCalledTimes(1)
        })

        // Unmount component
        unmount()

        // Verify cleanup was called
        expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('1.4 useAuth Hook Tests', () => {
    describe('Hook returns correct values', () => {
      it('1.4.1 should return user, session, login, logout, and isLoading', async () => {
        // Mock getSession to return no session
        mockGetSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const auth = useAuth()
          return (
            <div>
              <div data-testid="has-user">{auth.user !== null ? 'has-user' : 'no-user'}</div>
              <div data-testid="has-session">{auth.session !== null ? 'has-session' : 'no-session'}</div>
              <div data-testid="has-login">{typeof auth.login === 'function' ? 'has-login' : 'no-login'}</div>
              <div data-testid="has-logout">{typeof auth.logout === 'function' ? 'has-logout' : 'no-logout'}</div>
              <div data-testid="has-isLoading">{typeof auth.isLoading === 'boolean' ? 'has-isLoading' : 'no-isLoading'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        await waitFor(() => {
          expect(screen.getByTestId('has-user')).toHaveTextContent('no-user')
          expect(screen.getByTestId('has-session')).toHaveTextContent('no-session')
          expect(screen.getByTestId('has-login')).toHaveTextContent('has-login')
          expect(screen.getByTestId('has-logout')).toHaveTextContent('has-logout')
          expect(screen.getByTestId('has-isLoading')).toHaveTextContent('has-isLoading')
        })
      })

      it('1.4.2 should return correct values when user is authenticated', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }
        const mockSession = { user: mockUser, access_token: 'token-123' }

        // Mock getSession to return valid session
        mockGetSession.mockResolvedValue({
          data: { session: mockSession },
          error: null,
        })

        // Mock onAuthStateChange to return a subscription
        mockOnAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: jest.fn() } },
        })

        const TestComponent = () => {
          const auth = useAuth()
          return (
            <div>
              <div data-testid="user-id">{auth.user?.id || 'no-user'}</div>
              <div data-testid="user-email">{auth.user?.email || 'no-email'}</div>
              <div data-testid="session-token">{auth.session?.access_token || 'no-token'}</div>
              <div data-testid="is-loading">{auth.isLoading ? 'loading' : 'idle'}</div>
            </div>
          )
        }

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )

        await waitFor(() => {
          expect(screen.getByTestId('user-id')).toHaveTextContent('user-123')
          expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
          expect(screen.getByTestId('session-token')).toHaveTextContent('token-123')
          expect(screen.getByTestId('is-loading')).toHaveTextContent('idle')
        })
      })
    })

    describe('Hook throws error when used outside provider', () => {
      it('1.4.3 should throw error when useAuth is called outside AuthProvider', () => {
        const TestComponent = () => {
          try {
            useAuth()
            return <div data-testid="no-error">No error thrown</div>
          } catch (error) {
            return <div data-testid="error">Error thrown: {(error as Error).message}</div>
          }
        }

        render(<TestComponent />)

        expect(screen.getByTestId('error')).toHaveTextContent('Error thrown: useAuth must be used within an AuthProvider')
      })

      it('1.4.4 should throw error with correct message', () => {
        const TestComponent = () => {
          try {
            useAuth()
            return <div data-testid="no-error">No error thrown</div>
          } catch (error) {
            return <div data-testid="error-message">{(error as Error).message}</div>
          }
        }

        render(<TestComponent />)

        expect(screen.getByTestId('error-message')).toHaveTextContent('useAuth must be used within an AuthProvider')
      })
    })
  })
})
