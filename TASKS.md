# AI Chat Interface Implementation Plan

## 🧠 Context about Project

YouTube-GPT is an intelligent AI-powered platform that transforms YouTube videos into a searchable knowledge base. The system allows users to add individual videos or entire YouTube channels, automatically extracts transcripts, processes them into semantic chunks, and stores them in a vector database (ZeroEntropy) for intelligent retrieval. Users can then ask questions about their video content and receive AI-powered responses with specific citations and timestamps. The platform serves content creators, researchers, students, and professionals who need to efficiently extract, search, and repurpose information from their YouTube video libraries. The system is built with Next.js 14, Supabase for authentication and database, Inngest for background job processing, and ZeroEntropy for vector search capabilities. Currently, the video ingestion and transcript processing pipeline is complete, and we're now implementing the core AI chat interface that will allow users to interact with their knowledge base.

## 🏗️ Context about Feature

The AI chat interface represents the central interaction point of the YouTube-GPT platform, sitting in the middle column of a three-column layout. This feature integrates with the existing ZeroEntropy vector database that contains processed transcript segments from YouTube videos, each with metadata including video IDs, timestamps, and user associations. The chat system needs to support scope management, allowing users to search across all their videos or filter to specific selected videos. The implementation leverages the AI SDK for seamless Claude integration, uses Server-Sent Events (SSE) for real-time streaming responses, and includes tool calling capabilities to query the knowledge base. The system must handle authentication through Supabase, maintain conversation history, and provide clickable citations that link back to specific video timestamps. Technical constraints include rate limiting for API calls, proper error handling for failed searches, and ensuring the interface works within the existing three-column responsive layout.

## 🎯 Feature Vision & Flow

Users will interact with an intelligent chat interface that can answer questions about their YouTube video content in real-time. The flow begins when a user types a question, which triggers a streaming AI response using Claude. The AI has access to a search tool that queries the ZeroEntropy knowledge base, retrieving relevant transcript segments with metadata. The AI processes these segments to provide comprehensive answers while including specific video citations with timestamps. Users can scope their searches to all videos or select specific videos from the right column's knowledge base explorer. The interface displays streaming responses with loading indicators, shows tool usage notifications when searching the knowledge base, and renders clickable citations that open videos at the exact timestamp mentioned. The system maintains conversation history in the left sidebar, allows users to start new conversations, and provides an empty state with suggested prompts to help users get started. All interactions are authenticated and scoped to the user's personal video collection.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Dependencies and Environment Setup
- [ ] Install AI SDK dependencies
  - [ ] Add `ai` package for core AI functionality (ref: https://ai-sdk.dev/docs/introduction)
  - [ ] Add `@ai-sdk/anthropic` package for Claude integration (ref: https://ai-sdk.dev/docs/providers/anthropic)
  - [ ] Update package.json with new dependencies
- [x] Configure environment variables
  - [x] Add `ANTHROPIC_API_KEY` to environment configuration
  - [x] Update `.env.example` with required API key
  - [ ] Verify environment variable loading in development

### Phase 2: Core AI Integration and API Routes
- [ ] Create Claude API route handler
  - [ ] Implement `src/app/api/chat/route.ts` with POST handler (ref: https://ai-sdk.dev/docs/ai-sdk-core/generating-text)
  - [ ] Set up `streamText` function with Claude model configuration (ref: https://ai-sdk.dev/docs/foundations/streaming)
  - [ ] Add proper error handling and response formatting
- [ ] Implement knowledge base search tool
  - [ ] Create `src/lib/search-videos.ts` with search functionality
  - [ ] Integrate with existing ZeroEntropy client from `src/lib/zeroentropy/client.ts`
  - [ ] Add filtering capabilities for video scope management
  - [ ] Implement proper error handling for search failures
  - [ ] Reference existing ZeroEntropy search patterns from `src/lib/zeroentropy/pages.ts`

### Phase 3: Chat UI Components and State Management
- [ ] Enhance existing ChatArea component
  - [ ] Replace static messages with manual streaming implementation (more reliable than useChat hook)
  - [ ] Implement real-time streaming with fetch and ReadableStream
  - [ ] Add loading states and error handling for chat interactions
  - [ ] Update existing `src/components/ChatArea.tsx` component
- [ ] Create citation components
  - [ ] Build `VideoCitation` component for displaying video references
  - [ ] Add clickable timestamp functionality
  - [ ] Implement proper styling and hover states
  - [ ] Reference Vercel AI Chatbot template patterns (ref: https://vercel.com/templates/next.js/nextjs-ai-chatbot)
- [ ] Add scope management UI
  - [ ] Create scope indicator showing selected videos
  - [ ] Add "Reset to All" functionality
  - [ ] Implement scope persistence across conversations

### Phase 4: Integration and Testing
- [ ] Integrate with existing layout
  - [ ] Chat interface already integrated in main page layout
  - [ ] Ensure proper responsive behavior in three-column layout
  - [ ] Test integration with existing components
  - [ ] Verified `src/app/page.tsx` structure
- [ ] Add conversation history management (Future Enhancement)
  - [ ] Implement conversation persistence (ref: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
  - [ ] Add conversation title generation
  - [ ] Create conversation restoration functionality
  - [ ] Integrate with existing `src/components/ConversationSidebar.tsx`
- [ ] Comprehensive testing
  - [ ] Test development server startup
  - [ ] Verify API endpoint responds
  - [ ] Test component rendering without errors
  - [ ] Validate environment variables
  - [ ] Test SSE streaming functionality (requires end-to-end test)
  - [ ] Verify knowledge base search accuracy (requires video data)
  - [ ] Test scope management and filtering (requires video data)
  - [ ] Validate citation linking and timestamp accuracy (requires video data)
  - [ ] Test tool calling integration (future enhancement)

## 📚 References and Documentation

### AI SDK Documentation
- [AI SDK Introduction](https://ai-sdk.dev/docs/introduction) - Core concepts and getting started
- [AI SDK Core - Generating Text](https://ai-sdk.dev/docs/ai-sdk-core/generating-text) - Text generation patterns
- [AI SDK Core - Streaming](https://ai-sdk.dev/docs/ai-sdk-core/streaming) - Real-time streaming implementation
- [AI SDK Core - Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tool-calling) - Tool integration patterns
- [AI SDK UI - useChat Hook](https://ai-sdk.dev/docs/ai-sdk-ui/use-chat) - Chat interface implementation
- [AI SDK UI - Streaming](https://ai-sdk.dev/docs/ai-sdk-ui/streaming) - UI streaming patterns
- [AI SDK UI - Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) - Conversation storage
- [Anthropic Provider](https://ai-sdk.dev/docs/providers/anthropic) - Claude integration guide

### Templates and Examples
- [Vercel AI Chatbot Template](https://vercel.com/templates/next.js/nextjs-ai-chatbot) - Reference implementation
- [GitHub Issue #33](https://github.com/RasanYo/youtube-gpt/issues/33) - Feature tracking

### Existing Codebase References
- `src/lib/zeroentropy/client.ts` - ZeroEntropy client configuration
- `src/lib/zeroentropy/pages.ts` - Search and indexing functions
- `src/components/ChatArea.tsx` - Current chat interface component
- `src/components/ConversationSidebar.tsx` - Conversation history component
- `src/app/layout.tsx` - Main application layout

