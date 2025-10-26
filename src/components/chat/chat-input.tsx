import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  placeholder?: string
}

export const ChatInput = ({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading,
  placeholder = 'Ask Bravi anything...'
}: ChatInputProps) => {
  return (
    <div className="border-t p-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={onSubmit} className="flex gap-2">
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
      </div>
    </div>
  )
}

