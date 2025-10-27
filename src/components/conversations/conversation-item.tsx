'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Input } from '@/components/ui/input'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

// ============================================================================
// INTERFACES
// ============================================================================

interface ConversationItemProps {
  conversation: { id: string; title: string; updatedAt: string | null }
  isActive: boolean
  onClick: () => void
  onEditTitle?: (conversationId: string, newTitle: string) => Promise<void>
}

interface EditTitleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentTitle: string
  onSave: (title: string) => Promise<void>
}

interface DeleteConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ConversationItemMenu = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
        <MoreVertical className="h-3.5 w-3.5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-[140px]">
      <DropdownMenuItem onClick={onEdit}>
        <Pencil className="mr-2 h-3.5 w-3.5" />
        Edit title
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive" onClick={onDelete}>
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

const EditTitleDialog = ({ open, onOpenChange, currentTitle, onSave }: EditTitleDialogProps) => {
  const [titleInput, setTitleInput] = useState(currentTitle)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!titleInput.trim()) return
    setIsSaving(true)
    try {
      await onSave(titleInput.trim())
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to update title:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Sync with current title when dialog opens
  useEffect(() => {
    if (open) {
      setTitleInput(currentTitle)
    }
  }, [open, currentTitle])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit conversation title</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="Enter conversation title"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !titleInput.trim()}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const DeleteConversationDialog = ({ open, onOpenChange, onConfirm }: DeleteConversationDialogProps) => {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this conversation? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ConversationItem = ({ conversation, isActive, onClick, onEditTitle }: ConversationItemProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleSaveTitle = async (newTitle: string) => {
    if (onEditTitle) {
      await onEditTitle(conversation.id, newTitle)
    }
  }

  const handleDelete = () => {
    console.log('Delete conversation:', conversation.id)
    // TODO: Implement delete functionality when available in context
  }

  return (
    <div
      className={cn(
        'w-full rounded-lg transition-colors relative',
        isActive ? 'bg-accent/30' : ''
      )}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Conversation Item Content */}
      <Button
        variant="ghost"
        className="w-full justify-start text-left h-auto p-2 hover:bg-accent"
        onClick={onClick}
      >
        <div className="flex items-start gap-2 w-full">
          <MessageSquare className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate text-sidebar-foreground">
              {conversation.title}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {conversation.updatedAt
                ? formatDistanceToNow(new Date(conversation.updatedAt), {
                    addSuffix: true,
                  })
                : 'Unknown'}
            </div>
          </div>
        </div>
      </Button>

      {/* Menu Button */}
      {showMenu && (
        <div className="absolute bottom-2 right-2" onClick={(e) => e.stopPropagation()}>
          <ConversationItemMenu
            onEdit={() => setIsEditDialogOpen(true)}
            onDelete={() => setIsDeleteDialogOpen(true)}
          />
        </div>
      )}

      {/* Dialogs */}
      <EditTitleDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        currentTitle={conversation.title}
        onSave={handleSaveTitle}
      />

      <DeleteConversationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </div>
  )
}