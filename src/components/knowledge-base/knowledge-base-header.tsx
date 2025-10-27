'use client'

import { ChevronRight, ChevronLeft, Folder, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface KnowledgeBaseHeaderProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  selectedVideos: Set<string>
  onRemove: () => void
  isDeleting: boolean
  showDialog: boolean
  onOpenDialog: () => void
  onCloseDialog: () => void
}

export const KnowledgeBaseHeader = ({
  isCollapsed,
  onToggleCollapse,
  selectedVideos,
  onRemove,
  isDeleting,
  showDialog,
  onOpenDialog,
  onCloseDialog,
}: KnowledgeBaseHeaderProps) => {
  const selectedCount = selectedVideos.size

  return (
    <div className="flex h-14 items-center border-b px-4">
      {!isCollapsed ? (
        <>
          <h2 className="text-sm font-semibold">Knowledge Base</h2>
          <div className="flex items-center gap-2 ml-auto">
            <AlertDialog open={showDialog} onOpenChange={onCloseDialog}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenDialog}
                disabled={selectedCount === 0 || isDeleting}
                // Destructive color for delete action - theme-aware
                className={selectedCount > 0 ? 'text-destructive hover:bg-destructive/10' : ''}
                title={selectedCount > 0 ? `Delete ${selectedCount} video${selectedCount !== 1 ? 's' : ''}` : 'Select videos to delete'}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selectedCount} video{selectedCount !== 1 ? 's' : ''}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The videos will be permanently removed from your knowledge base.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onRemove()
                      onCloseDialog()
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex justify-center w-full">
          <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

