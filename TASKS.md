# Implementation Plan: Inline Video Citations in AI Chat

## 🧠 Context about Project

**YouTube-GPT** is an AI-powered full-stack SaaS application that enables users to search, analyze, and extract information from YouTube video content. The platform allows users to add individual videos or entire channels to build a searchable knowledge base. Users can ask AI-powered questions across their video library and receive grounded answers with citations and timestamps.

The application uses Next.js 14 with App Router, Supabase for authentication and database operations, and implements a ChatGPT-style three-column interface. The system is built with full-stack vertical slices, focusing on reliability, scalability, and design quality. The chat interface uses Vercel AI SDK (`@ai-sdk/react`) with Claude for natural language understanding and semantic search through ZeroEntropy for video content retrieval.

**Current Implementation**: The chat system displays video citations as a separate "Video References" block at the bottom of assistant messages. All search results are shown, regardless of whether they were actually used to support specific statements in the response. This creates visual clutter and reduces the contextual relevance of citations.

## 🏗️ Context about Feature

The current chat system uses the AI SDK's `streamText` function with tool calling capabilities. When the AI responds, it:
1. Calls the `searchKnowledgeBase` tool which returns 5 search results
2. Generates a text response based on those results
3. Displays ALL search results as citation cards in a separate section

The AI SDK structures messages with a `parts` array containing:
- `text` parts: The AI's response content
- `tool-searchKnowledgeBase` parts: The tool invocation and results

The rendering happens in `src/components/chat/chat-message.tsx`, where text parts are rendered using `Response` component (which wraps Streamdown for markdown rendering), and tool parts show all search results as `VideoReferenceCard` components.

**Architecture Constraints**:
- AI SDK doesn't provide built-in annotation/metadata for linking text segments to tool results
- Citations must be embedded in the text response itself
- The system prompt controls how Claude formats citations
- We need to parse citations from text and render them as interactive UI elements

## 🎯 Feature Vision & Flow

Users should see video citations **inline with the text** where they're relevant, not as a separate block at the bottom. When the AI mentions "customer obsession at 10:15", users should see an inline citation chip that they can click to jump to that video timestamp.

The flow should be:
1. User asks a question → AI calls search tool
2. AI receives search results and generates response
3. AI includes formatted citations like `[Video Title at 10:15](videoId:video-id:615)` directly in the text
4. The UI parses these citations and renders them as interactive elements
5. Users click citations to navigate to the specific video timestamp
6. Only citations actually mentioned in the text are displayed (no unused search results)

**Success Criteria**:
- Citations appear inline where they're relevant in the response
- Clicking a citation navigates to the video at the correct timestamp
- Unused search results don't appear as citations
- System prompt enforces proper citation formatting
- Error handling for malformed citations
- Maintains existing tool usage notifications and video reference cards as fallback

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Citation Parser Library

**Documentation References**:
- [AI SDK Message Parts](https://sdk.vercel.ai/docs/ai-sdk-core/concepts/messages)
- [AI SDK Tool Calling](https://sdk.vercel.ai/docs/ai-sdk-core/concepts/tools)

- [x] **Task 1.1**: Create citation parser utility module ✅
  - [x] Create new file `src/lib/citations/parser.ts` ✅
  - [x] Define `Citation` interface with fields: `id`, `videoId`, `videoTitle`, `timestamp`, `startTime`, `matchIndex`, `text` ✅
  - [x] Define `TextSegment` interface with type 'text' | 'citation' and optional `citation` property ✅
  - [x] Implement `parseCitations` function that uses regex to extract citations in format `[Video Title at M:SS](videoId:VIDEO_ID:START_TIME)` ✅
  - [x] Return object with `segments` array and `citations` array ✅
  - [x] Handle edge cases: no citations, malformed citations, multiple citations in one text ✅
  - [x] Add JSDoc documentation for all interfaces and functions ✅
  
  **Files to create**: `src/lib/citations/parser.ts`
  
  **Validation**:
  - Function correctly parses citation format: `[Video Title at 10:15](videoId:abc-123:615)`
  - Function splits text into segments with citations properly isolated
  - Function extracts videoId, videoTitle, timestamp, and startTime correctly
  - Function returns empty citations array when no citations found
  - Function handles malformed citations gracefully (returns text as-is)
  - No regex vulnerabilities (limited character classes)

---

### Phase 2: Inline Citation UI Component

- [x] **Task 2.1**: Create inline citation button component ✅
  - [x] Create new file `src/components/chat/inline-citation.tsx` ✅
  - [x] Define `InlineCitationProps` interface with: `videoId`, `videoTitle`, `timestamp`, `startTime` ✅
  - [x] Implement button styled to look like an underlined link with timestamp ✅
  - [x] Add onClick handler that logs citation info (placeholder for video navigation) ✅
  - [x] Add hover states and tooltip showing full video title and timestamp ✅
  - [x] Use shadcn Button component with ghost variant for subtle appearance ✅
  - [x] Include Link2 icon from lucide-react ✅
  
  **Files to create**: `src/components/chat/inline-citation.tsx` ✅
  
  **Validation**:
  - Component renders as inline button with timestamp ✅
  - Button is clickable and logs correct citation data ✅
  - Hover shows tooltip with video title ✅
  - Visually distinct but not intrusive in text flow ✅
  - Accessible (keyboard navigable, proper ARIA labels) ✅

- [x] **Task 2.2**: Create citation-enhanced response component ✅
  - [x] Create new file `src/components/chat/citation-response.tsx` ✅
  - [x] Import `parseCitations` from lib and `InlineCitation` component ✅
  - [x] Define `CitationResponseProps` with `text` and optional `videos` array ✅
  - [x] Implement component that: calls `parseCitations`, maps segments to JSX, renders text segments as spans, renders citation segments as `InlineCitation` components ✅
  - [x] Use `Response` component wrapper for markdown rendering of text segments ✅
  - [x] Fallback to plain Response when no citations found ✅
  - [x] Look up video title from `videos` prop as fallback if missing from citation ✅
  
  **Files to create**: `src/components/chat/citation-response.tsx` ✅
  
  **Validation**:
  - Component correctly parses citations from text ✅
  - Citations render as interactive inline buttons ✅
  - Text segments render normally ✅
  - Falls back gracefully when no citations present ✅
  - No console errors or warnings ✅
  - Maintains responsive design ✅

---

### Phase 3: Update Chat Message Rendering

**Documentation References**:
- [AI SDK UIMessage Structure](https://sdk.vercel.ai/docs/ai-sdk-core/concepts/messages)
- [AI SDK useChat Hook](https://sdk.vercel.ai/docs/reference/react/use-chat)

- [x] **Task 3.1**: Update chat message component to use citation rendering ✅
  - [x] Open `src/components/chat/chat-message.tsx` ✅
  - [x] Import `CitationResponse` component ✅
  - [x] Replace line 41: Change `<Response>{part.text}</Response>` to `<CitationResponse text={part.text} videos={videos} />` ✅
  - [x] Ensure `videos` prop is passed through to CitationResponse ✅
  - [x] Keep tool-searchKnowledgeBase rendering for "Searching..." notification ✅
  - [x] Keep VideoReferenceCard for backward compatibility and as fallback ✅
  
  **Files to modify**: `src/components/chat/chat-message.tsx` ✅
  
  **Validation**:
  - Citations render inline with text when present ✅
  - No citations shown when absent (normal text rendering) ✅
  - Videos prop is properly passed to CitationResponse ✅
  - Tool usage notification still appears during search ✅
  - VideoReferenceCard still renders for backward compatibility ✅
  - No TypeScript errors or warnings ✅

---

### Phase 4: Update System Prompt to Enforce Citation Format

**Documentation References**:
- [AI SDK System Prompts](https://sdk.vercel.ai/docs/ai-sdk-core/concepts/system-prompts)
- [AI SDK Tool Usage](https://sdk.vercel.ai/docs/ai-sdk-core/concepts/tools)

- [x] **Task 4.1**: Update system prompt to require specific citation format ✅
  - [x] Open `src/app/api/chat/route.ts` ✅
  - [x] Locate system prompt at lines 60-81 ✅
  - [x] Update instruction to require exact format: `[Video Title at M:SS](videoId:VIDEO_ID:START_TIME_IN_SECONDS)` ✅
  - [x] Add explicit example: "e.g., [Amazon Documentary at 10:15](videoId:abc-123:615)" ✅
  - [x] Emphasize calculating START_TIME as seconds (not minutes) ✅
  - [x] Add rule: "Only include citations for videos you actually reference in your response" ✅
  - [x] Keep existing instructions about when to search and how to use tool results ✅
  - [x] Maintain user context at the bottom ✅
  
  **Files to modify**: `src/app/api/chat/route.ts` (lines 60-81) ✅
  
  **Validation**:
  - System prompt clearly specifies citation format ✅
  - Includes concrete example of correct format ✅
  - Emphasizes only citing videos actually mentioned ✅
  - No breaking changes to existing functionality ✅
  - All existing instructions preserved ✅

- [x] **Task 4.2**: Add citation format validation helper (optional) ✅
  - [x] Consider adding a small comment in code explaining expected format ✅
  - [x] Add JSDoc to systemPrompt explaining citation requirements ✅
  - [x] This makes format expectations visible to developers ✅
  
  **Files to modify**: `src/app/api/chat/route.ts` ✅
  
  **Validation**:
  - Comments explain citation format expectations ✅
  - Future developers can understand requirements ✅
  - No impact on runtime behavior ✅

---

### Phase 5: Tool Output Enhancement (Optional)

- [x] **Task 5.1**: Update tool output to include more citation-friendly data ✅ (Already Complete)
  - [x] Open `src/lib/tools/search-tool.ts` ✅
  - [x] Verify `startTime` is already included in result for accurate citation generation ✅
  - [x] Tool already includes `videoTitle`, `videoId`, and `startTime` ✅
  - [x] Keep existing error handling and logging ✅
  
  **Files to modify**: `src/lib/tools/search-tool.ts` (already has required fields)
  
  **Validation**:
  - Tool output contains all data needed for citation formatting ✅
  - No breaking changes to existing tool call handling ✅
  - Formatting time display remains correct ✅

---

### Phase 6: Testing & Validation

- [x] **Task 6.1**: Test citation parsing ✅ (FIXED)
  - [x] Create unit tests for `parseCitations` function ✅
  - [x] Test with: valid citations, no citations, malformed citations, multiple citations ✅
  - [x] Test edge cases: empty text, very long text, special characters ✅
  - [x] Verify timestamp calculation (MM:SS to seconds conversion) ✅
  - [x] **FIX: Updated regex to support decimal seconds (e.g., 418.4)** ✅
  
  **Validation**:
  - All unit tests pass ✅
  - Parsing handles all edge cases ✅
  - No crashes on malformed input ✅
  - Timestamps calculated correctly ✅
  - Decimal seconds now supported ✅

- [ ] **Task 6.2**: Test inline citation rendering
  - [ ] Create a test conversation with citations
  - [ ] Verify citations render as inline buttons
  - [ ] Verify clicking citation logs correct data
  - [ ] Test with missing video titles (fallback behavior)
  - [ ] Test with multiple citations in one message
  - [ ] Verify citations appear where text mentions them
  
  **Validation**:
  - Citations render in correct positions
  - Click handlers work correctly
  - Fallbacks work when data missing
  - No UI glitches or layout issues
  - Responsive on mobile

- [ ] **Task 6.3**: Test system prompt enforcement
  - [ ] Ask AI a question that triggers search
  - [ ] Verify response contains properly formatted citations
  - [ ] Verify citations match the expected format
  - [ ] Check that unused search results don't appear as citations
  - [ ] Test with edge cases: no results, single result, many results
  
  **Validation**:
  - AI generates citations in specified format
  - Only mentioned videos appear as citations
  - Citations have correct videoId and timestamp
  - System prompt instructions are followed

- [ ] **Task 6.4**: Test backward compatibility
  - [ ] Load existing conversations without citations
  - [ ] Verify they render normally
  - [ ] Verify no errors or warnings
  - [ ] Test video reference cards still work as fallback
  - [ ] Test mixed scenarios (some messages with citations, some without)
  
  **Validation**:
  - Old messages render without issues
  - No regression in existing functionality
  - Fallback behavior works correctly
  - No console errors or warnings

- [ ] **Task 6.5**: Test error handling
  - [ ] Test with malformed citations in text
  - [ ] Test with missing video data
  - [ ] Test with invalid timestamps
  - [ ] Verify graceful degradation
  - [ ] Verify error logging
  
  **Validation**:
  - Errors don't break the UI
  - Errors are logged appropriately
  - User sees readable content even with errors
  - No uncaught exceptions

---

## 🎯 Success Criteria

✅ **Citation Parsing**:
- Regex correctly extracts citations in the format `[Title at time](videoId:id:seconds)`
- Text is split into segments (text and citation)
- Edge cases handled gracefully

✅ **Inline Citations**:
- Citations render as interactive buttons inline with text
- Clicking citation logs or navigates to video
- Citations look like underlined links with timestamps
- Hover shows full video title

✅ **System Prompt**:
- AI generates citations in the specified format
- Only videos actually mentioned appear as citations
- Citations are accurate (correct video and timestamp)

✅ **User Experience**:
- Citations appear where they're relevant in the response
- No unused search results shown as citations
- Existing functionality preserved
- Responsive and accessible

✅ **Code Quality**:
- TypeScript strict mode compliant
- Proper error handling
- JSDoc documentation
- No console warnings or errors

---

## 📝 Technical Notes

### Citation Format Specification
The citation format is: `[Video Title at M:SS](videoId:VIDEO_ID:START_TIME_IN_SECONDS)`

**Breakdown**:
- `Video Title`: The title to display (e.g., "Amazon Documentary")
- `at M:SS`: Human-readable timestamp (e.g., "at 10:15")
- `videoId`: The internal video ID (UUID)
- `START_TIME_IN_SECONDS`: Numeric timestamp for navigation (e.g., 615 for 10:15)

**Example**:
```
Customer obsession is the first principle [Amazon Documentary at 10:15](videoId:abc-123-def-456:615) mentioned by Bezos.
```

### AI SDK Message Structure
UIMessages from AI SDK have:
```typescript
{
  id: string
  role: 'user' | 'assistant'
  parts: Array<
    | { type: 'text', text: string }
    | { type: 'tool-searchKnowledgeBase', state: string, output?: ToolResult }
  >
}
```

### Parsing Strategy
1. Use regex to find citation markers in text
2. Split text into segments (text blocks and citation markers)
3. Map segments to React components
4. Render text segments with markdown support
5. Render citations as interactive buttons

### Error Handling
- Malformed citations: Render as plain text
- Missing video data: Use fallback title "Video"
- Invalid timestamps: Handle gracefully, don't crash
- Regex failures: Fall back to plain text rendering

### Backward Compatibility
- Keep VideoReferenceCard rendering as fallback
- Messages without citations render normally
- No database migrations required
- Existing conversations remain functional
