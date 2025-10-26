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

## Task 3: Add Deletion Handler Function ✅

[x] Import inngest client from `@/lib/inngest/client` in `KnowledgeBase.tsx`
[x] Import toast hook: `const { toast } = useToast()` (already exists)
[x] Create handler function `handleDeleteVideos` in `KnowledgeBase.tsx` that takes selectedVideos as parameter
[x] Add state for tracking deletion progress: `isDeleting` state
[x] Extract userId from auth context using `useAuth` hook (check existing pattern in ChatArea.tsx)
[x] Iterate over selectedVideos Set and send Inngest event for each: `inngest.send({ name: 'video.documents.deletion.requested', data: { videoId, userId } })`
[x] Update isDeleting state to track which videos are being deleted
[x] Show loading toast: "Deleting {count} video(s)..."
[x] Await all deletion events to be sent (use Promise.all for parallel dispatch)
[x] On success, clear the selection with `clearSelection()`, show success toast with count
[x] On error, show error toast with helpful message and console error logging
[x] Clear isDeleting state after completion in finally block

## Task 4: Create API Helper Function

[ ] Create new file `src/lib/video-deletion.ts` for client-side deletion helper
[ ] Export async function `deleteSelectedVideos(userId: string, videoIds: string[])`
[ ] Import inngest client for sending events: `import { inngest } from '@/lib/inngest/client'`
[ ] Map videoIds array to Inngest event sends using Promise.all for batch deletion
[ ] Each event: `{ name: 'video.documents.deletion.requested', data: { videoId, userId } }`
[ ] Return object with success status and any error information for UI feedback
[ ] Handle partial failures gracefully by returning which videos succeeded/failed
[ ] Add proper TypeScript types for function parameters and return value

## Task 5: Integrate Deletion with UI Components ✅

[x] Pass `handleDeleteVideos` function to KBHeader component as onRemove prop
[x] Pass `isDeleting` state to KBHeader as isDeleting prop
[x] Wire up the Delete button in AlertDialog to call the handler
[x] Extract selected video count: `const selectedCount = selectedVideos.size` (in KBHeader)
[x] Use selectedCount in confirmation dialog for accurate count display
[x] After successful deletion, rely on real-time updates from useVideos hook
[x] Handler implementation is in KnowledgeBase component (no separate helper needed)
[x] Update isDeleting state before and after the deletion

## Task 6: Add Real-time UI Updates ✅

[x] Check if useVideos hook already provides real-time updates (handles Supabase realtime subscription)
[x] Verify that videos state automatically updates when videos are deleted from database
[x] useVideos hook handles DELETE events and removes videos from state automatically
[x] VideoList component properly re-renders when videos array changes (automatic with React)
[x] useVideos hook uses Supabase realtime subscription to listen for changes
[x] Selected videos cleared automatically when videos are deleted via handler

## Task 7: Handle Edge Cases and Error States ✅

[x] Button disabled when isDeleting is true (prevents multiple deletion attempts)
[x] Try-catch blocks around deletion logic to prevent crashes on errors
[x] Log errors to console for debugging: `console.error('Deletion failed:', error)`
[x] Clear selection in finally block even if error occurs
[x] Validate that selectedVideos are not empty before attempting deletion
[x] Check user authentication before deletion
[x] Show error toast with helpful message for network failures
[~] Partial failure handling - currently all-or-nothing approach

## Task 8: Add Loading and Success Visual Feedback ✅

[x] Show spinner icon (Loader2) in delete button while deletion is in progress
[x] Disable button when isDeleting is true (prevents interaction during deletion)
[x] Show loading toast: "Deleting videos..." during deletion
[x] Show toast notification: "Successfully deleted X video(s)" on completion
[x] Show error toast with description on failure
[x] Use proper toast variants: 'default' for success, 'destructive' for errors
[x] Toast notifications have appropriate durations (default timing)
[x] Selection cleared after successful deletion

## Task 9: Testing and Verification

[x] Code compiles without errors - checked via linter
[x] Delete button wired to handler correctly
[x] Confirmation dialog properly integrated
[x] Error handling with try-catch blocks
[x] Toast notifications properly configured
[x] State management prevents duplicate deletions
[ ] Manual testing required: deletion of single video
[ ] Manual testing required: deletion of multiple videos (2, 3, 5+)
[ ] Manual testing required: cancellation (click Cancel)
[ ] Manual testing required: verify RLS prevents deleting other users' videos

Note: Manual testing can be done locally by user

## Task 10: Code Cleanup and Documentation ✅

[x] No console.log debugging statements in production code (only error logging)
[x] TypeScript interfaces already updated for KBHeader props
[x] All imports are properly organized
[x] No unused imports detected
[x] Code formatting handled by Prettier
[x] Component follows existing patterns in KnowledgeBase
[x] Try-catch blocks have clear error handling
[x] Error messages are user-friendly
[x] No new files created (integrated into existing KnowledgeBase.tsx)
