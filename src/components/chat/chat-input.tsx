import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CommandChips } from './command-chips'
import type { CommandId } from '@/lib/chat-commands/types'

interface ChatInputProps {
  /** The current input value */
  value: string
  /** Callback when input value changes */
  onChange: (value: string) => void
  /** Form submission handler */
  onSubmit: (e: React.FormEvent) => void
  /** Whether the form is in a loading state */
  isLoading: boolean
  /** Optional placeholder text for the input */
  placeholder?: string
  /** The currently selected command ID, or null if none. Used to display command chips. */
  selectedCommand?: CommandId | null
  /** Callback when command selection changes. Required if selectedCommand is provided. */
  onCommandChange?: (commandId: CommandId | null) => void
}

/**
 * ChatInput Component
 * 
 * Provides the chat input field with optional command chip selection.
 * Supports enhanced prompts through command selection before submission.
 * 
 * @param props - Component props including input state and command handling
 * @returns The rendered chat input form with optional command chips
 */

export const ChatInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading,
  placeholder = 'Ask Bravi anything...',
  selectedCommand,
  onCommandChange
}: ChatInputProps): JSX.Element => {
  return (
    <div className="border-t">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={onSubmit} className="flex gap-2 p-4">
          <Input 
            placeholder={placeholder}
            className="flex-1" 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !value.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
        {selectedCommand !== undefined && onCommandChange && (
          <div className="px-4 pb-4">
            <CommandChips
              selectedCommand={selectedCommand}
              onCommandChange={onCommandChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}

