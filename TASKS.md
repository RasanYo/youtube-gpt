# Implementation Plan: Fix Multiple Supabase Subscriptions

## 🧠 Context about Project

YouTube-GPT is an AI-powered YouTube search application that allows users to build a searchable knowledge base from YouTube videos. Users can add individual videos or entire channels, and the system ingests transcripts using Inngest background jobs. The AI assistant can answer questions across the user's video library, with citation support including timestamps. The application uses Next.js 14 with App Router, Supabase for database and authentication, and features a three-column ChatGPT-style interface with conversation history, chat area, and knowledge base explorer.

## 🏗️ Context about Feature

The current implementation has a critical issue where `useVideos` hook is called from 3 different components (VideoPreviewContext, AuthenticatedChatArea, KnowledgeBase), creating 3 separate Supabase realtime subscriptions. This causes:
- Resource waste (3 WebSocket connections instead of 1)
- "Subscription closed" warnings in console when components unmount/remount
- Potential race conditions with state updates
- Database load from multiple queries

The fix is to move the subscription management to a VideosContext provider, following the existing pattern used by VideoSelectionContext, VideoPreviewContext, and ConversationContext. This ensures a single subscription exists at the provider level and is shared across all consumers.

## 🎯 Feature Vision & Flow

After implementation:
- Only ONE Supabase subscription exists per user session
- All components that need videos data consume the same context
- Subscription cleanup is managed centrally
- No more "Subscription closed" warnings in console
- Real-time video deletion updates work immediately
- Better performance and resource efficiency

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Create VideosContext Provider
**Goal**: Create a new context provider that manages videos state and Supabase subscription

#### Subtask 1.1: Create VideosContext file
- [x] Create `src/contexts/VideosContext.tsx`
- [x] Import necessary dependencies: `createContext`, `useContext`, `useState`, `useEffect`, `useRef`, `useCallback` from React
- [x] Import `supabase` from `@/lib/supabase/client`
- [x] Import `Video` type from `@/lib/supabase/types`
- [x] Import `useAuth` from `@/contexts/AuthContext`

#### Subtask 1.2: Define context interface and initial setup
- [x] Define `VideosContextType` interface with: `videos: Video[]`, `isLoading: boolean`, `error: string | null`, `refetch: () => Promise<void>`
- [x] Create context using `createContext<VideosContextType | undefined>(undefined)`
- [x] Export `useVideos` hook that throws error if used outside provider

#### Subtask 1.3: Implement VideosProvider component
- [x] Create `VideosProvider` function component with `{ children }: { children: React.ReactNode }` prop
- [x] Initialize state: `videos`, `isLoading`, `error` using `useState`
- [x] Get `user` from `useAuth()`
- [x] Create refs: `channelRef` (for subscription channel) and `subscriptionRef` (boolean flag)

#### Subtask 1.4: Implement fetchVideos function
- [x] Create `fetchVideos` callback using `useCallback` with `user?.id` dependency
- [x] Add guard clause: return early if no `user?.id`
- [x] Set `isLoading(true)` and `error(null)` at start
- [x] Query Supabase: `supabase.from('videos').select('*').eq('userId', user.id).order('createdAt', { ascending: false })`
- [x] Handle errors: catch block should log error and set error message
- [x] Update state: `setVideos(data || [])`
- [x] Set `isLoading(false)` in finally block

#### Subtask 1.5: Implement subscription setup in useEffect
- [x] Create `useEffect` with dependencies `[user?.id, fetchVideos]`
- [x] Add guard: if no user, clear videos state and return
- [x] Add guard: if `subscriptionRef.current` is true, log "already exists" and return
- [x] Call `fetchVideos()` for initial load
- [x] Set `subscriptionRef.current = true`
- [x] Create unique channel name: `video-changes-${user.id}-${Date.now()}`
- [x] Build channel using `supabase.channel(channelName).on('postgres_changes', ...)`
- [x] Configure postgres_changes: event `'*'`, schema `'public'`, table `'videos'`, filter `userId=eq.${user.id}`
- [x] Handle payload: INSERT (unshift new video), UPDATE (map and replace), DELETE (filter out)
- [x] Subscribe with callback that handles SUBSCRIBED, CHANNEL_ERROR, CLOSED, TIMED_OUT statuses
- [x] Store channel in `channelRef.current` only when SUBSCRIBED

#### Subtask 1.6: Implement cleanup function
- [x] Return cleanup function from useEffect
- [x] If `channelRef.current` exists, call `supabase.removeChannel(channelRef.current)`
- [x] Set `channelRef.current = null`
- [x] Set `subscriptionRef.current = false`

#### Subtask 1.7: Implement refetch function and provider return
- [x] Create `refetch` using `useCallback` that calls `fetchVideos()` with guard for `user?.id`
- [x] Memoize context value with `{ videos, isLoading, error, refetch }`
- [x] Return `VideosContext.Provider` with value and children

**Validation Criteria**:
- [x] TypeScript compiles without errors
- [x] No linter errors in new file
- [x] Follows same pattern as VideoSelectionContext and VideoPreviewContext

---

### Task 2: Integrate VideosContext into App Providers
**Goal**: Add VideosProvider to the app provider hierarchy

#### Subtask 2.1: Update providers.tsx
- [x] Open `src/app/providers.tsx`
- [x] Add import: `import { VideosProvider } from '@/contexts/VideosContext'`
- [x] Wrap existing providers with `<VideosProvider>` after `<AuthProvider>` (order matters: Videos needs Auth)
- [x] Ensure VideosProvider is before ConversationProvider in the hierarchy

#### Subtask 2.2: Verify provider order
- [x] Confirm order is: QueryClientProvider > TooltipProvider > AuthProvider > VideosProvider > ConversationProvider > VideoSelectionProvider > VideoPreviewProvider
- [x] This order ensures dependencies are available when contexts initialize

**Validation Criteria**:
- [x] App builds successfully
- [x] Provider hierarchy follows dependency order (Auth before Videos)
- [x] No circular dependency warnings

---

### Task 3: Update Components to Use VideosContext
**Goal**: Replace direct useVideos imports with context consumption

#### Subtask 3.1: Update VideoPreviewContext.tsx
- [x] Open `src/contexts/VideoPreviewContext.tsx`
- [x] Replace import: change `from '@/hooks/useVideos'` to `from '@/contexts/VideosContext'`
- [x] No other changes needed - component already calls `useVideos()` which now comes from context

**Validation Criteria**:
- [x] VideoPreviewContext still works correctly
- [x] Videos are available for preview functionality
- [x] No console errors

#### Subtask 3.2: Update AuthenticatedChatArea.tsx
- [x] Open `src/components/chat/authenticated-chat-area.tsx`
- [x] Replace import: change `from '@/hooks/useVideos'` to `from '@/contexts/VideosContext'`
- [x] No other changes needed - component uses videos for VideoScopeBar

**Validation Criteria**:
- [x] Chat area renders correctly
- [x] VideoScopeBar shows videos
- [x] No console errors

#### Subtask 3.3: Update KnowledgeBase.tsx
- [x] Open `src/components/knowledge-base/knowledge-base.tsx`
- [x] Replace import: change `from '@/hooks/useVideos'` to `from '@/contexts/VideosContext'`
- [x] No other changes needed - component displays videos in list

**Validation Criteria**:
- [x] Knowledge base renders correctly
- [x] Video list shows videos
- [x] No console errors

**Validation Criteria for Task 3**:
- [x] All three components successfully use VideosContext
- [x] No TypeScript errors
- [x] Import paths updated correctly

---

### Task 4: Remove or Deprecate Old useVideos Hook
**Goal**: Clean up the old hook file

#### Subtask 4.1: Decide on approach
- [x] Option A (Recommended): Delete `src/hooks/useVideos.ts` entirely
- [ ] Option B (Temporary compatibility): Keep as thin re-export that throws deprecation warning

#### Subtask 4.2: Execute chosen approach
- [x] If Option A: Delete the file completely
- [ ] If Option B: Replace content with `export { useVideos } from '@/contexts/VideosContext'` and add deprecation comment

**Validation Criteria**:
- [x] Build succeeds without missing imports
- [x] No references to old hook implementation
- [x] All imports resolve to new location

---

### Task 5: Add Tests for VideosContext
**Goal**: Create comprehensive tests for the new context

#### Subtask 5.1: Create test file structure
- [ ] Create `tests/unit/contexts/VideosContext.test.tsx`
- [ ] Import testing utilities: `render`, `screen`, `waitFor` from `@testing-library/react`
- [ ] Import `VideosProvider`, `useVideos` from context
- [ ] Import `supabase` client for mocking

#### Subtask 5.2: Set up mocks
- [ ] Mock Supabase client: `jest.mock('@/lib/supabase/client')`
- [ ] Mock `supabase.from().select()`, `supabase.channel()`, `supabase.removeChannel`
- [ ] Mock auth: create mock `useAuth` hook
- [ ] Get references to all mocked functions

#### Subtask 5.3: Write provider render tests
- [ ] Test: Provider renders children correctly
- [ ] Test: Throws error when useVideos called outside provider
- [ ] Test: Initial state shows loading = true

**Validation Criteria**:
- [ ] Tests pass for basic provider functionality
- [ ] Error handling works correctly

#### Subtask 5.4: Write data fetching tests
- [ ] Test: Fetch calls Supabase with correct query
- [ ] Test: Sets videos state when fetch succeeds
- [ ] Test: Sets error state when fetch fails
- [ ] Test: Sets loading false after fetch completes

**Validation Criteria**:
- [ ] All fetch scenarios covered
- [ ] Error states handled correctly

#### Subtask 5.5: Write subscription tests
- [ ] Test: Creates subscription when user logs in
- [ ] Test: Only creates one subscription (prevents duplicates)
- [ ] Test: INSERT event adds video to array
- [ ] Test: UPDATE event modifies existing video
- [ ] Test: DELETE event removes video from array

**Validation Criteria**:
- [ ] All realtime event types tested
- [ ] Subscription singleton enforced
- [ ] State updates correctly

#### Subtask 5.6: Write cleanup tests
- [ ] Test: Unsubscribes on component unmount
- [ ] Test: Clears videos when user logs out
- [ ] Test: Calls removeChannel on cleanup

**Validation Criteria**:
- [ ] No memory leaks
- [ ] Cleanup happens on all exit paths

**Validation Criteria for Task 5**:
- [ ] All tests pass: `pnpm test tests/unit/contexts/VideosContext.test.tsx`
- [ ] Coverage above 80% for VideosContext.tsx
- [ ] Tests follow same pattern as AuthContext.test.tsx

---

### Task 6: Integration Testing
**Goal**: Verify the entire system works with new context

#### Subtask 6.1: Test with all consumers
- [ ] Start dev server: `pnpm dev`
- [ ] Log in as test user
- [ ] Verify Knowledge Base shows videos
- [ ] Verify Chat Area VideoScopeBar works
- [ ] Verify VideoPreview works

#### Subtask 6.2: Test realtime deletion
- [ ] Add a test video to knowledge base
- [ ] Open browser console
- [ ] Verify only ONE "Successfully subscribed" log appears (not three)
- [ ] Delete the test video
- [ ] Verify video disappears immediately without page reload
- [ ] Verify no "Subscription closed" warnings appear
- [ ] Check Network tab: should show only 1 WebSocket connection

#### Subtask 6.3: Test multiple component access
- [ ] Have videos visible in knowledge base
- [ ] Use them in chat area with VideoScopeBar
- [ ] Open video preview from citation
- [ ] Verify all three components show same videos (synced state)

#### Subtask 6.4: Test subscription lifecycle
- [ ] Open browser console
- [ ] Log in - verify "Successfully subscribed" appears once
- [ ] Navigate through app - no additional subscriptions
- [ ] Log out - verify subscription closes cleanly
- [ ] No warnings in console

**Validation Criteria for Task 6**:
- [ ] Only 1 subscription exists (check console logs)
- [ ] Real-time deletion works
- [ ] No "Subscription closed" warnings during normal use
- [ ] All three components access same data
- [ ] Manual testing covers all user flows

---

### Task 7: Performance Validation
**Goal**: Verify improvements in performance and resource usage

#### Subtask 7.1: Measure WebSocket connections
- [ ] Open Chrome DevTools > Network tab > WS filter
- [ ] Refresh page and log in
- [ ] Count WebSocket connections - should be only 1-2 (auth + videos)
- [ ] Before fix: should have seen 4 connections (auth + 3 video subscriptions)

#### Subtask 7.2: Measure database queries
- [ ] Open Supabase dashboard > Logs
- [ ] Monitor query count during initial load
- [ ] Should only see 1 SELECT query for videos (not 3)
- [ ] Real-time events should trigger once (not 3 times)

#### Subtask 7.3: Memory leak check
- [ ] Use React DevTools Profiler
- [ ] Record during mount/unmount cycles
- [ ] Verify VideosContext doesn't cause memory leaks
- [ ] Subscription should cleanup properly

**Validation Criteria for Task 7**:
- [ ] WebSocket connections reduced by 66% (4 → 1-2)
- [ ] Database queries reduced by 66% (3 → 1)
- [ ] No memory leaks in React DevTools
- [ ] Performance metrics improved

---

## ✅ Final Acceptance Criteria

**All tasks complete when**:
1. [x] VideosContext created and follows existing patterns
2. [x] Integrated into app providers
3. [x] All three components updated to use context
4. [x] Old hook removed or deprecated
5. [ ] Tests written and passing (coverage > 80%)
6. [ ] Integration tests pass
7. [ ] Only ONE Supabase subscription exists
8. [ ] Real-time video deletion works immediately
9. [ ] No "Subscription closed" warnings in console
10. [ ] Performance improvements validated
11. [ ] No regression in existing functionality

**Success Metrics**:
- Console warnings eliminated
- Network connections reduced by 66%
- Real-time updates work flawlessly
- All tests passing
- No breaking changes

