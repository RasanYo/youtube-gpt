# Testing Checklist for Conversation Rename & Delete Features

## ✅ Implementation Status
All implementation phases (1-4) are complete. The following tests need to be performed:

## 🧪 Test Scenarios

### Test 5.1: Rename Functionality
- [ ] Open the application at http://localhost:8080
- [ ] Navigate to the conversations sidebar (left column)
- [ ] Click the three-dot menu (⋮) on any conversation
- [ ] Select "Edit title" 
- [ ] Verify the dialog opens with the current title
- [ ] Enter a new title (e.g., "Test Title")
- [ ] Click "Save"
- [ ] Verify the title updates in the UI immediately
- [ ] Refresh the page (F5)
- [ ] Verify the title persists after refresh
- [ ] Test cancel: Open edit dialog, change title, click "Cancel" → title should not change
- [ ] Test empty title: Try to save with empty/whitespace title → should be prevented (button disabled)
- [ ] Test very long title → should display with truncation

### Test 5.2: Delete Functionality
- [ ] Create a test conversation (click "New Chat" if needed)
- [ ] Click the three-dot menu on the test conversation
- [ ] Select "Delete"
- [ ] Verify the confirmation dialog appears with "Are you sure..."
- [ ] Click "Cancel" → conversation should still exist
- [ ] Open menu again, select "Delete" and confirm
- [ ] Verify conversation disappears from list
- [ ] Refresh the page → conversation should not reappear
- [ ] **Test deleting active conversation:**
  - Make a conversation active (click on it)
  - Delete that conversation
  - Verify UI switches to another conversation automatically
- [ ] **Test deleting last conversation:**
  - Keep only one conversation
  - Delete it
  - Verify empty state appears with "No conversations yet"
- [ ] Check browser console → should have no errors

### Test 5.3: Error Handling
- [ ] Check browser console → should have no errors
- [ ] Test rapid clicking on delete button → should handle gracefully
- [ ] Verify error messages appear in sidebar if any operation fails

### Test 5.4: Race Condition Protection
- [ ] Rapidly click delete on multiple conversations
- [ ] Verify only one deletion proceeds at a time
- [ ] Check console for warning logs about concurrent attempts (if any)

### Test 5.5: Conversation Existence Validation
- [ ] Open two browser tabs with the app
- [ ] In tab 1: Delete a conversation
- [ ] In tab 2: Try to delete the same conversation (should be gone but this tests handling)
- [ ] Verify no errors occur, graceful handling

### Test 5.6: Error Recovery UX
- [ ] If any errors occur, verify they appear in the sidebar
- [ ] Verify there's a "Retry" button in error state
- [ ] Click "Retry" → should reload conversations

## 📊 Expected Results
✅ All dialogs should work smoothly
✅ No console errors
✅ Database operations should succeed (check in Supabase if possible)
✅ Messages should be deleted when conversation is deleted (cascade)
✅ UI should update immediately and persist after refresh
✅ Active conversation should switch appropriately when deleted
✅ Empty state should appear when last conversation is deleted

## 🐛 If Issues Found
Document any issues with:
1. Steps to reproduce
2. Browser console errors
3. Expected vs actual behavior
