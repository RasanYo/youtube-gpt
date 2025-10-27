# Implementation Plan: Server-Side Command Prompt Enhancement

## 🧠 Context about Project

YouTube-GPT is a full-stack AI-powered YouTube search application built with Next.js that enables users to search across their YouTube video knowledge base. Users can ingest individual videos or entire channels, then ask questions or request summaries that are grounded with citations and timestamps. The system uses Supabase for database and auth, Inngest for background jobs, ZeroEntropy for vector embeddings, and Claude for AI responses. The application features a ChatGPT-style three-column interface with conversation history, chat functionality, and a knowledge base explorer. The platform is in active development with core RAG functionality implemented and serves content creators and researchers who need to efficiently extract information from video libraries.

## 🏗️ Context about Feature

The current implementation enhances user prompts with command templates (like "Summarize" or "Create Post") on the client side, which causes the complete prompt template to be displayed in the UI. The system uses the Vercel AI SDK with `useChat` hook for message management, `DefaultChatTransport` for API communication, and a chat API route that processes messages with Claude 3 via streamText. Messages are persisted to Supabase and loaded via `getMessagesByConversationId`. The enhancement logic currently lives in `getEnhancedPrompt` utility function. We need to move prompt enhancement to the server-side API route so that the UI displays only the user's original input while the AI still receives the enhanced prompt. This requires extending the ChatRequest type to include an optional commandId field.

## 🎯 Feature Vision & Flow

When users select a command chip (Summarize or Create Post) and submit a message, the system should display only their original input in the chat UI while the AI receives the template-enhanced prompt. The flow: User selects command → types input → submits → client sends original input + command ID to API → API enhances the prompt server-side using the command template → AI processes enhanced prompt → UI shows original input → response appears normally with citations. This ensures clean UX without exposing prompt engineering while maintaining the exact same AI behavior. Users reloading the conversation will see their original input since it's what's persisted in the database.

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Update Type Definitions
[x] Extend ChatRequest interface to include optional commandId field
  - Edit `src/lib/zeroentropy/types.ts`
  - Add `commandId?: CommandId` field to the ChatRequest interface
  - Import CommandId type from '@/lib/chat-commands/types'
  - Update JSDoc comments to document the new field

**Validation Criteria:**
- Type compiles without errors
- ChatRequest interface includes commandId?: CommandId
- Import statement added for CommandId type

**Test:**
```typescript
// Add to types.ts as a test comment
// const testRequest: ChatRequest = { messages: [], userId: 'test', scope: { type: 'all' }, commandId: CommandId.SUMMARIZE }
```

---

### Task 2: Modify API Route to Handle Command Enhancement
[x] Update chat API route to enhance prompts server-side
  - Edit `src/app/api/chat/route.ts`
  - Extract commandId from ChatRequest at line 10
  - Add conditional logic after line 24 to enhance the last user message if commandId exists
  - Call getEnhancedPrompt function with the last message's text and commandId
  - Update the last message's content with the enhanced prompt before sending to AI
  - Add console logging to track command enhancement in server logs

**Validation Criteria:**
- API route extracts commandId from request
- Last user message is enhanced when commandId is present
- Enhanced prompt replaces the message content sent to AI
- Console logs show "🎯 Command enhanced: [commandId]" when enhancement occurs

**Test:**
- Send POST request with commandId and verify in network tab that request includes commandId
- Check server logs for enhancement confirmation
- Verify AI receives enhanced prompt by checking API logs

---

### Task 3: Update Client-Side Message Submission
[x] Modify authenticated-chat-area to send command metadata instead of enhanced prompts
  - Edit `src/components/chat/authenticated-chat-area.tsx`
  - Modify onSubmit function (lines 125-143) to send original input, not enhanced prompt
  - Remove call to getEnhancedPrompt on line 129
  - Update sendMessage call on line 138 to include commandId in request body
  - Change body from `{ scope: ... }` to `{ scope: ..., commandId: selectedCommand }`
  - Remove console.log statements related to enhanced prompts (lines 132-135)
  - Keep saveUserMessage(input) unchanged to preserve original input

**Validation Criteria:**
- Client sends original user input to API (not enhanced prompt)
- Request body includes commandId field when command is selected
- User input is still saved to database correctly
- No TypeScript errors

**Test:**
- Open browser dev tools Network tab
- Select "Summarize" command, type "test", submit
- Verify request payload contains `commandId: 'summarize'`
- Verify request payload text contains only "test" (not the full template)
- Check database to confirm "test" was saved

---

### Task 4: Ensure Server-Side Prompt Enhancement Logic
[x] Move getEnhancedPrompt utility to be callable from API route
  - Edit `src/lib/chat-commands/utils.ts` - no changes needed, already exported
  - Edit `src/app/api/chat/route.ts` to import getEnhancedPrompt from '@/lib/chat-commands/utils'
  - Import CommandId type in API route
  - Add logic to check if commandId exists and enhance the last message
  - Implement the enhancement between line 27 (after extracting userRequest) and line 28 (before logging)

**Validation Criteria:**
- API route imports getEnhancedPrompt and CommandId
- Conditional logic checks for commandId presence
- Last message content is modified in-place when commandId exists
- Enhancement happens before messages are sent to streamText

**Test:**
- Temporarily add console.log to show original message text vs enhanced text
- Send test request with commandId and verify enhancement in logs
- Verify that messages array passed to streamText contains enhanced prompt

---

### Task 5: Update Type Safety and Error Handling
[x] Add runtime validation for commandId in API route
  - Edit `src/app/api/chat/route.ts`
  - Add validation to ensure commandId is a valid CommandId enum value if present
  - Add error handling for unknown commandIds
  - Update TypeScript types to handle optional commandId throughout the flow

**Validation Criteria:**
- Invalid commandId values are rejected with 400 error
- Unknown commandIds log warnings and are ignored
- TypeScript types are properly updated to handle optional commandId

**Test:**
- Send request with invalid commandId (e.g., "unknown-command")
- Verify 400 error response with descriptive message
- Send request with valid commandId and verify it works normally

---

### Task 6: End-to-End Testing and Verification
[x] Test complete flow with both commands
  - Test Summarize command: Select command, type "explain pricing strategies", submit, verify UI shows only user input
  - Test Create Post command: Select command, type "write about Amazon principles", submit, verify UI shows only user input
  - Verify AI responses match previous behavior with enhanced prompts
  - Test reloading conversation and confirm saved messages show original input
  - Test without command: Submit normal message, verify it works as before

**Validation Criteria:**
- UI displays only user input (not prompt templates) when commands are used
- AI responses are properly formatted according to command templates
- Conversations can be reloaded and show original user inputs
- Non-command messages work exactly as before
- No console errors or warnings

**Test Checklist:**
- [ ] Select "Summarize" command, submit message, verify UI shows only user input
- [ ] Verify AI response follows summarize template format
- [ ] Reload page and verify user input is preserved correctly
- [ ] Select "Create Post" command, submit message, verify UI shows only user input
- [ ] Verify AI response follows LinkedIn post format
- [ ] Submit message without command, verify normal behavior
- [ ] Check browser console for any errors
- [ ] Check server logs for proper command enhancement logs

---

### Task 7: Remove Client-Side Enhancement Code
[x] Clean up unused client-side enhancement logic
  - Edit `src/components/chat/authenticated-chat-area.tsx`
  - Remove import of getEnhancedPrompt (line 19) since it's no longer used client-side
  - Keep CommandId import as it's still needed for the command state
  - Remove the unused getEnhancedPrompt import

**Validation Criteria:**
- No unused imports in authenticated-chat-area.tsx
- getEnhancedPrompt is not called anywhere in client code
- TypeScript compiles without warnings

**Test:**
- Run TypeScript type checking: `pnpm tsc --noEmit`
- Verify no unused import warnings
- Verify application compiles and runs correctly

---

## Implementation Summary

This implementation moves the prompt enhancement logic from the client-side to the server-side API route. The key changes are:

1. **Type Updates**: Extend ChatRequest to include optional commandId
2. **API Route**: Enhance prompts server-side based on commandId
3. **Client Changes**: Send original input + commandId instead of pre-enhanced prompts
4. **Testing**: Verify end-to-end functionality with both commands

The result is that users only see their original input in the UI, but the AI receives the properly enhanced prompts, maintaining the same behavior while improving UX.

