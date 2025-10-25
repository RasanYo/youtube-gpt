# AI Chat Interface Implementation Plan

## 🧠 Context about Project

YouTube-GPT is an intelligent AI-powered platform that transforms YouTube videos into a searchable knowledge base. The system allows users to add individual videos or entire YouTube channels, automatically extracts transcripts, processes them into semantic chunks, and stores them in a vector database (ZeroEntropy) for intelligent retrieval. Users can then ask questions about their video content and receive AI-powered responses with specific citations and timestamps. The platform serves content creators, researchers, students, and professionals who need to efficiently extract, search, and repurpose information from their YouTube video libraries. The system is built with Next.js 14, Supabase for authentication and database, Inngest for background job processing, and ZeroEntropy for vector search capabilities. Currently, the video ingestion and transcript processing pipeline is complete, and we're now implementing the core AI chat interface that will allow users to interact with their knowledge base.

## 🏗️ Context about Feature

The AI chat interface represents the central interaction point of the YouTube-GPT platform, sitting in the middle column of a three-column layout. This feature integrates with the existing ZeroEntropy vector database that contains processed transcript segments from YouTube videos, each with metadata including video IDs, timestamps, and user associations. The chat system needs to support scope management, allowing users to search across all their videos or filter to specific selected videos. The implementation leverages the AI SDK for seamless Claude integration, uses Server-Sent Events (SSE) for real-time streaming responses, and includes tool calling capabilities to query the knowledge base. The system must handle authentication through Supabase, maintain conversation history, and provide clickable citations that link back to specific video timestamps. Technical constraints include rate limiting for API calls, proper error handling for failed searches, and ensuring the interface works within the existing three-column responsive layout.

## 🎯 Feature Vision & Flow

Users will interact with an intelligent chat interface that can answer questions about their YouTube video content in real-time. The flow begins when a user types a question, which triggers a streaming AI response using Claude. The AI has access to a search tool that queries the ZeroEntropy knowledge base, retrieving relevant transcript segments with metadata. The AI processes these segments to provide comprehensive answers while including specific video citations with timestamps. Users can scope their searches to all videos or select specific videos from the right column's knowledge base explorer. The interface displays streaming responses with loading indicators, shows tool usage notifications when searching the knowledge base, and renders clickable citations that open videos at the exact timestamp mentioned. The system maintains conversation history in the left sidebar, allows users to start new conversations, and provides an empty state with suggested prompts to help users get started. All interactions are authenticated and scoped to the user's personal video collection.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Database Trigger Setup
- [x] **1.1 Create Direct Inngest Trigger** ✅ COMPLETED
  - ✅ Modified Supabase Edge Function to trigger Inngest directly after metadata fetch
  - ✅ Added Inngest event triggering in `fetch-video-metadata` function
  - ✅ Implemented proper error handling for Inngest trigger failures
  - ✅ Works for both single videos and batch channel processing

- [x] **1.2 Direct Inngest Integration** ✅ COMPLETED
  - ✅ Integrated Inngest client directly in Supabase Edge Function
  - ✅ Sends `video.transcript.processing.requested` event with complete video data
  - ✅ Handles both single video and batch processing scenarios
  - ✅ No webhook endpoint needed with direct integration approach

- [x] **1.3 Update Video Status Schema** ✅ COMPLETED
  - ✅ Added 'PENDING' status to VideoStatus enum in Supabase database
  - ✅ Updated Supabase Edge Function to set status to 'PENDING' initially, then 'QUEUED' after metadata fetch
  - ✅ Ran database migration to update enum values and default status
  - ✅ Updated TypeScript types to include PENDING status

### Phase 2: Inngest Job Integration
- [ ] **2.1 Create Transcript Processing Job**
  - Set up Inngest function for transcript extraction using youtube-transcript package
  - Implement video transcript fetching with error handling and retries
  - Add job configuration for timeout, retry attempts, and concurrency limits
  - Test job with sample video IDs and validate transcript quality

- [ ] **2.2 Implement Vector Embedding Generation**
  - Integrate ZeroEntropy API for generating vector embeddings from transcript text
  - Chunk transcript into appropriate sizes for embedding generation
  - Store embeddings in Supabase with proper indexing for search
  - Add error handling for embedding generation failures

- [ ] **2.3 Update Video Status Pipeline**
  - Modify job to update video status throughout processing stages
  - Add 'TRANSCRIPT_EXTRACTING', 'EMBEDDING_GENERATING', 'READY' statuses
  - Implement proper error handling and status rollback on failures
  - Add processing metrics and timing information to video records

### Phase 3: Webhook-to-Inngest Integration
- [ ] **3.1 Connect Webhook to Inngest**
  - Modify webhook endpoint to trigger Inngest job with video data
  - Pass video ID, YouTube ID, and user context to Inngest function
  - Add webhook response handling and error reporting
  - Implement webhook retry logic for failed Inngest triggers

- [ ] **3.2 Add Batch Processing Support**
  - Handle channel processing scenarios where multiple videos need transcript jobs
  - Implement batch job creation for channel ingestion workflows
  - Add progress tracking for batch operations
  - Ensure proper error handling for individual video failures in batches

### Phase 4: Error Handling & Monitoring
- [ ] **4.1 Implement Comprehensive Error Handling**
  - Add retry mechanisms for failed webhook calls and Inngest jobs
  - Create dead letter queue for permanently failed jobs
  - Implement exponential backoff for retry attempts
  - Add proper error logging and alerting for system administrators

- [ ] **4.2 Add Processing Status Tracking**
  - Update frontend to display detailed processing status for each video
  - Add progress indicators for transcript extraction and embedding generation
  - Implement real-time status updates using Supabase Realtime subscriptions
  - Add user notifications for completed and failed processing jobs

- [ ] **4.3 Create Monitoring Dashboard**
  - Add processing metrics to track job success rates and processing times
  - Implement health checks for webhook and Inngest systems
  - Create alerts for system failures and performance degradation
  - Add debugging tools for troubleshooting processing issues

### Phase 5: Testing & Validation
- [ ] **5.1 Unit Testing**
  - Write tests for webhook endpoint with various payload scenarios
  - Test Inngest job functions with mock data and error conditions
  - Add tests for status update logic and error handling paths
  - Ensure proper test coverage for all new functionality

- [ ] **5.2 Integration Testing**
  - Test end-to-end flow from video ingestion to transcript processing
  - Validate webhook triggering with real Supabase database changes
  - Test batch processing with multiple videos and channels
  - Verify real-time status updates in the frontend interface

- [ ] **5.3 Performance Testing**
  - Load test webhook endpoint with high volume of status changes
  - Test Inngest job processing with concurrent video processing
  - Validate system performance under various load conditions
  - Optimize processing times and resource usage
