---
name: Video Deletion Feature Implementation Plan
description: 'Comprehensive implementation plan for adding video deletion with Remove Selection button functionality to the Knowledge Base.'
---

🧠 Context about Project

YouTube-GPT is an intelligent YouTube search application that allows users to build a personal knowledge base from YouTube videos and channels. The platform uses AI-powered semantic search to help users quickly find information within hours of video content. Users can add individual videos or entire channels, and then search across multiple videos to get grounded answers with citations and timestamps. The system is built on Next.js 14 with Supabase for backend services, uses ZeroEntropy for vector embeddings and semantic search, and Inngest for background job processing. Currently, users can add videos, view them in a Knowledge Base explorer, select videos for AI conversation context, but they cannot yet permanently delete videos from their library once added.

🏗️ Context about Feature

This feature adds the ability to permanently delete selected videos from the user's knowledge base. The deletion must be performed through the `deleteVideoDocuments` Inngest function which already exists and handles the complete cleanup workflow: verifying video ownership, deleting all related documents from ZeroEntropy vector collection, and removing the video record from Supabase. The UI integration needs to add a "Remove Selection" button to the Knowledge Base column toolbar that appears when videos are selected. The button should trigger background deletion jobs via Inngest, show a confirmation dialog to prevent accidental deletions, provide user feedback with loading states and success/error toasts, and immediately remove deleted videos from the UI. The existing video selection infrastructure is already in place through `useVideoSelection` hook and `VideoSelectionContext`, which tracks selected videos across the application.

🎯 Feature Vision & Flow

When users have selected one or more videos in the Knowledge Base (indicated by checkmarks on video cards), a "Remove Selection" button appears in a toolbar above the video list. Clicking the button opens a confirmation dialog showing how many videos will be deleted and warning that deletion is permanent. Upon confirmation, the UI shows a loading state on the button and sends deletion events to Inngest for each selected video. While deletion is in progress, users can see the status via a progress indicator. Once background jobs complete successfully, the UI immediately removes those videos from the list without requiring a refresh, shows success toasts, and clears the selection. If any deletions fail, partial success is handled gracefully with error toasts showing which videos failed. The scope-aware chat functionality continues to work normally, but deleted videos are automatically excluded from future searches since they no longer exist in the user's collection.

📋 Implementation Plan: Tasks & Subtasks

## Task 1: Add Delete Button to KB Header ✅

[x] Create a delete button in the KB header (integrated into KBHeader component)
[x] Accept props: `selectedVideos: Set<string>`, `onRemove: () => void`, `isDeleting: boolean`  
[x] Use shadcn/ui Button component with Trash2 icon from lucide-react for the delete button
[x] Style with proper Tailwind classes - red color when active (text-red-600 hover:bg-red-100 hover:text-red-700)
[x] Show button becomes active when selectedVideos.size > 0
[x] Disable button when isDeleting is true and show a Loader2 spinner icon
[x] Position the button in the KB header toolbar (to the left of the folder icon)
[x] Import and integrate delete button functionality in `KnowledgeBase.tsx` KBHeader component

## Task 2: Implement Delete Confirmation Dialog ✅

[x] Import AlertDialog components from `@/components/ui/alert-dialog` 
[x] Create state for controlling dialog open/close: `const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)`
[x] Integrate AlertDialog with controlled open state in KBHeader component
[x] Add AlertDialogContent with appropriate styling for the confirmation dialog
[x] Display the number of selected videos: "Delete {count} video(s)?"
[x] Add warning message: "This action cannot be undone. The videos will be permanently removed from your knowledge base."
[x] Include AlertDialogFooter with Cancel and Delete action buttons
[x] Style the Delete button with destructive variant (bg-destructive text-destructive-foreground)
[x] Handle dialog state: open when delete button is clicked, close on Cancel or after confirmation (controlled via showDialog prop and callbacks)

## Task 3: Add Deletion Handler Function  

[ ] Import inngest client from `@/lib/inngest/client` in `KnowledgeBase.tsx`
[ ] Import toast hook: `const { toast } = useToast()` (already exists)
[ ] Create handler function `handleDeleteVideos` in `KnowledgeBase.tsx` that takes selectedVideos as parameter
[ ] Add state for tracking deletion progress: `const [deletingVideos, setDeletingVideos] = useState<Set<string>>(new Set())`
[ ] Extract userId from auth context using `useAuth` hook (check existing pattern in ChatArea.tsx)
[ ] Iterate over selectedVideos Set and send Inngest event for each: `inngest.send({ name: 'video.documents.deletion.requested', data: { videoId, userId } })`
[ ] Update deletingVideos state to track which videos are being deleted
[ ] Show loading toast: "Deleting {count} video(s)..."
[ ] Await all deletion events to be sent (use Promise.all for parallel dispatch)
[ ] On success, clear the selection with `clearSelection()`, show success toast with count
[ ] On error, show error toast with helpful message, keep failed videos in selection for retry
[ ] Clear deletingVideos state after completion

## Task 4: Create API Helper Function

[ ] Create new file `src/lib/video-deletion.ts` for client-side deletion helper
[ ] Export async function `deleteSelectedVideos(userId: string, videoIds: string[])`
[ ] Import inngest client for sending events: `import { inngest } from '@/lib/inngest/client'`
[ ] Map videoIds array to Inngest event sends using Promise.all for batch deletion
[ ] Each event: `{ name: 'video.documents.deletion.requested', data: { videoId, userId } }`
[ ] Return object with success status and any error information for UI feedback
[ ] Handle partial failures gracefully by returning which videos succeeded/failed
[ ] Add proper TypeScript types for function parameters and return value

## Task 5: Integrate Deletion with UI Components

[ ] Pass `handleDeleteVideos` function to SelectionToolbar component as onRemove prop
[ ] Pass `deletingVideos` Set to SelectionToolbar as isDeleting prop (check if any videos are in Set)
[ ] Wire up the Delete button in AlertDialog to call the handler
[ ] Extract selected video count: `const selectedCount = selectedVideos.size`
[ ] Use selectedCount in confirmation dialog for accurate count display
[ ] After successful deletion, locally filter out deleted videos from the videos array or rely on real-time updates
[ ] Import and call the API helper function inside handleDeleteVideos handler
[ ] Update deletingVideos state before and after the deletion API call

## Task 6: Add Real-time UI Updates

[ ] Check if useVideos hook already provides real-time updates (should handle Supabase realtime subscription)
[ ] Verify that videos state automatically updates when videos are deleted from database
[ ] If not, add manual filtering in KnowledgeBase to remove videos that no longer exist
[ ] Add useEffect to monitor videos array and clear selection when videos are removed
[ ] Ensure VideoList component properly re-renders when videos array changes
[ ] Test that selected videos are cleared after deletion completes successfully

## Task 7: Handle Edge Cases and Error States

[ ] Show warning if user tries to delete videos while deletion is already in progress (disable button)
[ ] Handle case where some videos fail to delete - show which ones failed in error toast
[ ] Prevent duplicate deletion requests for the same video (check deletingVideos Set)
[ ] Add try-catch blocks around deletion logic to prevent crashes on errors
[ ] Log errors to console for debugging: `console.error('Deletion failed:', error)`
[ ] Clear selection even if some videos failed to delete (don't leave partial selection state)
[ ] Handle network failures gracefully with retry suggestion in error message
[ ] Validate that selectedVideos are not empty before attempting deletion

## Task 8: Add Loading and Success Visual Feedback

[ ] Show spinner icon (Loader2) in Remove Selection button while deletion is in progress
[ ] Disable all selection-related UI while deletion is happening
[ ] Add visual indicator for which videos are being deleted (could use a pulsing border or overlay)
[ ] Show toast notification: "Successfully deleted X video(s)" on completion
[ ] Show error toast with specific count: "Failed to delete Y of X video(s)" if partial failure
[ ] Include cleanup toast: "Removing video documents and database records..."
[ ] Use proper toast variants: 'default' for success, 'destructive' for errors
[ ] Add duration/auto-dismiss timing to toasts (3000ms for info, 5000ms for errors)

## Task 9: Testing and Verification

[ ] Test deletion of single video
[ ] Test deletion of multiple videos (2, 3, 5+)
[ ] Test deletion cancellation (click Cancel in dialog)
[ ] Test error handling when Inngest function fails
[ ] Test UI updates immediately after deletion (videos disappear from list)
[ ] Test that deleted videos are removed from search results
[ ] Test that conversation scope updates when selected videos are deleted
[ ] Verify RLS (Row-Level Security) prevents deleting other users' videos
[ ] Check console for any errors or warnings during deletion process
[ ] Test that preview and selection states are properly cleaned up

## Task 10: Code Cleanup and Documentation

[ ] Remove any console.log debugging statements added during development  
[ ] Add JSDoc comments to new functions explaining parameters and return values
[ ] Update any relevant TypeScript interfaces if new prop types were added
[ ] Verify all imports are properly organized and unused imports removed
[ ] Check for consistent code formatting (Prettier should handle this)
[ ] Ensure SelectionToolbar follows the existing component patterns in the codebase
[ ] Add helpful comments for complex logic like state management and async operations
[ ] Review error messages for clarity and user-friendliness
[ ] Update component exports if new files were created
