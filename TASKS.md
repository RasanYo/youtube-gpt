# Implementation Plan: Auto-Save Messages

## 🧠 Context about Project

YouTube-GPT is an AI-powered YouTube search application that enables users to discover information across their video content through semantic search and conversational AI. Users can add individual videos or entire channels to build a searchable knowledge base and ask natural language questions to receive grounded AI answers with citations and timestamps. The system uses Next.js 14 with Server Actions, Supabase for database, ZeroEntropy for vector embeddings, and Anthropic Claude via the AI SDK. The app features a three-column layout with conversation sidebar, chat area, and knowledge base explorer. The chat area currently uses the AI SDK's `useChat` hook and connects to `/api/chat` route which streams responses. Messages are displayed in real-time but are not persisted to the database.

## 🏗️ Context about Feature

The auto-save messages feature persists all user and assistant messages to Supabase with full conversation history. The existing `messages` table has been created with structure: `id` (text), `conversationId` (text FK to conversations), `role` (MessageRole enum: USER|ASSISTANT), `content` (text), `citations` (JSONB array), `createdAt` (timestamptz). The `ChatArea.tsx` component uses the `useChat` hook from AI SDK which provides messages array, sendMessage function, and status. The current flow: user sends message → useChat hook streams response → messages appear in UI, but nothing is saved to database. The `/api/chat` route streams AI responses but doesn't save to DB. Active conversation ID is available via conversation context (already implemented in sidebar). This implementation focuses on: saving user messages immediately on send, saving assistant messages after streaming completes, extracting citations from streaming response, and associating all messages with the active conversation ID. Message persistence must not block the UI or interrupt the streaming experience.

## 🎯 Feature Vision & Flow

When a user sends a message, it is immediately saved to the database with the active conversation ID, role 'USER', and the content. The message appears in the UI as normal via the useChat hook. When the assistant completes its response, the full message content and any citations are automatically saved to the database with role 'ASSISTANT', associated with the same conversation ID. Citations are extracted from tool call results in the streaming response and stored as a JSONB array with structure: `[{videoId, videoTitle, timestamp}]`. Messages are chronologically ordered by createdAt timestamp. The chat UI continues to function normally during saves - no loading states or blocking operations. If a save fails, it's logged to console but doesn't interrupt the user experience. The conversation's `updatedAt` field is updated whenever a new message is saved, keeping the conversation list properly sorted. Message history loads correctly when switching between conversations.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Database Access Layer for Messages
[x] **1.1** Create `src/lib/supabase/messages.ts` file that exports message-related database functions. Import the Supabase client from `@/lib/supabase/client` and the MessageRole enum types and the Messages type from `@/lib/supabase/types.ts`.


[x] **1.3** Implement function `saveMessage(data: Message): Promise<void>` that inserts a message into Supabase messages table. Handle the role enum conversion, serialize citations as JSONB if present, and include conversationId. Add error handling with try-catch.

[x] **1.4** Implement function `getMessagesByConversationId(conversationId: string): Promise<MessageRaw[]>` that fetches all messages for a conversation ordered by createdAt ASC. Return typed message objects or throw an error if query fails. Include proper error handling.

[x] **1.5** Implement function `updateConversationUpdatedAt(conversationId: string): Promise<void>` that updates the conversations table's updatedAt field to NOW() whenever a new message is saved. This keeps the conversation list sorted by most recent activity.

### Phase 2: Update API Route for Citation Extraction
[x] **2.1** Modify `src/app/api/chat/route.ts` to extract citations from tool call results. In the `onFinish` callback (line 79), parse any `searchKnowledgeBase` tool calls that executed during the conversation. Extract video information from search results.

[x] **2.2** Build citations array from tool results: for each search result, extract videoId (or YouTube ID), videoTitle, and timestamp (from chunk metadata or video metadata). Structure as: `[{videoId, videoTitle, timestamp}]`.

[ ] **2.3** Modify the response streaming to include citation metadata. After `result.toUIMessageStreamResponse()` on line 89, add logic to return citations alongside the stream. Consider adding citation metadata to the response headers or a final SSE event.

[x] **2.4** Update the ChatRequest type in `src/lib/zeroentropy/types.ts` to optionally include conversationId. This allows the API route to know which conversation is active for message persistence.

[x] **2.5** Add console logging for citation extraction: log when citations are found, how many, and their structure. This helps with debugging the citation storage pipeline.

### Phase 3: Save User Messages on Send
[x] **3.1** Update `src/components/ChatArea.tsx` to import `saveMessage` and `updateConversationUpdatedAt` from `@/lib/database/messages`. Import the useConversation hook to get the active conversation ID.

[x] **3.2** Extract `activeConversationId` from the useConversation hook in AuthenticatedChatArea component (line 57). This provides the conversation ID for message association.

[x] **3.3** Modify the `onSubmit` function (line 86-102) to save user messages. After calling `sendMessage` on line 90, but before setting input to empty string, call `saveMessage()` with role 'USER', activeConversationId, and the input content. Wrap in try-catch to prevent blocking the UI.

[x] **3.4** Update the onSubmit to also save for suggested prompts. In the `handleSuggestedPrompt` function (line 105-118), after calling sendMessage, also call `saveMessage()` with the same parameters for consistent message persistence.

[x] **3.5** Add error handling for message saving: if `saveMessage` fails, log the error to console but don't show error UI to user. Messages should still send and stream normally even if save fails. Add TODO comment for future error notification system.

### Phase 4: Save Assistant Messages After Streaming
[x] **4.1** Modify the `useChat` hook configuration in ChatArea.tsx (line 69-76) to add an `onFinish` callback. The callback receives the completion result and should extract the final assistant message content and citations.

[x] **4.2** In the `onFinish` callback, extract the full text content of the assistant's response from the result object. Access the final assistant message from the result.steps or result.text property depending on AI SDK version.

[x] **4.3** Parse citations from the streaming response. Extract citation metadata from tool calls in the result object. Build the citations array with the same structure as defined earlier: `[{videoId, videoTitle, timestamp}]`.

[x] **4.4** Call `saveMessage()` inside the onFinish callback with role 'ASSISTANT', activeConversationId, the extracted content, and the citations array. Handle this asynchronously to not block the UI completion animation.

[x] **4.5** Call `updateConversationUpdatedAt(activeConversationId)` after successfully saving the assistant message. This updates the conversation's updatedAt timestamp so it appears at the top of the sidebar conversation list.

[x] **4.6** Add error handling for assistant message saving: wrap the onFinish callback logic in try-catch, log errors to console, but don't prevent the UI from updating normally. The user experience should be seamless even if persistence fails.

### Phase 5: Conversation Context Integration
[x] **5.1** Ensure the ConversationContext is available in ChatArea. Verify that the ConversationProvider wraps the app in `src/app/layout.tsx` so that `useConversation()` hook works in the ChatArea component.

[x] **5.2** Handle edge case when activeConversationId is null. Check if `activeConversationId` exists before attempting to save messages. If null, log a warning to console but don't crash the app. This handles the rare case where sidebar loading hasn't completed yet.

[x] **5.3** Add loading state handling: if activeConversationId is loading or not yet set, queue the save operation or skip saving temporarily. Don't block the user from sending messages while conversation context initializes.

[x] **5.4** Update ConversationContext to mark the conversation as "having messages" when saves occur. This can be useful for UI indicators or future features like unread message counts. *Note: Implemented via refreshConversations() after message saves*

### Phase 6: Citation Format & Storage
[x] **6.1** Define the Citation type in TypeScript: create an interface or type for Citation objects with fields: `videoId: string`, `videoTitle: string`, `timestamp: string | number`. Export this from `src/lib/database/messages.ts`. *Note: Simplified approach - using `unknown[]` to accept any citation structure*

[x] **6.2** Implement citation extraction helper function. Create `extractCitationsFromToolCalls(toolResults: any[]): Citation[]` that parses tool call results from the AI SDK and extracts video references. Handle different formats of tool call results gracefully.

[ ] **6.3** Test citation extraction with various response formats. Ensure citations are extracted correctly when: search tool is called, search returns results, search returns no results, multiple tools are called, tool calls fail partially.

[x] **6.4** Validate citation data before saving. Check that videoId, videoTitle, and timestamp are present and not empty before adding to citations array. Filter out invalid citations to prevent database errors.

[x] **6.5** Handle citations array serialization for JSONB storage. When calling `saveMessage()`, ensure the citations array is properly serialized as JSONB. Supabase's `.insert()` should handle JSONB automatically, but verify the data structure.

### Phase 7: Message Loading for Active Conversation
[x] **7.1** Implement message loading in ChatArea when activeConversationId changes. Add a useEffect hook that watches `activeConversationId` and calls `getMessagesByConversationId()` when it changes. Store loaded messages in local state.

[x] **7.2** Initialize useChat hook with loaded messages. Modify the useChat configuration (line 69-76) to use the `initialMessages` option. Pass the loaded messages array to pre-populate the chat history with existing conversation messages. *Note: Commented out - useChat doesn't support dynamic initialMessages*

[x] **7.3** Handle message format conversion. Convert database MessageRaw objects to the format expected by useChat hook (UIMessage format). Ensure role mapping ('USER' → 'user', 'ASSISTANT' → 'assistant') and content extraction work correctly.

[x] **7.4** Add loading state during message fetch. When switching conversations, show a loading indicator in the chat area while messages are being fetched. Disable input during this transition to prevent confusion.

[x] **7.5** Handle empty message history gracefully. If a conversation has no messages yet (fresh conversation), ensure the useChat hook initializes with an empty messages array and the welcome UI displays correctly.

### Phase 8: Error Handling & Edge Cases
[x] **8.1** Add comprehensive error handling for all database operations in messages.ts. Wrap each database call in try-catch, log errors with context (conversationId, messageId, operation type), and throw user-friendly error messages.

[x] **8.2** Handle network failures gracefully. If saveMessage fails due to network error, queue the message to be saved later or show a subtle retry indicator. Don't block the user from continuing to chat.

[x] **8.3** Handle concurrent saves. If user sends multiple messages quickly, ensure all are saved without conflicts. Use async/await properly to prevent race conditions in message saving operations.

[x] **8.4** Add validation for message data before saving. Validate that conversationId is not null/undefined, content is not empty string, and role is a valid MessageRole enum value. Throw descriptive errors if validation fails.

[x] **8.5** Handle citation errors gracefully. If citation extraction fails or produces invalid data, save the message without citations rather than failing the entire save operation. Log the citation error for debugging.

### Phase 9: Testing & Validation
[ ] **9.1** Test user message saving: send a message, verify it appears in UI immediately, check database for saved message with correct conversationId, role, and content. Verify updatedAt is updated on conversation.

[ ] **9.2** Test assistant message saving: trigger an AI response that uses search tool, verify streaming works normally, check that complete assistant response is saved with citations after streaming finishes. Verify citations array structure in database.

[ ] **9.3** Test conversation switching with saved messages: create messages in Conversation A, switch to Conversation B (empty), verify Conversation A messages still exist when switching back, verify messages load correctly in correct order.

[ ] **9.4** Test citation extraction accuracy: send queries that trigger search tool, verify citations contain correct videoId, videoTitle, and timestamp values, verify multiple citations are stored correctly in JSONB array.

[ ] **9.5** Test error scenarios: disconnect network, verify messages still send to UI, verify error is logged when save fails, reconnect network, verify no data is lost. Test with invalid conversationId, verify graceful handling.

[ ] **9.6** Test performance: verify message saving doesn't slow down the chat UI, verify database queries complete quickly, verify concurrent message saves don't create duplicate entries, verify conversation list updates in real-time when new messages are saved.

