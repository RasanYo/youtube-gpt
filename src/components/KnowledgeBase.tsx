import { useState } from 'react'
import { FileText, Folder, Video, Calendar, Loader2, Cloud } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { processYouTubeUrl } from '@/lib/youtube'

export const KnowledgeBase = () => {
  const [urlInput, setUrlInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Empty documents array to show empty state
  const documents: Array<{
    id: number
    title: string
    type: string
    pages?: number
    duration?: string
    date: string
  }> = []

  const totalVideos = 0
  const lastIngestion = 'Never'

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!urlInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a YouTube URL',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    try {
      const result = await processYouTubeUrl(urlInput.trim())
      
      if (result.success) {
        toast({
          title: 'Success',
          description: `YouTube ${result.type} queued for processing! Video ID: ${result.data?.id}`,
        })
        // Reset form
        setUrlInput('')
      } else {
        // Handle different error types with specific messages
        let errorMessage = result.error || 'Failed to process URL'
        
        if (result.type === 'auth_required') {
          errorMessage = 'Please sign in to add videos to your knowledge base'
        } else if (result.type === 'auth_error') {
          errorMessage = 'Authentication failed. Please sign in and try again'
        } else if (result.type === 'processing_error') {
          errorMessage = 'Failed to queue video for processing. Please try again'
        }

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error processing URL:', error)
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-96 flex-col border-l bg-card">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Knowledge Base</h2>
        <Button variant="ghost" size="sm">
          <Folder className="h-4 w-4" />
        </Button>
      </div>
      {/* URL Input Form - Moved to top */}
      <div className="border-b">
        <form onSubmit={handleSubmit} className="p-4">
          <div className="relative">
            <Input
              type="url"
              placeholder="Paste YouTube video/channel URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isLoading}
              className="w-full pr-12"
            />
            <Button 
              type="submit" 
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0" 
              disabled={isLoading || !urlInput.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
      {/* Documents */}
      <ScrollArea className="flex-1 p-4">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <Video className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-1 font-medium">
              No documents yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              Add videos to build your knowledge base
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <Button
                key={doc.id}
                variant="ghost"
                className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-accent"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {doc.type === 'video' ? (
                      <Video className="h-5 w-5 text-primary" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium mb-1 line-clamp-2">
                      {doc.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {doc.type === 'video'
                          ? doc.duration
                          : `${doc.pages} pages`}
                      </Badge>
                      <span>{doc.date}</span>
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer with Metrics */}
      <div className="border-t">
        <div className="bg-muted/30 px-4 py-3">
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Video className="h-3.5 w-3.5" />
                <span>Total videos:</span>
              </div>
              <span className="font-medium text-foreground">{totalVideos}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Last ingestion:</span>
              </div>
              <span className="font-medium text-foreground">{lastIngestion}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
