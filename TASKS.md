# Auto-trigger Transcript Jobs - Implementation Plan

## 🧠 Context about Project

YouTube-GPT is an AI-powered YouTube knowledge base that transforms hours of video content into an instantly searchable, intelligent assistant. The platform serves content creators, researchers, students, and professionals who need to efficiently extract, search, and repurpose information from their personal video libraries. The system uses a three-column ChatGPT-style interface with conversation history, AI chat, and knowledge base management. Built on React/TypeScript with Supabase for authentication and database, the platform currently supports YouTube video ingestion with metadata fetching through Supabase Edge Functions. The system is in active development with core authentication, UI components, and video ingestion working, but lacks the automated processing pipeline that would transform raw video metadata into searchable, AI-ready content through transcript extraction and vector embeddings.

## 🏗️ Context about Feature

The auto-trigger transcript jobs feature sits at the critical junction between video ingestion and AI processing in the YouTube-GPT pipeline. Currently, when users add YouTube videos or channels, the system successfully fetches metadata (title, thumbnail, duration, channel info) and stores it in the `videos` table with status tracking (PENDING → QUEUED → PROCESSING → READY/FAILED). The PENDING → QUEUED transition is fully implemented and working correctly. However, there's a gap between the QUEUED status and the next processing step - transcript extraction and vector embedding generation. The feature must integrate with the existing Supabase database schema, leverage the current Inngest background job system, and work alongside the real-time status updates already implemented in the frontend. The system needs to detect when a video transitions TO 'QUEUED' status and automatically queue it for transcript processing without manual intervention, creating a seamless event-driven pipeline that scales with user activity.

## 🎯 Feature Vision & Flow

The desired end-to-end behavior creates a fully automated video processing pipeline where users simply paste YouTube URLs and the system handles everything else. When a video's metadata is successfully fetched and stored, the system automatically detects this status change and triggers an Inngest job for transcript extraction. The job processes the video's transcript, generates vector embeddings for semantic search, and updates the video status to 'READY' for AI queries. Users see real-time status updates in the Knowledge Base panel, from "Processing metadata..." to "Extracting transcript..." to "Ready for AI queries." The system handles both single videos and batch channel processing, with proper error handling and retry mechanisms for failed jobs. The entire flow is invisible to users - they add videos and can immediately start asking AI questions about their content once processing completes.

## ✅ Current Implementation Status

### Completed Features
- **PENDING → QUEUED Status Flow**: Fully implemented and working
  - Videos are created with `PENDING` status by default
  - Supabase Edge Function fetches metadata and updates to `QUEUED`
  - Real-time UI updates show status changes correctly
  - Error handling for failed metadata fetching (sets status to `FAILED`)

### Implementation Details
- **Database Schema**: `PENDING` status added to enum, set as default
- **Edge Function**: `fetch-video-metadata` handles PENDING → QUEUED transition
- **Frontend**: VideoCard component displays PENDING status with proper UI
- **Real-time Updates**: Supabase Realtime subscriptions work for status changes

### Next Steps Required
The system currently stops at `QUEUED` status. The following components need to be implemented:
- Background job processing (QUEUED → PROCESSING → READY)
- Transcript extraction and vector embedding generation
- Webhook triggers for status transitions

### Status Flow Diagram
```
PENDING → QUEUED → PROCESSING → READY
   ↓         ↓         ↓         ↓
[Created] [Metadata] [Transcript] [AI Ready]
           Fetched   Processing
           
Webhook triggers here ↑
(When status changes TO 'QUEUED')
```

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Database Trigger Setup
- [ ] **1.1 Create Supabase Database Webhook**
  - Set up webhook trigger on `videos` table for status changes
  - Configure webhook to fire when status changes TO 'QUEUED' (after metadata fetch)
  - Add webhook authentication and security headers
  - Test webhook with sample video status updates

- [ ] **1.2 Create Webhook Endpoint**
  - Create `/api/webhooks/process-transcript` endpoint
  - Implement webhook signature verification for security
  - Add request validation and error handling
  - Set up proper logging for webhook calls and failures

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
  - Add 'PROCESSING' status for transcript extraction and embedding generation
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
