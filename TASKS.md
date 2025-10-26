# Phase 2 Implementation Plan: Add Tool Usage Notifications and Real-time Feedback

## 🧠 Context about Project

YouTube-GPT is an intelligent AI-powered platform that transforms YouTube videos into a searchable knowledge base. The system allows users to add individual videos or entire YouTube channels, automatically extracts transcripts, processes them into semantic chunks, and stores them in a vector database (ZeroEntropy) for intelligent retrieval. Users can then ask questions about their video content and receive AI-powered responses with specific citations and timestamps. The platform serves content creators, researchers, students, and professionals who need to efficiently extract, search, and repurpose information from their YouTube video libraries. The system is built with Next.js 14, Supabase for authentication and database, Inngest for background job processing, and ZeroEntropy for vector search capabilities. Currently, Phase 1 (video context integration) is complete, and we're implementing Phase 2 to provide real-time user feedback during AI tool execution, creating a transparent and interactive experience where users can see which tools are being used and track the progress of their requests.

## 🏗️ Context about Feature

The tool usage notification feature represents a critical UX enhancement to the existing AI chat system. Currently, the chat interface uses the AI SDK's `streamText` function which handles tool calls internally, but there's no frontend visibility into when tools are being executed. The `ChatArea.tsx` component has basic loading states (`isLoading`) but doesn't differentiate between general processing and specific tool usage. The AI SDK provides tool execution callbacks, but the current implementation doesn't expose tool usage events to the frontend. The technical challenge is that the AI SDK's streaming response doesn't include tool usage metadata in the streamed chunks, so we need to implement a custom solution to track and display tool usage in real-time. The existing UI components (Toast, Badge, Alert) provide the foundation for displaying notifications, but we need to create a custom tool usage notification system that integrates with the streaming chat flow.

## 🎯 Feature Vision & Flow

Users will see real-time notifications when the AI is using tools to search their video knowledge base, providing transparency and feedback during the AI's decision-making process. The flow begins when a user submits a question, and the system immediately shows a "Processing..." state. When the AI decides to use the `searchKnowledgeBase` tool, a notification appears showing "🔍 Searching your videos..." with a loading indicator. The notification updates in real-time to show the search query being executed and the number of results found. If multiple tool calls are made, each one is displayed with appropriate status updates. The notifications are non-intrusive, appearing as temporary overlays that don't disrupt the chat flow, and they automatically dismiss when the tool execution completes. This creates a transparent experience where users understand exactly what the AI is doing behind the scenes and can see the progress of their request in real-time.

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Create Tool Usage Notification System ✅ COMPLETED
- [x] **1.1 Design Tool Usage State Management**
  - Create a new state interface `ToolUsageState` in `ChatArea.tsx` to track active tools
  - Add state for current tool name, status, and progress information
  - Implement state management for multiple concurrent tool executions
  - Add cleanup logic to prevent memory leaks from abandoned tool states

- [x] **1.2 Create Simple Tool Usage Notification Component**
  - Create lightweight `ToolUsageNotification.tsx` component with custom styling
  - Design simple notification as small rounded bubble positioned above AI message
  - Show minimal text like "🔍 Searching your videos..." with subtle colors
  - Add `animate-pulse` class for subtle flashing effect and dismiss when tool completes

- [x] **1.3 Integrate Simple Notification with ChatArea**
  - Import and integrate `ToolUsageNotification` component in `ChatArea.tsx`
  - Position notification inside chat area, above the AI message being generated
  - Show notification only when AI is actively using tools, hide when tool completes
  - Keep notification minimal and unobtrusive with subtle background colors

### Task 2: Implement Tool Usage Tracking in API ✅ COMPLETED
- [x] **2.1 Modify AI SDK Tool Execution**
  - Update the `searchKnowledgeBase` tool execution in `src/app/api/chat/route.ts`
  - Add tool usage events that can be sent to the frontend
  - Implement custom streaming that includes tool usage metadata
  - Create structured tool usage events with consistent format

- [x] **2.2 Create Simple Tool Usage Event Stream**
  - Implement lightweight tool usage events that can be sent via existing chat stream
  - Send simple tool start and completion events to frontend
  - Include minimal data: tool name and basic status (e.g., "searching", "completed")
  - Keep events simple and lightweight to avoid complexity

- [x] **2.3 Add Tool Usage Logging and Debugging**
  - Add comprehensive console logging for tool usage events
  - Include timing information for tool execution performance
  - Add debugging information for troubleshooting tool usage issues
  - Implement proper error handling and fallback for tool usage events

### Task 3: Update Frontend to Handle Tool Usage Events ✅ COMPLETED
- [x] **3.1 Implement Tool Usage Event Listener**
  - Add event listener in `ChatArea.tsx` to receive tool usage events
  - Parse and validate incoming tool usage events from the API
  - Update tool usage state based on received events
  - Handle connection errors and reconnection for tool usage events

- [x] **3.2 Update Chat Streaming Logic**
  - Modify the existing streaming logic to handle both message content and tool usage events
  - Ensure tool usage notifications don't interfere with message streaming
  - Implement proper cleanup when streaming completes or errors occur
  - Add fallback behavior when tool usage events are not available

- [x] **3.3 Add Simple Tool Usage UI States**
  - Show simple UI states: "searching" (with animate-pulse) and "completed" (then hide)
  - Display minimal text like "🔍 Searching your videos..." during active tool usage
  - Hide notification immediately when tool execution completes
  - Keep states simple and clean without complex progress indicators

### Task 4: Enhance User Experience and Polish
- [ ] **4.1 Add Simple Tool Usage Animations**
  - Implement simple fade-in animation when tool usage starts
  - Use Tailwind's `animate-pulse` class for subtle flashing effect during active state
  - Add smooth fade-out transition when tool completes and notification hides
  - Keep animations minimal and performant without complex transitions

- [ ] **4.2 Implement Simple Tool Usage Persistence**
  - Store minimal tool usage state in component for debugging
  - Add simple console logging for tool usage events
  - Implement proper cleanup when notifications are dismissed
  - Keep persistence lightweight without complex analytics

- [ ] **4.3 Add Simple Accessibility and Error Handling**
  - Ensure tool usage notifications are accessible to screen readers
  - Add basic ARIA labels for tool usage states
  - Implement simple error handling for tool usage failures
  - Keep error handling minimal and user-friendly

### Task 5: Testing and Validation
- [ ] **5.1 Test Tool Usage Notifications**
  - Test tool usage notifications with various search queries
  - Verify notifications appear and disappear correctly
  - Test multiple concurrent tool executions
  - Validate tool usage notifications work with different video scopes

- [ ] **5.2 Test Error Scenarios**
  - Test tool usage notifications when search fails
  - Verify error handling when tool usage events are interrupted
  - Test recovery behavior when connection is lost
  - Validate fallback behavior when tool usage events are not available

- [ ] **5.3 Performance and Integration Testing**
  - Test tool usage notifications don't impact chat performance
  - Verify notifications work correctly with existing video selection
  - Test tool usage notifications across different screen sizes
  - Validate integration with existing chat features

## Acceptance Criteria
- [ ] Simple tool usage notifications appear when AI calls the searchKnowledgeBase tool
- [ ] Notifications show minimal text like "🔍 Searching your videos..." positioned above AI message
- [ ] Notifications use subtle colors and animate-pulse effect during active tool usage
- [ ] Notifications are non-intrusive and don't disrupt the chat experience
- [ ] Tool usage notifications work with both selected videos and all videos scope
- [ ] Notifications automatically hide when tool execution completes (no auto-dismiss timer)
- [ ] Simple error handling works correctly for failed tool executions
- [ ] Tool usage notifications are accessible and responsive
- [ ] Performance is not impacted by lightweight notification system
- [ ] Console logging provides basic debugging information for tool usage

## Notes
- This implementation builds on the existing AI SDK streaming infrastructure
- Tool usage notifications should be lightweight and simple
- Focus on creating a minimal, unobtrusive notification system
- Use custom styling instead of complex Toast systems for simplicity
- Position notifications inside chat area above AI message with subtle colors and animate-pulse
- Notifications should hide immediately when tool usage completes (no timer-based dismissal)
- Keep implementation simple and maintainable
- Maintain backward compatibility with existing chat functionality
