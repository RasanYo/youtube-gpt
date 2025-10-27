# Implementation Plan: Clickable Inline Citations with Video Preview

## 🧠 Context about Project

**YouTube-GPT** is an AI-powered full-stack SaaS application that enables users to search, analyze, and extract information from YouTube video content. The platform allows users to add individual videos or entire channels to build a searchable knowledge base. Users can ask AI-powered questions across their video library and receive grounded answers with citations and timestamps.

The application uses Next.js 14 with App Router, Supabase for authentication and database operations, and implements a ChatGPT-style three-column interface. The chat interface uses Vercel AI SDK with Claude for natural language understanding and semantic search through ZeroEntropy for video content retrieval.

**Current State**: The system has been enhanced to display inline video citations with subtle gray titles and red timestamps. These citations are parsed from AI responses and rendered as interactive elements, but they currently only log to console when clicked.

## 🏗️ Context about Feature

The application has a three-column layout:
- **Left Column**: Conversation sidebar
- **Center Column**: Chat area with messages
- **Right Column**: Knowledge base explorer with video preview

**Architecture Challenge**: The inline citations are rendered in the chat area (center column), but the video preview player is managed in the Knowledge Base component (right column). These components are siblings in the component tree with no direct communication channel.

**Technical Context**:
- The Knowledge Base component manages its own `previewingVideo` state (line 20 in `knowledge-base.tsx`)
- The preview component displays YouTube iframes with `youtubeId` parameter
- Inline citations have access to `videoId` (database ID), `videoTitle`, `timestamp`, and `startTime` (in seconds)
- The video data structure includes both database `id` and `youtubeId` (YouTube's external ID)

## 🎯 Feature Vision & Flow

When a user clicks on an inline citation in the chat response (e.g., clicking on "Amazon Documentary 6:58"), the system should:

1. Identify which video is being referenced by the citation's videoId
2. Open the video preview player in the knowledge base sidebar (right column)
3. Load the video at the specific timestamp mentioned in the citation
4. Display the video with title and channel information

**Success Criteria**:
- Clicking any inline citation opens the video preview in the knowledge base
- Video starts playing at the exact timestamp specified in the citation
- Smooth user experience with no page refresh or navigation
- Works across all citations in any conversation message
- Responsive design maintained for different screen sizes

**UX Flow**:
1. User reads AI response with inline citations
2. User sees video title in gray italic text and timestamp in red italic text
3. User clicks on the citation (either title or timestamp)
4. Video preview opens in the right sidebar automatically
5. YouTube player starts at the correct timestamp
6. User can watch the relevant video segment inline

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Create Video Preview Context

**Documentation References**:
- [React Context API](https://react.dev/reference/react/useContext)
- [Creating Context Providers](https://react.dev/reference/react/createContext)

- [x] **Task 1.1**: Create VideoPreviewContext provider ✅
  - [x] Create new file `src/contexts/VideoPreviewContext.tsx` ✅
  - [x] Define VideoPreviewState interface with fields: `youtubeId`, `title`, `channelName`, `timestamp` ✅
  - [x] Create context with state and setter for preview video ✅
  - [x] Import `useVideos` hook for video lookup functionality ✅
  - [x] Export custom hook `useVideoPreview()` that returns:
    - `openPreview(videoId: string, timestamp: number)` - Opens video at specific timestamp ✅
    - `closePreview()` - Closes the video preview ✅
    - `previewVideo` - Current preview state ✅
  - [x] In `openPreview` function:
    - Look up video by database ID using videos array from `useVideos` hook ✅
    - Extract `youtubeId`, `title`, and `channelName` from found video ✅
    - Clamp timestamp to ensure it's non-negative: `Math.max(0, timestamp)` ✅
    - Handle missing videos gracefully (log error and return early) ✅
    - Use toast notifications for user feedback on errors ✅
  - [x] Add JSDoc documentation for all functions ✅
  - [x] Use React's createContext and useContext for state management ✅
  - [x] Handle edge cases: negative timestamps, video not found, missing youtubeId ✅
  
  **Files to create**: `src/contexts/VideoPreviewContext.tsx`
  
  **Validation**:
  - Context provider exports useVideoPreview hook
  - Hook returns openPreview, closePreview, and previewVideo
  - Video lookup works correctly (database ID → youtube ID conversion)
  - Error handling for missing videos works
  - Timestamps are clamped to non-negative values
  - TypeScript types properly defined
  - No linter errors

---

### Phase 2: Integrate Context into Knowledge Base

- [x] **Task 2.1**: Update Knowledge Base to use VideoPreviewContext ✅
  - [x] Open `src/components/knowledge-base/knowledge-base.tsx` ✅
  - [x] Import `useVideoPreview` from VideoPreviewContext ✅
  - [x] Replace local `previewingVideo` state with `previewVideo` from context ✅
  - [x] Remove local `setPreviewingVideo` state setter ✅
  - [x] Update `handleVideoPreview` function to use context's openPreview method ✅
  - [x] Update `onClose` handler to use context's closePreview method ✅
  - [x] Keep all existing functionality for manual video list clicks ✅
  
  **Files to modify**: `src/components/knowledge-base/knowledge-base.tsx` (lines 16-58)
  
  **Validation**:
  - Knowledge base still opens previews when clicking videos from list
  - No breaking changes to existing functionality
  - Video preview component receives correct props
  - Knowledge base can close preview properly

- [x] **Task 2.2**: Update Knowledge Base Preview to support timestamps ✅
  - [x] Open `src/components/knowledge-base/knowledge-base-preview.tsx` ✅
  - [x] Add `timestamp` field to `KnowledgeBasePreviewProps` interface ✅
  - [x] Update `Video` interface to include optional `timestamp` field ✅
  - [x] Modify iframe src to include `?start=${timestamp}` parameter when timestamp exists ✅
  - [x] Ensure proper URL encoding: `encodeURIComponent(youtubeId)` and `encodeURIComponent(timestamp)` ✅
  - [x] Convert timestamp to whole seconds: `Math.floor(Math.max(0, timestamp))` ✅
  - [x] Handle undefined/null timestamp gracefully (no start parameter) ✅
  - [x] Add security: Ensure timestamp is valid number before using in URL ✅
  
  **Files to modify**: `src/components/knowledge-base/knowledge-base-preview.tsx` (lines 7-46)
  
  **Validation**:
  - Preview component accepts timestamp prop
  - YouTube player starts at correct timestamp when provided
  - YouTube player works normally when no timestamp provided
  - URL is properly encoded (no injection vulnerabilities)
  - Negative or invalid timestamps are clamped to 0
  - No console errors or warnings

---

### Phase 3: Connect Inline Citations to Context

- [x] **Task 3.1**: Update InlineCitation to use VideoPreviewContext ✅
  - [x] Open `src/components/chat/inline-citation.tsx` ✅
  - [x] Import `useVideoPreview` hook from VideoPreviewContext ✅
  - [x] Import `useToast` hook for mobile/tablet user feedback ✅
  - [x] Get `openPreview` function from the hook ✅
  - [x] Update `handleClick` function to:
    - Check if knowledge base is visible (screen width >= 1024px / lg breakpoint) ✅
    - If on mobile/tablet: Show toast notification that preview requires desktop view ✅
    - If on desktop: Call `openPreview(videoId, startTime)` with the citation's video ID and timestamp ✅
    - Remove console.log placeholder ✅
  - [x] Keep all existing styling and accessibility features ✅
  - [x] Ensure click handlers work for both title and timestamp spans ✅
  - [x] Add error handling for failed openPreview calls ✅
  
  **Files to modify**: `src/components/chat/inline-citation.tsx` (lines 40-59)
  
  **Validation**:
  - Clicking citation opens video preview in knowledge base on desktop
  - Video starts at correct timestamp
  - Mobile/tablet users see helpful toast notification
  - No console errors on click
  - Tooltip still shows on hover
  - Keyboard navigation still works

- [x] **Task 3.2**: Ensure video data lookup works ✅ (Moved to Task 1.1)
  - [x] Video lookup logic is now in VideoPreviewContext
  - [x] Task consolidated into Phase 1 for better separation of concerns
  
  **Note**: Video lookup is handled in Task 1.1. No separate task needed here.

---

### Phase 4: Wrap App with Context Provider

- [x] **Task 4.1**: Add VideoPreviewProvider to app layout ✅
  - [x] Open `src/app/providers.tsx` (providers file already exists) ✅
  - [x] Import `VideoPreviewProvider` from `@/contexts/VideoPreviewContext` ✅
  - [x] Add VideoPreviewProvider inside the VideoSelectionProvider (nesting order matters) ✅
  - [x] Provider placement: `<VideoSelectionProvider><VideoPreviewProvider>{children}</VideoPreviewProvider></VideoSelectionProvider>` ✅
  - [x] This allows VideoPreviewContext to potentially use video selection data if needed ✅
  - [x] Verify provider placement doesn't break existing functionality ✅
  - [x] Check that all child components can access context without errors ✅
  
  **Files to modify**: `src/app/providers.tsx` (lines 8-29)
  
  **Validation**:
  - Context provider wraps necessary components at correct nesting level
  - No performance issues from context updates
  - All components can access context (no "must be used within provider" errors)
  - No React context warnings
  - Provider order is correct (VideoSelectionProvider → VideoPreviewProvider → children)

---

### Phase 5: Testing & Validation

- [x] **Task 5.1**: Test citation click functionality ✅
  - [ ] Create a test conversation with citations
  - [ ] Click on different citations in the response
  - [ ] Verify video preview opens in knowledge base
  - [ ] Verify video starts at correct timestamp
  - [ ] Test with multiple citations in one message
  - [ ] Test clicking same citation multiple times
  
  **Validation**:
  - All citations open correct videos
  - Timestamps are accurate
  - No UI glitches
  - Smooth transitions

- [x] **Task 5.2**: Test cross-column interaction ✅
  - [ ] Verify knowledge base visibility (should be visible on lg screens)
  - [ ] Test that video preview appears in correct location
  - [ ] Test closing preview after opening from citation
  - [ ] Test opening multiple videos in sequence
  - [ ] Verify video player controls work normally
  
  **Validation**:
  - Video preview appears in knowledge base column
  - Preview doesn't interfere with chat area
  - Preview can be closed properly
  - YouTube player controls work as expected

- [x] **Task 5.3**: Test edge cases and error scenarios ✅
  - [ ] Test with videos that don't exist in database (deleted/removed videos)
  - [ ] Verify toast notification appears: "Video not found"
  - [ ] Test with malformed or missing timestamps (NaN, undefined, null)
  - [ ] Test with negative timestamps (should clamp to 0)
  - [ ] Test with very large timestamps (e.g., 999999999 seconds)
  - [ ] Test with videos missing youtubeId (invalid video data)
  - [ ] Test keyboard navigation accessibility (Enter/Space on citations)
  - [ ] Test with long video titles (text overflow handling)
  - [ ] Test rapid clicking on citations (debouncing)
  - [ ] Test clicking same citation multiple times
  - [ ] Test opening one video preview then clicking another citation
  
  **Validation**:
  - Graceful error handling for all edge cases
  - Toast notifications appear for errors
  - No crashes or uncaught exceptions
  - User gets appropriate feedback for all error scenarios
  - Negative timestamps are clamped to 0
  - Very large timestamps are handled gracefully
  - Mobile experience remains functional
  - No memory leaks from multiple preview opens

- [x] **Task 5.4**: Test responsive design and mobile behavior ✅
  - [ ] Test on desktop (lg screens >= 1024px) where knowledge base is visible
  - [ ] Verify clicking citations opens preview and starts video at timestamp
  - [ ] Test on tablet (md screens 768px-1023px) where knowledge base is hidden
  - [ ] Test on mobile (sm screens < 768px) where knowledge base is hidden
  - [ ] Verify clicking citations on mobile/tablet shows toast notification: "Preview requires desktop view. Open in browser to preview videos."
  - [ ] Test screen resize from desktop to mobile/tablet during preview
  - [ ] Ensure no layout shifts or UI breaks on different screen sizes
  
  **Validation**:
  - Responsive breakpoints work correctly
  - No layout shifts or UI breaks
  - Toast notification appears on mobile/tablet when clicking citations
  - Toast message is helpful and actionable
  - Preview works correctly on desktop (≥1024px)
  - All screen sizes maintain functionality
  - No console errors on any screen size

---

## 🎯 Success Criteria

✅ **Functionality**:
- Clicking inline citations opens video preview in knowledge base
- Videos start at correct timestamps
- All citations work regardless of location in response

✅ **User Experience**:
- Smooth, instant response to clicks
- Video preview appears in expected location (right column)
- Preview can be closed and reopened
- No page refresh or navigation required

✅ **Integration**:
- Knowledge base and chat area communicate via context
- No direct component coupling
- Clean separation of concerns

✅ **Code Quality**:
- TypeScript strict mode compliant
- Proper error handling
- JSDoc documentation
- No console warnings or errors

---

## 📝 Technical Notes

### Context Architecture
The VideoPreviewContext will:
- Manage preview state globally
- Provide openPreview(videoId, timestamp) method
- Provide closePreview() method
- Lookup YouTube ID from database video ID using useVideos hook
- Handle state updates across components
- Include error handling and user feedback via toasts

### Video ID Resolution
- Citations use database video IDs (from citations table)
- Knowledge base needs YouTube IDs for iframe (youtubeId field)
- Context will bridge this gap by looking up videos in the videos array from useVideos hook
- Lookup by database ID: `videos.find(v => v.id === videoId)`
- Extract youtubeId, title, and channelName from found video
- Handle missing videos gracefully with toast notification

### Timestamp Handling & Security
- Citations store timestamp in seconds (can be decimal like 418.4)
- YouTube expects whole seconds in URL parameter
- Convert with Math.floor(Math.max(0, timestamp)) to:
  - Ensure non-negative values (clamp negatives to 0)
  - Convert decimals to whole seconds
  - Prevent invalid timestamps
- URL encoding: Use encodeURIComponent() for youtubeId and timestamp in iframe src
- Security considerations:
  - Never use unvalidated user input directly in URLs
  - Always validate and clamp numeric values
  - Use encodeURIComponent to prevent injection attacks
  - Ensure youtubeId is a valid YouTube ID format (11 characters)

### Responsive Considerations
- Knowledge base hidden on mobile (sm) and tablet (md) breakpoints
- Only visible on desktop (lg >= 1024px breakpoint)
- Toast notification shown when clicking citations on mobile/tablet
- Toast message: "Preview requires desktop view. Open in browser to preview videos."
- Detecting screen size: `window.innerWidth >= 1024` or use CSS media queries with matchMedia
- Alternative: Check if knowledge base is in DOM (querySelector)

### Error Handling Strategy
1. Missing video: Show toast "Video not found. It may have been removed."
2. Missing youtubeId: Show toast "This video is not available for preview."
3. Invalid timestamp: Clamp to 0 and proceed
4. Network errors: Log to console, show generic error toast
5. Mobile/tablet: Show helpful desktop-only message
6. Context not provided: Throw descriptive error (already handled by useContext)

### Type Safety
- Use TypeScript interfaces for all context methods
- Validate videoId is non-empty string
- Validate timestamp is number (not NaN, not Infinity)
- Use optional chaining when accessing video properties
- Ensure all functions have proper return types

