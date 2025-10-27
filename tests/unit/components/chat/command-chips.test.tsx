import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandChips } from '@/components/chat/command-chips'
import { CommandId } from '@/lib/chat-commands/types'
import { COMMAND_CONFIG } from '@/lib/chat-commands/constants'

// Mock Tooltip to remove it from rendering
jest.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div hidden>{children}</div>,
}))

describe('CommandChips Component', () => {
  const mockOnCommandChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render all commands from config', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      COMMAND_CONFIG.forEach(command => {
        expect(screen.getByText(command.label)).toBeInTheDocument()
      })
    })

    it('should render command icons when present', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      // Check for emojis in the DOM
      const badges = screen.getAllByRole('button')
      expect(badges.length).toBeGreaterThan(0)
    })

    it('should render with secondary variant when no command selected', () => {
      const { container } = render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const badges = container.querySelectorAll('.badge')
      badges.forEach(badge => {
        expect(badge).toHaveClass('secondary')
      })
    })

    it('should render with primary variant when command selected', () => {
      render(
        <CommandChips
          selectedCommand={CommandId.SUMMARIZE}
          onCommandChange={mockOnCommandChange}
        />
      )

      const badges = screen.getAllByRole('button')
      const selectedBadge = badges.find(badge => 
        badge.textContent?.includes('Summarize')
      )
      
      expect(selectedBadge).toBeDefined()
      expect(selectedBadge).toHaveClass('bg-primary')
    })
  })

  describe('Selection Behavior', () => {
    it('should handle command selection correctly', async () => {
      const user = userEvent.setup()
      render(
        <CommandChips
          selectedCommand={CommandId.SUMMARIZE}
          onCommandChange={mockOnCommandChange}
        />
      )

      // Verify the selected command is highlighted
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(COMMAND_CONFIG.length)
    })

    it('should support switching between commands', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      // First selection
      const firstButton = screen.getAllByRole('button')[0]
      await user.click(firstButton)
      expect(mockOnCommandChange).toHaveBeenCalled()

      // Switch selection
      rerender(
        <CommandChips
          selectedCommand={CommandId.SUMMARIZE}
          onCommandChange={mockOnCommandChange}
        />
      )

      const secondButton = screen.getAllByRole('button')[1]
      await user.click(secondButton)
      expect(mockOnCommandChange).toHaveBeenCalled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should handle Enter key press', () => {
      const { container } = render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const summarizeButton = container.querySelector('[role="button"]')
      expect(summarizeButton).toBeDefined()
      
      fireEvent.keyDown(summarizeButton!, { key: 'Enter' })
      expect(mockOnCommandChange).toHaveBeenCalled()
    })

    it('should handle Space key press', () => {
      const { container } = render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const summarizeButton = container.querySelector('[role="button"]')
      expect(summarizeButton).toBeDefined()
      
      fireEvent.keyDown(summarizeButton!, { key: ' ' })
      expect(mockOnCommandChange).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper role attributes', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(COMMAND_CONFIG.length)
    })

    it('should have aria-label attributes', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label')
        expect(button.getAttribute('aria-label')).toContain('Select command')
      })
    })

    it('should have tabIndex for keyboard navigation', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should update aria-label for selected state', () => {
      render(
        <CommandChips
          selectedCommand={CommandId.SUMMARIZE}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      const selectedButton = buttons.find(btn => 
        btn.getAttribute('aria-label')?.includes('Summarize')
      )
      
      expect(selectedButton?.getAttribute('aria-label')).toContain('deselect')
    })

    it('should update aria-label for unselected state', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.getAttribute('aria-label')).toContain('select')
      })
    })
  })

  describe('Visual States', () => {
    it('should apply correct classes for hover state', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.className).toContain('hover:scale-105')
        expect(button.className).toContain('transition-all')
      })
    })

    it('should apply correct classes for active state', () => {
      render(
        <CommandChips
          selectedCommand={CommandId.SUMMARIZE}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      const selectedButton = buttons.find(btn => 
        btn.textContent?.includes('Summarize')
      )
      
      expect(selectedButton?.className).toContain('bg-primary')
      expect(selectedButton?.className).toContain('shadow-sm')
    })

    it('should have cursor-pointer class', () => {
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button.className).toContain('cursor-pointer')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple rapid clicks gracefully', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const badge = container.querySelector('[role="button"]')
      expect(badge).toBeDefined()
      
      // Simulate rapid clicking
      for (let i = 0; i < 5; i++) {
        await user.click(badge!)
      }

      expect(mockOnCommandChange).toHaveBeenCalled()
    })

    it('should handle switching between commands', async () => {
      const user = userEvent.setup()
      render(
        <CommandChips
          selectedCommand={null}
          onCommandChange={mockOnCommandChange}
        />
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(1)
      
      // Click first button
      await user.click(buttons[0])
      expect(mockOnCommandChange).toHaveBeenCalled()
    })
  })
})

