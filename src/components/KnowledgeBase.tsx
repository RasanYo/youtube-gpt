import { FileText, Folder, Youtube } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export const KnowledgeBase = () => {
  const documents = [
    {
      id: 1,
      title: 'YouTube Analytics Guide 2024',
      type: 'document',
      pages: 24,
      date: '2 days ago',
    },
    {
      id: 2,
      title: 'Content Strategy Template',
      type: 'document',
      pages: 12,
      date: '1 week ago',
    },
    {
      id: 3,
      title: 'SEO Best Practices',
      type: 'video',
      duration: '15:30',
      date: '2 weeks ago',
    },
    {
      id: 4,
      title: 'Audience Growth Tactics',
      type: 'document',
      pages: 18,
      date: '3 weeks ago',
    },
  ]

  return (
    <div className="flex h-screen w-96 flex-col border-l bg-card">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <h2 className="text-sm font-semibold">Knowledge Base</h2>
        <Button variant="ghost" size="sm">
          <Folder className="h-4 w-4" />
        </Button>
      </div>

      {/* Documents */}
      <ScrollArea className="flex-1 p-4">
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
                    <Youtube className="h-5 w-5 text-primary" />
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
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <Button variant="outline" className="w-full">
          <FileText className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </div>
    </div>
  )
}
