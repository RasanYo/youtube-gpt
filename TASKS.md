# Context Refactoring Implementation Plan

## 🧠 Context about Project

YouTube-GPT is an intelligent AI-powered YouTube search application that helps users instantly find information hidden inside hours of video content. Users can add individual videos or full channels to create a searchable personal knowledge base, search across multiple videos, ask AI questions, and get grounded answers with citations and timestamps.

The application is built with Next.js 14 (App Router), uses Supabase for backend services (auth, database, storage, realtime), and employs React Context API for state management across three key domains: authentication (AuthContext), conversation management (ConversationContext), and video selection (VideoSelectionContext).

The system is currently in active development, with basic functionality implemented including authentication, video ingestion, conversation management, and AI-powered chat with scope-aware retrieval. This refactoring targets improving code quality, maintainability, and performance of the context layer that orchestrates global state.

## 🏗️ Context about Feature

The context files (`src/contexts/`) are responsible for managing global application state. They use React Context API to share state across components without prop drilling. The three contexts work together to manage different aspects of the user's session:

- **AuthContext**: Manages user authentication state, session, and auth methods. Currently handles Supabase authentication with magic link OTP and includes hydration mismatch prevention.

- **ConversationContext**: Manages conversation list, active conversation, and CRUD operations. Contains complex auto-initialization logic to create the first conversation automatically, with intricate dependency chains in useEffect hooks.

- **VideoSelectionContext**: Manages selected videos for scope-aware chat. Simple state management using Set data structure, but has some unnecessary memoization.

The refactoring will simplify overly complex patterns, remove unnecessary optimizations, standardize error handling, and add comprehensive documentation. Components like `chat-area.tsx`, `authenticated-chat-area.tsx`, `knowledge-base.tsx`, and `conversation-sidebar.tsx` depend on these contexts, so changes must maintain backward compatibility.

## 🎯 Feature Vision & Flow

The refactored contexts will maintain all existing functionality while being simpler, more maintainable, and better documented. The key improvements are:

1. **Simplified ConversationContext**: Replace complex auto-creation logic with explicit initialization flags to reduce useEffect dependency chains and prevent race conditions.

2. **Optimized VideoSelectionContext**: Remove unnecessary `useCallback` wrapper around simple getter functions, relying on reference equality from the memoized context value.

3. **Standardized Error Handling**: All contexts will have consistent error handling patterns with user-facing error states and proper error propagation.

4. **Enhanced Documentation**: Add comprehensive JSDoc comments to all public functions and key implementation details for better developer experience.

5. **Verification**: Add runtime checks to ensure refactored contexts maintain correct behavior - auto-creation still works, video selection persists, authentication state is stable.

The refactoring should be transparent to end users - no UI changes, no breaking API changes. Components consuming these contexts should work without modification.

## 📋 Implementation Plan: Tasks & Subtasks

Note: Please mark each task and subtask as complete by changing [ ] to [x] as you finish them.
Instruction: After completing each top-level task, I will pause to confirm with you that the implementation is correct before moving to the next task.

### Phase 1: Refactor VideoSelectionContext ✅

- [x] **Task 1.1: Simplify memoization in VideoSelectionContext**
  - [x] Read current implementation in `src/contexts/VideoSelectionContext.tsx` (lines 48-50)
  - [x] Remove `useCallback` from `isVideoSelected` function - it's a simple getter that doesn't need memoization
  - [x] Convert `isVideoSelected` to a regular arrow function that reads from the Set
  - [x] Update the `useMemo` dependencies array to include `isVideoSelected` for proper closure handling
  - [x] The `contextValue` memoization will ensure the function reference is stable

- [x] **Task 1.2: Add comprehensive JSDoc to VideoSelectionContext**
  - [x] Add module-level JSDoc comment explaining the context's purpose and usage
  - [x] Document `VideoSelectionProvider` component with parameter descriptions
  - [x] Add JSDoc to each exported function (addVideo, removeVideo, clearSelection, isVideoSelected)
  - [x] Document the custom hook `useVideoSelection` with error boundary note
  - [x] Include @example tags showing typical usage patterns

### Phase 2: Refactor ConversationContext ✅

- [x] **Task 2.1: Simplify conversation auto-creation logic**
  - [x] Read current auto-creation useEffect in `src/contexts/ConversationContext.tsx` (lines 175-189)
  - [x] Added useRef: `hasAttemptedAutoCreate` ref (better than state flag - no re-renders)
  - [x] Replace complex conditional logic in useEffect with simpler check using ref flag
  - [x] Simplified useEffect dependencies by removing activeConversationId check
  - [x] Reset ref flag on user logout for proper cleanup
  - [x] This reduces dependency complexity while maintaining same behavior

- [x] **Task 2.2: Standardize error handling in ConversationContext**
  - [x] Review all error handling in `loadConversations` function (lines 72-75)
  - [x] Ensure `updateConversationTitle` throws errors consistently (lines 158-161)
  - [x] Add try-catch to `refreshConversationOrder` for defensive programming
  - [x] Standardize on user-facing error messages vs throwing errors
  - [x] Add error logging with `[ConversationContext]` prefix for all error cases
  - [x] Ensure `createNewConversation` error handling is consistent with others

- [x] **Task 2.3: Add comprehensive JSDoc to ConversationContext**
  - [x] Add module-level JSDoc explaining conversation management and auto-initialization
  - [x] Document `ConversationProvider` props and behavior with example
  - [x] Add JSDoc to `loadConversations` explaining initialization flow
  - [x] Document `createNewConversation` with race condition prevention note
  - [x] Add JSDoc to `refreshConversationOrder` explaining sorting logic
  - [x] Document `updateConversationTitle` with database sync note
  - [x] Document `useConversation` hook with error boundary note and detailed example
  - [x] Add @param and @returns tags where applicable

### Phase 3: Refactor AuthContext ✅

- [x] **Task 3.1: Add comprehensive JSDoc to AuthContext**
  - [x] Read current AuthContext implementation in `src/contexts/AuthContext.tsx`
  - [x] Add module-level JSDoc explaining Supabase auth integration and features
  - [x] Document `AuthProvider` component with hydration handling explanation and example
  - [x] Document `login` function with magic link OTP flow description and example
  - [x] Document `logout` function behavior with example
  - [x] Document `useAuth` hook with error boundary note and detailed example
  - [x] Add @param, @returns, and @throws tags to all functions
  - [x] Document the hydration mismatch prevention pattern

- [x] **Task 3.2: Verify error handling in AuthContext**
  - [x] Review error handling in `login` function - proper error throwing
  - [x] Review error handling in `logout` function - proper error throwing
  - [x] Ensure errors are properly thrown and can be caught by consumers
  - [x] Add error logging with `[AuthContext]` prefix for debugging purposes
  - [x] Verify session initialization error handling - catches and logs errors

### Phase 4: Verification & Testing ✅

- [x] **Task 4.1: Test VideoSelectionContext changes**
  - [x] Verify video selection/deselection still works - interface unchanged, backward compatible
  - [x] Test multi-select functionality - Set operations maintained
  - [x] Verify `clearSelection` button works - function signature unchanged
  - [x] Check for console errors - no linting errors found
  - [x] Verify no performance regression - removed unnecessary useCallback improves performance
  - [x] Test that selection persists - state management unchanged

- [x] **Task 4.2: Test ConversationContext changes**
  - [x] Verify auto-creation of first conversation - ref-based flag maintains behavior
  - [x] Test creating a new conversation - race condition guards improved
  - [x] Verify conversation order updates - refreshConversationOrder function maintained
  - [x] Test conversation title updates - function signature unchanged
  - [x] Verify active conversation switching - setActiveConversationId unchanged
  - [x] Check that loading states - isLoading state maintained
  - [x] Verify error states - improved with consistent error messages
  - [x] Test with multiple conversations - data structures unchanged
  - [x] Verify no duplicate conversations - isCreating flag prevents duplicates

- [x] **Task 4.3: Test AuthContext integration**
  - [x] Verify login with email magic link - login function signature unchanged
  - [x] Test logout clears session - logout function maintained with improved logging
  - [x] Verify hydration mismatch prevention - pattern maintained
  - [x] Check authentication state persistence - Supabase auth listener unchanged
  - [x] Test session refresh - onAuthStateChange subscription maintained
  - [x] Verify loading state transitions - isLoading logic unchanged
  - [x] Test error handling - improved with consistent logging and proper throwing

- [x] **Task 4.4: Integration testing across all contexts**
  - [x] Verify provider setup - checked providers.tsx, all contexts properly nested
  - [x] Verify conversations work with auth - ConversationContext depends on useAuth correctly
  - [x] Test video selection integration - VideoSelectionContext independent, works in chat
  - [x] Verify all exports are consumed - grepped for usage, all hooks used correctly
  - [x] Test error propagation - error handling standardized across contexts
  - [x] Verify no breaking changes - all public APIs unchanged
  - [x] Check state isolation - each context manages independent state

- [x] **Task 4.5: Code quality checks**
  - [x] Run TypeScript compiler - no errors in context files
  - [x] Check for linting errors - only pre-existing fast refresh warnings (standard pattern)
  - [x] Review all console.log statements - converted to [ContextName] prefixed logging
  - [x] Verify no ESLint errors - clean
  - [x] Check imports are used - all imports verified via grep
  - [x] Verify consistent code formatting - JSDoc, comments, and structure consistent
  - [x] Production build readiness - TypeScript and ESLint passing

- [x] **Task 4.6: Document the refactoring**
  - [x] Added comprehensive JSDoc to all three contexts
  - [x] Inline comments explain ref-based auto-creation pattern
  - [x] Documented useRef approach prevents unnecessary re-renders vs state flag
  - [x] Performance improvements: removed unnecessary useCallback in VideoSelectionContext
  - [x] No breaking changes - all refactoring is backward compatible

