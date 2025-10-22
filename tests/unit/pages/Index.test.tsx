/**
 * Unit Tests for Index Page (Protected Route)
 *
 * Tests the main app page authentication protection and rendering
 * Validates redirect behavior for unauthenticated users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Index from '@/pages/Index'
import { useAuth } from '@/contexts/AuthContext'
import type { User, Session } from '@supabase/supabase-js'

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock child components to simplify testing
vi.mock('@/components/ConversationSidebar', () => ({
  ConversationSidebar: () => (
    <div data-testid="conversation-sidebar">ConversationSidebar</div>
  ),
}))

vi.mock('@/components/ChatArea', () => ({
  ChatArea: () => <div data-testid="chat-area">ChatArea</div>,
}))

vi.mock('@/components/KnowledgeBase', () => ({
  KnowledgeBase: () => <div data-testid="knowledge-base">KnowledgeBase</div>,
}))

// Mock react-router-dom navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading state when auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should have correct loading state styling', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      const loadingContainer = screen.getByText('Loading...').closest('div')
      expect(loadingContainer).toHaveClass('animate-pulse')
    })
  })

  describe('Unauthenticated State', () => {
    it('should redirect to login when user is not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('should not render app content when not authenticated', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(
          screen.queryByTestId('conversation-sidebar'),
        ).not.toBeInTheDocument()
      })

      expect(screen.queryByTestId('chat-area')).not.toBeInTheDocument()
      expect(screen.queryByTestId('knowledge-base')).not.toBeInTheDocument()
    })

    it('should return null when user is null and not loading', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      const { container } = render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })

      // Component should return null, so container should be empty
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Authenticated State', () => {
    const mockUser: Partial<User> = {
      id: '123',
      email: 'test@example.com',
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    }

    const mockSession: Partial<Session> = {
      access_token: 'token123',
      user: mockUser as User,
    }

    it('should render three-column layout when user is authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as User,
        session: mockSession as Session,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      expect(screen.getByTestId('conversation-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('chat-area')).toBeInTheDocument()
      expect(screen.getByTestId('knowledge-base')).toBeInTheDocument()
    })

    it('should not redirect when authenticated', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as User,
        session: mockSession as Session,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('should have correct layout structure', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as User,
        session: mockSession as Session,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      const { container } = render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      const mainContainer = container.querySelector(
        '.flex.h-screen.w-full.overflow-hidden',
      )
      expect(mainContainer).toBeInTheDocument()
    })
  })

  describe('Auth State Transitions', () => {
    it('should handle transition from loading to unauthenticated', async () => {
      const { rerender } = render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      // Start with loading state
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      })

      rerender(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Transition to unauthenticated
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      rerender(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })
    })

    it('should handle transition from loading to authenticated', async () => {
      const mockUser: Partial<User> = {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      const mockSession: Partial<Session> = {
        access_token: 'token123',
        user: mockUser as User,
      }

      // Start with loading state
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: true,
        login: vi.fn(),
        logout: vi.fn(),
      })

      const { rerender } = render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Clear any navigate calls from the initial render
      vi.clearAllMocks()

      // Transition to authenticated
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as User,
        session: mockSession as Session,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      rerender(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('conversation-sidebar')).toBeInTheDocument()
      })

      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })

  describe('useEffect Dependencies', () => {
    it('should call useEffect when auth state changes', async () => {
      const mockUser: Partial<User> = {
        id: '123',
        email: 'test@example.com',
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      }

      const mockSession: Partial<Session> = {
        access_token: 'token123',
        user: mockUser as User,
      }

      const { rerender } = render(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      // Start unauthenticated
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      rerender(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login')
      })

      vi.clearAllMocks()

      // Change to authenticated
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser as User,
        session: mockSession as Session,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
      })

      rerender(
        <MemoryRouter>
          <Index />
        </MemoryRouter>,
      )

      // Should not navigate again
      expect(mockNavigate).not.toHaveBeenCalled()
    })
  })
})
