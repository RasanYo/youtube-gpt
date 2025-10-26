---
# Tool Usage Notifications - Implementation Plan
## Issue #36 Phase 2: Real-time Tool Usage Display
---

## 🧠 Context about Project

YouTube GPT is an AI-powered SaaS that transforms YouTube videos into a searchable knowledge base. Users add video or channel links, and the system extracts transcripts, generates embeddings, and enables semantic search via AI chat. The app uses Next.js 16 App Router, Supabase for auth/database, ZeroEntropy for vector search, Inngest for background jobs, and Claude AI for chat. Currently, the ingestion pipeline is partially implemented - videos are added but transcript extraction is pending. The chat interface supports tool calls (RAG search) but lacks visual feedback during tool execution.

## 🏗️ Context about Feature

The chat system uses AI SDK's streaming with `useChat` hook. When Claude needs to search videos, it emits `tool-call` parts in UIMessages. Currently, these are logged to console but there's no UI feedback. The existing `ToolUsageNotification` component (ChatArea.tsx lines 232-241) is rendered but never activated because `toolUsage` state management isn't connected to stream events. The `/api/chat` route handles tool execution server-side, and results stream back as `tool-result` parts. We need to detect `tool-call` parts in streaming messages and show/hide the notification accordingly.

## 🎯 Feature Vision & Flow

User asks a question → AI determines it needs to search videos → Tool call emitted in stream → Frontend detects `tool-call` part → Shows animated notification "🔍 Searching your videos..." → Tool executes on backend → Results stream back → Notification hides → AI generates final response with citations. The notification appears above the streaming AI message bubble, similar to ChatGPT's "Searching web..." indicator. It should be subtle, non-intrusive, and show which tool is running.

---

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Add tool detection logic to ChatArea component
- [ ] In `src/components/ChatArea.tsx` (AuthenticatedChatArea), add helper function `getActiveToolCalls()` around line 95
- [ ] Function should filter messages for `role === 'assistant' && status === 'streaming'`
- [ ] Extract all `parts` with `type === 'tool-call'` from filtered messages
- [ ] Return array of active tool calls with `toolName` extracted
- [ ] Add state variable `const activeToolCalls = getActiveToolCalls()` after `useChat` hook
- [ ] Add derived state `const hasActiveTool = activeToolCalls.length > 0 && status === 'streaming'`

### Task 2: Wire ToolUsageNotification to stream events
- [ ] Remove unused `toolUsage` state declaration (lines 80-84)
- [ ] Update notification rendering logic (lines 232-241) to use new detection method
- [ ] Replace condition `isLoading && toolUsage.isActive` with `hasActiveTool && isLastMessage`
- [ ] Add variable to check if current message is the last streaming assistant message
- [ ] Pass correct props: `toolName={activeToolCalls[0]?.toolName || 'processing'}` and `status="active"`
- [ ] Test that notification shows during search execution and hides when tool result arrives

### Task 3: Enhance notification display
- [ ] Verify `ToolUsageNotification` component handles different tool names correctly
- [ ] Add case for 'searchKnowledgeBase' → display "Searching your videos..." (already exists line 42-43)
- [ ] Ensure smooth fade-in/fade-out transitions when notification appears/disappears
- [ ] Check that animation doesn't overlap with message content
- [ ] Position notification above message bubble (current layout at line 233 is correct)

### Task 4: Test and verify integration
- [ ] Send a test message that triggers search (e.g., "What videos talk about React hooks?")
- [ ] Verify notification appears with "🔍 Searching your videos..." text
- [ ] Verify spinner animation runs smoothly
- [ ] Confirm notification disappears when AI starts typing final response
- [ ] Test with multiple concurrent tool calls if applicable
- [ ] Check console for any errors or warnings

### Task 5: Optional enhancement - Add video scope context to notification
- [ ] If `selectedVideos.size > 0`, customize text to "Searching in X selected videos..."
- [ ] Pass scope info to notification component
- [ ] Update `ToolUsageNotification` to accept and display scope context
- [ ] Verify different messages for "all videos" vs "selected videos"

---

## 🎯 Success Criteria

- ✅ Notification appears when AI calls the search tool
- ✅ Animation is smooth and non-intrusive
- ✅ Notification shows correct tool name ("searchKnowledgeBase")
- ✅ Notification disappears after tool completes
- ✅ No console errors or state management issues
- ✅ Works with both "all videos" and "selected videos" scope
