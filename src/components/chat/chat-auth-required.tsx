import { MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ChatAuthRequired = () => {
  return (
    <div className="flex h-screen flex-1 flex-col">
      {/* Header */}
      <div className="flex h-14 items-center border-b px-6">
        <h1 className="text-lg font-semibold">Bravi AI Assistant</h1>
      </div>
      
      {/* Authentication Required Message */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <div className="relative mb-6">
            <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <Sparkles className="h-6 w-6 text-primary absolute -top-1 -right-1" />
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-foreground">
            Authentication Required
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Please log in to access the AI assistant and start chatting about your YouTube videos.
          </p>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2"
          >
            Go to Login
          </Button>
        </div>
      </div>
    </div>
  )
}

