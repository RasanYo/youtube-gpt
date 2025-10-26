# Implementation Plan: Conversation Sidebar

## 🧠 Context about Project

YouTube-GPT is an AI-powered YouTube search application that enables users to discover information across their video content through semantic search and conversational AI. Users can add individual videos or entire channels to build a searchable knowledge base and ask natural language questions to receive grounded AI answers with citations and timestamps. The system is built on Next.js 14 with Server Actions, Supabase for authentication and database, ZeroEntropy for vector embeddings, and Anthropic Claude via the AI SDK. The app features a three-column layout: conversation sidebar (left), chat area (center), and knowledge base explorer (right). The conversation sidebar currently displays a static placeholder with a hardcoded empty conversations array.

## 🏗️ Context about Feature

The conversation sidebar enables users to create, list, and switch between multiple conversations. The existing `ConversationSidebar.tsx` component is a placeholder showing static UI with no data fetching or functionality. The `conversations` table already exists in Supabase with columns: `id` (text), `userId` (text), `title` (text), `createdAt` (timestamptz), `updatedAt` (timestamptz). The Supabase client is available via `src/lib/supabase/client.ts` singleton. User authentication is provided via `AuthContext` which exports `useAuth()` hook with user information. The "+" button currently exists but has no click handler. This implementation focuses solely on the sidebar functionality: fetching conversations from Supabase, displaying them sorted by most recent, handling conversation switching via click, and creating new conversations via the "+" button. Auto-creating a first conversation on initial load and loading the most recent conversation are also part of this scope.

## 🎯 Feature Vision & Flow

When a user first loads the app, the sidebar automatically fetches all their conversations from Supabase. If they have no conversations, a new conversation titled "New Chat" is automatically created and becomes the active conversation. The conversation list displays sorted by most recent update time (updatedAt DESC), showing the conversation title and relative time (e.g., "2 hours ago"). The currently active conversation is visually highlighted. Clicking any conversation button loads that conversation and updates the active state. The "+" button creates a new conversation titled "New Chat", adds it to the list, and automatically switches to it. Empty state UI shows a friendly message with icon when no conversations exist. When conversations exist, they appear in a scrollable list. The sidebar maintains its scroll position independently of the main chat area. On subsequent loads, the most recent conversation is automatically loaded.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Database Access Layer
[ ] **1.1** Create `src/lib/supabase/conversations.ts` file that exports conversation-related database functions. Import the Supabase client from `@/lib/supabase/client` and relevant TypeScript types from `@/lib/supabase/types.ts` for type safety.

[ ] **1.2** Implement function `getConversationsByUserId(userId: string): Promise<ConversationRaw[]>` that queries the Supabase `conversations` table filtered by `userId`, ordered by `updatedAt DESC`. Return typed conversation objects or throw an error if the query fails.

[ ] **1.3** Implement function `createConversation(userId: string, title?: string): Promise<ConversationRaw>` that inserts a new conversation record using Supabase's `.insert()`. Use the existing database default for ID generation. Return the created conversation object. Handle the optional title parameter with default "New Chat" if not provided.

[ ] **1.4** Implement function `updateConversationTitle(conversationId: string, title: string): Promise<void>` for future use (users renaming conversations). Use Supabase's `.update()` method filtered by conversation ID. Add error handling with descriptive messages.

### Phase 2: Conversation Context Provider
[ ] **2.1** Create `src/contexts/ConversationContext.tsx` file with a React context that manages conversation state. Define interface `ConversationContextType` with properties: `conversations` (array), `activeConversationId` (string | null), `setActiveConversationId` (function), `isLoading` (boolean), and CRUD functions.

[ ] **2.2** Implement `ConversationProvider` component that wraps children and provides the context. Use `useState` to track conversations array and activeConversationId. Import and use `useAuth()` from AuthContext to get the current user.

[ ] **2.3** Add function `loadConversations()` to the context that calls `getConversationsByUserId` with the current user's ID, updates the conversations state, and handles loading/error states. Expose this function in the context value.

[ ] **2.4** Add function `createNewConversation()` that calls `createConversation` with user ID, updates the conversations array state with the new conversation, and automatically sets it as the active conversation by calling `setActiveConversationId`. Expose this function in context.

### Phase 3: Auto-Load Initial Conversation
[ ] **3.1** Add a `useEffect` hook in `ConversationContext` that runs when the component mounts and the user is authenticated. Call `loadConversations()` to fetch all conversations for the current user from Supabase.

[ ] **3.2** After loading conversations, check if the conversations array is empty. If empty, automatically call `createNewConversation()` to create the first conversation and set it as active. This handles the "first use" scenario.

[ ] **3.3** If conversations exist (array length > 0), automatically set the most recent conversation (first item in the array) as the active conversation by calling `setActiveConversationId` with its ID. This loads the most recent conversation on app startup.

[ ] **3.4** Add loading state management: create `isLoadingConversations` boolean state, set it to `true` before loading, and `false` after loading completes. Expose this in the context for UI components to show loading indicators.

### Phase 4: Sidebar UI Integration
[ ] **4.1** Update `ConversationSidebar.tsx` to import and use `useConversation()` hook from the new context. Extract `conversations`, `activeConversationId`, `createNewConversation`, `isLoading`, and `loadConversations` from the hook.

[ ] **4.2** Add a `useEffect` that calls `loadConversations()` when the component mounts to trigger conversation data fetching. This ensures fresh data is loaded when the sidebar renders.

[ ] **4.3** Replace the hardcoded empty conversations array (`const conversations: Array<...> = []`) with the real data from the context: `const { conversations } = useConversation()`. Remove the local empty array declaration.

[ ] **4.4** Update the conversation list rendering to map over the real `conversations` from context instead of the hardcoded empty array. Ensure the map uses conversation object properties (`conv.id`, `conv.title`) matching the database schema.

[ ] **4.5** Implement click handlers for each conversation button. When a conversation is clicked, call `setActiveConversationId(conv.id)` from the context to switch to that conversation. Add this to the Button's `onClick` prop in the map function.

[ ] **4.6** Add visual indication for the active conversation. Conditionally apply active/selected styling to the conversation button when `conv.id === activeConversationId`. Use Tailwind classes like `bg-accent` or border styling to highlight the selected conversation.

[ ] **4.7** Implement the "+" button click handler. Replace the empty Button component (line 24-31) with an onClick handler that calls `createNewConversation()` from the context. This creates a new conversation and automatically switches to it.

[ ] **4.8** Handle loading states in the sidebar UI. When `isLoading` is true, show a loading skeleton or spinner in the ScrollArea instead of the empty state or conversation list. This provides user feedback during data fetching.

[ ] **4.9** Handle the empty state properly: only show the empty state UI (MessageSquare icon and text) when `!isLoading && conversations.length === 0`. Otherwise, show the conversation list. This prevents empty state from flashing during loading.

### Phase 5: Date Formatting & UI Polish
[ ] **5.1** Install `date-fns` package for date formatting: `pnpm add date-fns`. This provides the `formatDistanceToNow` utility function for relative time display.

[ ] **5.2** Import `formatDistanceToNow` from `date-fns` in `ConversationSidebar.tsx`. Update the date display in each conversation item (currently showing `{conv.date}` on line 61) to use `formatDistanceToNow(new Date(conv.updatedAt))` to show relative time like "2 hours ago", "Yesterday".

[ ] **5.3** Add proper null/undefined handling for the date display. Check if `conv.updatedAt` exists before calling `formatDistanceToNow`. Provide a fallback value like "Unknown" if the date is missing.

[ ] **5.4** Implement conversation title truncation for long titles. Add `truncate` class to the title div (line 57) and set max-width or use CSS truncation to limit display to reasonable length (e.g., 40 characters). Show full title on hover using a tooltip component.

[ ] **5.5** Ensure conversation items have hover states. Add hover styling to the Button component (line 49-65) using Tailwind's `hover:bg-accent` or similar to provide visual feedback when hovering over conversations.

### Phase 6: Error Handling & Edge Cases
[ ] **6.1** Add try-catch blocks around all database operations in `src/lib/database/conversations.ts`. For `getConversationsByUserId`, catch errors and log to console, then throw a new Error with a user-friendly message. Handle Supabase query failures gracefully.

[ ] **6.2** Add error handling for `createNewConversation` in the context. Wrap the function call in a try-catch block in `ConversationContext.tsx`. If creation fails, log the error and show a toast notification to the user (use a toast library or browser alert for now).

[ ] **6.3** Handle the case where user is null in `ConversationContext`. Add a guard in the `useEffect` that only runs when `user` exists. If user is null, don't attempt to load conversations and show an appropriate state.

[ ] **6.4** Prevent duplicate conversation creation. Add a loading/creating state that prevents multiple "+" button clicks while a conversation is being created. Disable the button during creation to prevent race conditions.

[ ] **6.5** Handle network errors gracefully. If Supabase queries fail due to network issues, show a retry button or error message in the sidebar. Don't crash the entire app if conversation loading fails.

### Phase 7: Type Safety & Testing
[ ] **7.1** Ensure all TypeScript types are properly defined. Check that `ConversationRaw` type is imported and used correctly in `src/lib/database/conversations.ts`. Verify that conversation objects match the database schema structure (id, userId, title, createdAt, updatedAt).

[ ] **7.2** Add PropTypes or TypeScript interfaces for all props in components. Ensure `ConversationSidebar` has proper typing for any props it receives. Verify that the context hook return type matches the interface definition.

[ ] **7.3** Test the full flow manually: create first conversation automatically on page load, verify it appears in sidebar, click "+" to create second conversation, verify both appear in list, click each conversation to verify switching works, and check that conversation list updates after creating new conversations.

[ ] **7.4** Test conversation list sorting: create multiple conversations with delays between them, verify they always appear in most-recent-first order, and verify that sending a message updates the conversation's `updatedAt` timestamp and causes it to move to the top of the list.

[ ] **7.5** Test empty state transitions: start with a new user who has no conversations, verify auto-creation happens, verify empty state doesn't flicker, verify new conversation appears smoothly, and verify the conversation becomes active.
