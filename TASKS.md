# Video Deletion Fix - Implementation Plan

## 🧠 Context about Project

**YouTube-GPT** is a full-stack AI-powered search application that helps users find information hidden inside hours of YouTube video content. Users can add individual videos or full channels to create a searchable personal knowledge base. The app uses Next.js 14 (App Router), Supabase for auth/database, ZeroEntropy for vector search, and Inngest for background job processing (transcription, embeddings generation). The application features a three-column ChatGPT-style interface with conversation history, real-time chat, and a knowledge base explorer.

Currently, the system has a critical bug where video deletion functions work perfectly in local development but fail completely in Vercel production environment. This is blocking users from managing their knowledge base in production.

## 🏗️ Context about Feature

The video deletion feature is part of the knowledge base management system. When users select videos and trigger deletion, the system should:
1. Update video status to PROCESSING (UI feedback)
2. Trigger Inngest background job to delete documents from ZeroEntropy
3. Delete videos from Supabase database
4. Show success/error feedback to user

**Problem:** Client-side code (`knowledge-base.tsx`) imports and calls `triggerVideoDocumentsDeletion` from `@/lib/inngest/triggers`. This function uses the Inngest client which requires `INNGEST_EVENT_KEY` environment variable. In production, this env var isn't available in the browser bundle, causing `inngest.send()` calls to fail silently or with errors. The Inngest client at `src/lib/inngest/client.ts` initializes with `process.env` values that don't exist in client-side code.

**Architecture Pattern:** The project already uses server-side API routes for sensitive operations (see `src/app/api/chat/route.ts`). Server-side code runs in Node.js environment with full access to environment variables.

## 🎯 Feature Vision & Flow

Users should be able to delete videos from their knowledge base seamlessly in both local and production environments. When they select videos and confirm deletion:
1. Client sends POST request to `/api/videos/delete` with videoIds array
2. Server-side API route validates authentication via Supabase
3. API route triggers Inngest deletion events for each video using server-side Inngest client
4. Inngest background function processes deletions asynchronously
5. Client receives success/failure feedback immediately
6. UI updates to reflect deletion status

The key change is routing Inngest event triggers through server-side API instead of calling them directly from client components.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Create Server-Side Supabase Client Helper
- [x] **Task 1.1:** Create `src/lib/supabase/server.ts` for server-side Supabase operations
  - Create server-side client using `createServerClient` from `@supabase/ssr`
  - Import `cookies` from `next/headers` for cookie management
  - Configure cookie handlers (get, set, remove) for session management
  - Export `createClient` function that returns authenticated Supabase client instance
  - Add error handling for missing environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - Wrap cookie set/remove calls in try-catch for server component compatibility
  - Reference: Next.js docs for Supabase SSR client setup

**Validation Criteria:**
- ✅ Server client utility exists at `src/lib/supabase/server.ts`
- ✅ Uses `createServerClient` from `@supabase/ssr` (not client-side createClient)
- ✅ Properly handles cookies using Next.js cookies() helper
- ✅ Test with Postman/curl to verify cookie-based auth works
- ✅ Can instantiate client successfully in API route context

---

### Phase 2: Create Video Deletion API Route
- [x] **Task 2.1:** Create `src/app/api/videos/delete/route.ts` file structure
  - Set up POST handler function
  - Import Next.js Response utilities
  - Add basic error handling structure
  - Follow Next.js App Router API route conventions

- [x] **Task 2.2:** Implement request validation
  - Validate request method (POST only)
  - Parse and validate `videoIds` array from request body
  - Verify videoIds is non-empty array
  - Return 400 error for invalid requests
  - Log validation errors for debugging

- [x] **Task 2.3:** Add authentication check using server client
  - Import `createClient` from `@/lib/supabase/server`
  - Create Supabase client instance: `const supabase = await createClient()`
  - Call `supabase.auth.getUser()` to get authenticated user
  - Return 401 Unauthorized if user is not authenticated or auth fails
  - Extract userId from authenticated user object
  - Log authentication failures for debugging

- [x] **Task 2.4:** Implement Inngest event triggering
  - Import `triggerVideoDocumentsDeletion` from `@/lib/inngest/triggers`
  - Loop through videoIds array
  - Call `triggerVideoDocumentsDeletion(videoId, userId)` for each
  - Use `Promise.allSettled()` to handle batch operations
  - Track success/failure counts for each video
  - Log triggering results

- [x] **Task 2.5:** Add response handling
  - Return JSON response with success status
  - Include triggered count (successful events sent)
  - Include failed count (events that couldn't be sent)
  - Return 500 error if all events fail
  - Return 207 (partial success) if some succeed and some fail

**Validation Criteria:**
- ✅ API route responds to POST requests at `/api/videos/delete`
- ✅ Returns 401 for unauthenticated requests
- ✅ Returns 400 for invalid/missing videoIds array
- ✅ Successfully triggers Inngest events for authenticated users
- ✅ Returns proper JSON response with success/failure counts
- ✅ Test with cURL/Postman: unauthorized request returns 401
- ✅ Test with valid auth: events appear in Inngest dashboard

---

### Phase 3: Update Client Component
- [x] **Task 3.1:** Remove direct Inngest import from knowledge-base.tsx
  - Remove `import { triggerVideoDocumentsDeletion } from '@/lib/inngest/triggers'`
  - Keep all other imports unchanged
  - Verify no other direct Inngest client usage in component

- [x] **Task 3.2:** Keep immediate UI feedback, then call API route
  - Keep existing PROCESSING status update (lines 108-119) for immediate user feedback
  - Add fetch call to POST `/api/videos/delete` endpoint with videoIds array
  - Replace `triggerVideoDocumentsDeletion()` calls with this API fetch
  - Send `{ videoIds: Array.from(selectedVideos) }` as request body
  - Set Content-Type header to 'application/json'
  - Keep the toast notification showing deletion progress
  - This hybrid approach provides instant UI feedback while server handles actual deletion

- [x] **Task 3.3:** Update error handling in handleDeleteVideos
  - Keep existing try-catch structure
  - Check `response.ok` status after fetch completes
  - Parse error response body if request fails
  - Show appropriate toast messages based on API response (401, 400, 500 errors)
  - Log errors to console for debugging
  - Handle both client-side and server-side failures gracefully

- [x] **Task 3.4:** Update success feedback based on API response
  - Parse API response JSON to get success/failure counts
  - Show success toast with accurate count of videos successfully queued for deletion
  - Show partial success message if some videos failed to queue
  - Clear selection after successful API call (even if partial)
  - Reset UI state (setIsDeleting(false), setShowDeleteConfirm(false))
  - Handle cases where API returns success but some events failed to trigger

**Validation Criteria:**
- ✅ KnowledgeBase component no longer imports Inngest triggers
- ✅ handleDeleteVideos calls `/api/videos/delete` API route
- ✅ Error handling works for 401/400/500 responses
- ✅ Success toast shows correct count of deleted videos
- ✅ UI updates correctly (selection cleared, loading states)
- ✅ Manual test in browser: delete videos and verify API is called

---

### Phase 4: Testing & Verification
- [ ] **Task 4.1:** Manual local testing
  - Start dev server with `pnpm dev`
  - Start Inngest dev server with `npx inngest-cli dev`
  - Test video deletion in local environment
  - Verify events appear in Inngest dev dashboard
  - Verify Inngest function executes successfully
  - Check Supabase database for deleted records
  - Check ZeroEntropy for deleted documents

- [ ] **Task 4.2:** Manual production testing
  - Deploy to Vercel (push to main branch)
  - Test video deletion in production environment
  - Verify events appear in Inngest cloud dashboard
  - Verify Inngest function executes in cloud
  - Check production Supabase for deleted records
  - Monitor Vercel logs for any errors
  - Check Inngest dashboard for function execution logs

- [ ] **Task 4.3:** Edge case testing
  - Test deletion with single video
  - Test deletion with multiple videos (batch)
  - Test deletion when user is not authenticated
  - Test deletion with invalid videoIds array
  - Test deletion when network fails
  - Test concurrent deletion requests
  - Verify RLS policies still work (users can only delete own videos)

- [ ] **Task 4.4:** Verify existing functionality still works
  - Test video ingestion still works
  - Test video processing pipeline
  - Test chat functionality
  - Test knowledge base search
  - Test conversation history
  - Verify no regressions in other features

**Validation Criteria:**
- ✅ Video deletion works in local dev environment
- ✅ Video deletion works in Vercel production environment
- ✅ Events are successfully triggered to Inngest cloud
- ✅ Background functions execute and delete data correctly
- ✅ All edge cases handled gracefully
- ✅ No regressions in other functionality
- ✅ Production logs show successful API calls and Inngest triggers

---

### Phase 5: Code Quality & Documentation
- [x] **Task 5.1:** Add code comments and JSDoc
  - Document API route handler with JSDoc
  - Add comments explaining authentication flow
  - Add comments explaining batch deletion logic
  - Document response format and error codes
  - Reference existing code style patterns

- [x] **Task 5.2:** Update relevant documentation
  - Update README if API route creation needed clarification
  - Document the fix in architecture notes
  - Add troubleshooting note about client vs server Inngest usage
  - Update inline comments in knowledge-base.tsx if needed

- [x] **Task 5.3:** Clean up any temporary/debug code
  - Remove any console.log statements added for debugging
  - Remove any commented out code
  - Ensure consistent error logging patterns
  - Verify code follows project conventions (kebab-case, etc.)

**Validation Criteria:**
- ✅ All code is well-documented with JSDoc
- ✅ Comments explain architecture decisions
- ✅ README/docs updated with relevant information
- ✅ No debug code or console.logs in production code
- ✅ Code follows project conventions and style guide

---

## 🔍 Testing Strategy Summary

**Local Testing:**
- Start Inngest dev server alongside Next.js dev server
- Monitor Inngest dev dashboard for events
- Check Supabase local database for data changes
- Verify ZeroEntropy documents are deleted

**Production Testing:**
- Deploy to Vercel
- Monitor Inngest cloud dashboard
- Check production Supabase database
- Verify Vercel logs show successful API calls
- Test authentication flow works in production

**Test Scenarios:**
1. Single video deletion
2. Batch video deletion (multiple videos)
3. Unauthenticated request (should return 401)
4. Invalid request (missing videoIds - should return 400)
5. Network failure handling
6. Partial failure (some events succeed, some fail)
7. Verify RLS policies enforced

## 📝 Notes

- **Key Architectural Change:** Moving from client-side Inngest trigger calls to server-side API route pattern (similar to `/api/chat/route.ts`)
- **Auth Pattern:** Using Supabase SSR client with cookies - instantiate client in API route using `createClient()` from `@/lib/supabase/server`
- **Client-Side Fix:** Updated `src/lib/supabase/client.ts` to use `createBrowserClient` from `@supabase/ssr` instead of `createClient` from `@supabase/supabase-js`. This ensures cookie-based authentication works seamlessly between client components and server-side API routes.
- **Hybrid UI Approach:** Keep immediate PROCESSING status update on client for UX, but route actual deletion through API route for Vercel compatibility
- **Error Handling:** Maintain existing UI feedback patterns (toasts, loading states) while adding proper HTTP error responses from API route
- **Backwards Compatibility:** Inngest function signature remains unchanged (videoId, userId)
- **No Breaking Changes:** Existing Inngest functions (`deleteVideoDocuments`) don't need modification
- **Performance:** Batch deletion using Promise.allSettled() in API route is efficient for multiple videos
- **Security:** Authentication enforced at API route level prevents unauthorized deletions via RLS policies
- **Vercel Requirements:** Ensure `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are set in Vercel environment variables before deployment

