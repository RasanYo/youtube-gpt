# Implementation Plan: Conversation Rename & Delete Features

## 🧠 Context about Project

**YouTube-GPT** is an AI-powered full-stack SaaS application that enables users to search, analyze, and extract information from YouTube video content. The platform allows users to add individual videos or entire channels to build a searchable knowledge base. Users can ask AI-powered questions across their video library and receive grounded answers with citations and timestamps.

The application uses Next.js 14 with App Router, Supabase for authentication and database operations, and implements a ChatGPT-style three-column interface. The system is built with full-stack vertical slices, focusing on reliability, scalability, and design quality. At its current stage, the app has basic conversation management, video ingestion, and chat functionality implemented, but lacks complete CRUD operations for conversations.

## 🏗️ Context about Feature

The conversation management system is currently built on top of the `ConversationContext`, which provides state management for the user's conversation list. The UI includes dropdown menus with "Edit title" and "Delete" options in the conversation item component (`conversation-item.tsx`), but only the edit functionality is fully implemented. The database operations are separated into `src/lib/supabase/conversations.ts`, which currently provides `getConversationsByUserId`, `createConversation`, and `updateConversationTitle` functions.

The messages table has a foreign key relationship to conversations with `ON DELETE CASCADE`, which means deleting a conversation will automatically delete all associated messages. The rename feature is already complete—it's wired through the context and database layers. However, the delete functionality needs to be implemented at the database, context, and UI layers.

## 🎯 Feature Vision & Flow

Users should be able to:
1. **Rename conversations** (already implemented): Click the three-dot menu on any conversation, select "Edit title," modify the title in a dialog, and have the change persist to the database and update the UI immediately.
2. **Delete conversations**: Click the three-dot menu, select "Delete," confirm in an alert dialog, and have the conversation removed from the database (with cascading message deletion) and updated in the UI. If the deleted conversation was the active one, the UI should switch to another conversation or show an empty state.

The system must handle error states gracefully, preserve data integrity through RLS policies, and maintain optimistic UI updates where appropriate.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Database Layer - Add Delete Function

- [x] **Task 1.1**: Add `deleteConversation` function to `src/lib/supabase/conversations.ts`
  - [x] Add the function signature: `export async function deleteConversation(conversationId: string): Promise<void>`
  - [x] Implement Supabase `.delete()` call with proper error handling matching the existing pattern
  - [x] Add JSDoc documentation explaining the function's purpose and parameters
  - [x] Ensure the function follows the same try-catch pattern as other functions in the file
  
  **Files to modify**: `src/lib/supabase/conversations.ts`
  
  **Validation**: 
  - Function should delete by `id` column
  - Function should throw meaningful error messages
  - Function should log errors to console
  - Function should match the error handling pattern of existing functions

---

### Phase 2: Context Layer - Expose Delete Functionality

- [x] **Task 2.1**: Import `deleteConversation` in `src/contexts/ConversationContext.tsx`
  - [x] Add import to the import statement at line 29-33
  - [x] Use named import: `deleteConversation as deleteConversationInDB` (following the existing pattern with `updateConversationTitle`)
  
  **Files to modify**: `src/contexts/ConversationContext.tsx` (line 29-33)
  
  **Validation**: 
  - Import should match the pattern of `updateConversationTitle as updateConversationTitleInDB`
  - No TypeScript errors in the import statement

- [x] **Task 2.2**: Add `deleteConversation` and `clearError` to `ConversationContextType` interface
  - [x] Add method signature after line 57: `deleteConversation: (conversationId: string) => Promise<void>`
  - [x] Include JSDoc comment: `/** Delete a conversation */`
  - [x] Add method signature: `clearError: () => void`
  - [x] Include JSDoc comment: `/** Clear the current error state */`
  
  **Files to modify**: `src/contexts/ConversationContext.tsx` (lines 39-58)
  
  **Validation**: 
  - Type definitions should be consistent with other methods
  - JSDoc comments should follow existing pattern
  - Both methods should be properly typed

- [x] **Task 2.3**: Implement `deleteConversation` function in the provider
  - [x] Add the function implementation after `updateConversationTitle` (after line 252)
  - [x] Follow the same pattern: check for user authentication, call database function, update local state
  - [x] Handle the active conversation switch: if deleted conversation is active, switch to the next available one or set to null
  - [x] Add proper error handling with try-catch, error state updates, and re-throw
  - [x] Use `useCallback` with appropriate dependencies: `[user, activeConversationId, conversations]`
  
  **Files to modify**: `src/contexts/ConversationContext.tsx` (after line 252)
  
  **Validation**: 
  - Function should delete from database first, then update local state
  - Function should handle switching active conversation if needed
  - Function should update `conversations` state to remove deleted conversation
  - Function should update `activeConversationId` if deleted conversation was active
  - Function should set error state on failure
  - Function should be wrapped in `useCallback` with correct dependencies

- [x] **Task 2.3a**: Add conversation existence validation (Security Enhancement)
  - [x] Check if conversation exists in local `conversations` array before attempting deletion
  - [x] Log a warning if conversation is not found in local state
  - [x] Early return if conversation doesn't exist (prevent unnecessary database calls)
  - [x] Add validation: `const conversationExists = conversations.some(conv => conv.id === conversationId)`
  
  **Files to modify**: `src/contexts/ConversationContext.tsx` (within Task 2.3 implementation)
  
  **Validation**: 
  - Should check conversation exists in local state before proceeding
  - Should log warning if conversation not found
  - Should not throw error if conversation missing (graceful degradation)
  - Should prevent unnecessary database calls for non-existent conversations

- [x] **Task 2.3b**: Add race condition protection for delete operations (Security Enhancement)
  - [x] Add `isDeleting` state variable (similar to existing `isCreating` state)
  - [x] Check `isDeleting` flag at start of function to prevent concurrent deletions
  - [x] Set `isDeleting` to true before deletion, false after completion
  - [x] Early return with warning log if deletion already in progress
  - [x] Initialize state: `const [isDeleting, setIsDeleting] = useState(false)`
  
  **Files to modify**: `src/contexts/ConversationContext.tsx` (add state at line 86, update Task 2.3)
  
  **Validation**: 
  - Should prevent multiple simultaneous delete operations
  - Should log warning if delete attempted while one is in progress
  - Should follow same pattern as `isCreating` state management
  - Should not affect other operations (create, update)

- [x] **Task 2.3c**: Improve error recovery and user feedback (UX Enhancement)
  - [x] Add `clearError` method to context interface to allow manual error clearing
  - [x] Expose `clearError` method in context value for user-triggered error dismissal
  - [x] Implement `clearError` function that resets error state to null
  - [ ] Update error display in sidebar to show dismiss button
  - [x] Add JSDoc: `/** Clear the current error state */`
  
  **Files to modify**: `src/contexts/ConversationContext.tsx` (interface at line 57, implementation, expose at line 294)
  
  **Validation**: 
  - `clearError` method should be accessible from context
  - Should reset error state to null
  - Should be callable from error UI components
  - Should not interfere with current error handling flow

- [x] **Task 2.4**: Expose `deleteConversation` and `clearError` in context value
  - [x] Add `deleteConversation` to the `value` object at line 285-295
  - [x] Add `clearError` to the `value` object (from Task 2.3c)
  
  **Files to modify**: `src/contexts/ConversationContext.tsx` (line 294)
  
  **Validation**: 
  - Both methods should be added to the context value object
  - Context value should include all existing properties plus new methods
  - No TypeScript errors in context value definition

---

### Phase 3: Component Layer - Wire Up Delete Handler

- [x] **Task 3.1**: Add `onDelete` prop to `ConversationItemProps` interface
  - [x] Add optional prop: `onDelete?: (conversationId: string) => Promise<void>` at line 42
  
  **Files to modify**: `src/components/conversations/conversation-item.tsx` (line 42)
  
  **Validation**: 
  - Prop should be optional (using `?`)
  - Prop signature should match the context method
  - Prop should accept conversationId as parameter

- [x] **Task 3.2**: Update `ConversationItem` to accept and use `onDelete` prop
  - [x] Add `onDelete` to the destructured props at line 172
  - [x] Update `handleDelete` function (lines 183-186) to call `onDelete` with proper error handling
  - [x] Handle async operations and error logging
  - [x] Ensure dialog closes appropriately (automatic via context state)
  
  **Files to modify**: `src/components/conversations/conversation-item.tsx` (lines 172, 183-186)
  
  **Validation**: 
  - `onDelete` should be destructured from props
  - `handleDelete` should check if `onDelete` exists before calling
  - `handleDelete` should be async and await the onDelete call
  - `handleDelete` should have try-catch for error handling
  - `handleDelete` should log errors but not prevent dialog from closing
  - Function should handle undefined onDelete gracefully

---

### Phase 4: Integration - Connect Parent and Child Components

- [x] **Task 4.1**: Extract `deleteConversation` from context in `conversation-sidebar.tsx`
  - [x] Add `deleteConversation` to the destructured context values at line 13-21
  
  **Files to modify**: `src/components/conversations/conversation-sidebar.tsx` (lines 13-21)
  
  **Validation**: 
  - `deleteConversation` should be included in useConversation destructuring
  - No unused variable warnings

- [x] **Task 4.2**: Pass `deleteConversation` to each `ConversationItem`
  - [x] Add `onDelete={deleteConversation}` prop to the `ConversationItem` component at line 67-73
  
  **Files to modify**: `src/components/conversations/conversation-sidebar.tsx` (line 73)
  
  **Validation**: 
  - Prop should be passed to ConversationItem
  - Prop name should match the interface definition
  - No TypeScript errors in parent component

---

### Phase 5: Testing & Validation

- [ ] **Task 5.1**: Test rename functionality
  - [ ] Open the application and navigate to the conversations sidebar
  - [ ] Click the three-dot menu on any conversation
  - [ ] Select "Edit title" and verify the dialog opens
  - [ ] Enter a new title and click "Save"
  - [ ] Verify the title updates in the UI immediately
  - [ ] Refresh the page and verify the title persists
  - [ ] Test with empty title (should be prevented)
  - [ ] Test with very long title (should truncate gracefully)
  
  **Validation**: 
  - Rename dialog should open when clicking menu option
  - Title should update in UI after save
  - Title should persist after page refresh
  - Empty title save should be prevented
  - No console errors during rename operation

- [ ] **Task 5.2**: Test delete functionality
  - [ ] Create a test conversation
  - [ ] Click the three-dot menu and select "Delete"
  - [ ] Verify the confirmation dialog appears
  - [ ] Click "Cancel" and verify conversation remains
  - [ ] Open menu again, select "Delete" and confirm
  - [ ] Verify conversation disappears from list
  - [ ] Verify all associated messages are deleted (check database if possible)
  - [ ] Test deleting the active conversation: verify UI switches to another conversation
  - [ ] Test deleting the last conversation: verify empty state appears
  - [ ] Verify no console errors during delete operations
  
  **Validation**: 
  - Delete dialog should appear with confirmation message
  - Cancel should abort the operation
  - Delete should remove conversation from UI
  - Deleted conversation should not appear after page refresh
  - When deleting active conversation, UI should switch to next available
  - When deleting last conversation, empty state should appear
  - No console errors during delete operation
  - Database should have no orphaned messages

- [ ] **Task 5.3**: Test error handling
  - [ ] Test delete operation without authentication (should not be possible in normal flow)
  - [ ] Test with invalid conversation ID (edge case)
  - [ ] Test concurrent operations (rapid clicking)
  - [ ] Verify error messages are logged to console
  - [ ] Verify UI state remains consistent on errors
  
  **Validation**: 
  - Errors should be logged with meaningful messages
  - UI should not break on errors
  - Error state should be accessible to user (via context error property)
  - No unhandled promise rejections

- [ ] **Task 5.4**: Test race condition protection
  - [ ] Rapidly click delete on multiple conversations to trigger concurrent operations
  - [ ] Verify only one deletion proceeds at a time
  - [ ] Verify warning logs appear for blocked concurrent attempts
  - [ ] Verify `isDeleting` flag prevents duplicate deletions
  - [ ] Test canceling a deletion in progress and immediately attempting another
  
  **Validation**: 
  - Should prevent multiple simultaneous delete operations
  - Warning logs should appear in console for blocked attempts
  - Second deletion should wait for first to complete
  - No database errors from concurrent operations
  - UI should remain responsive during deletion

- [ ] **Task 5.5**: Test conversation existence validation
  - [ ] Attempt to delete a conversation that was just deleted by another tab/session
  - [ ] Verify graceful handling when conversation not found in local state
  - [ ] Verify warning is logged but no error is thrown
  - [ ] Verify UI remains stable even with stale conversation IDs
  
  **Validation**: 
  - Should handle missing conversations gracefully
  - Should log warning without throwing errors
  - Should not make unnecessary database calls
  - UI should remain consistent after handling

- [ ] **Task 5.6**: Test error recovery UX
  - [ ] Trigger a delete error (e.g., by disconnecting network)
  - [ ] Verify error message appears in the sidebar
  - [ ] Test `clearError` function is accessible (if implemented in UI)
  - [ ] Verify retry mechanism works
  - [ ] Verify error state can be manually cleared
  
  **Validation**: 
  - Error should be visible to user
  - Error should be dismissible/clearable
  - Retry should reload conversations after error
  - No orphaned error states in UI

---

## 🎯 Success Criteria

✅ **Rename Feature** (Already Complete):
- Users can click edit from dropdown and modify conversation titles
- Changes persist to database and update UI immediately
- All existing functionality continues to work

✅ **Delete Feature** (To Be Implemented):
- Users can delete conversations from the dropdown menu
- Confirmation dialog prevents accidental deletions
- Deleted conversations are removed from database and UI
- Associated messages are automatically deleted (cascade)
- Active conversation handling works correctly
- Error states are handled gracefully
- No data integrity issues or console errors
- Race condition protection prevents concurrent deletions
- Existence validation prevents unnecessary database calls
- User-triggered error recovery via `clearError` method

## 📝 Notes

### Database Security
- The database has `ON DELETE CASCADE` enabled, so messages will be automatically deleted
- RLS policies ensure users can only delete their own conversations at the database level
- `auth.uid() = user_id` policy prevents unauthorized access even if client is compromised

### Implementation Security
- **Race condition protection**: `isDeleting` state prevents concurrent delete operations
- **Existence validation**: Pre-checks conversation exists in local state before database calls
- **Error recovery**: Graceful degradation with user-triggered error clearing
- **UI consistency**: Error handling prevents orphaned states in the UI

### Technical Details
- The implementation follows existing patterns in the codebase
- No migrations needed as database schema already supports DELETE operations
- Both features use existing UI components (Dialog, AlertDialog) from shadcn/ui
- Supabase client uses PKCE flow for enhanced security on authentication
- Session persistence and auto-refresh ensure continuous authentication
