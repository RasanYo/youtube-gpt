import { Loader2 } from 'lucide-react'

interface ChatLoadingStateProps {
  message?: string
}

export const ChatLoadingState = ({ message = 'Loading your conversations...' }: ChatLoadingStateProps) => {
  return (
    <div className="flex h-screen flex-1 flex-col">
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Bravi AI Assistant</h1>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}

