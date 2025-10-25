# ZeroEntropy Transcript Processing Pipeline Implementation Plan

## 🧠 Context about Project

**YouTube-GPT** is an AI-powered YouTube knowledge base that transforms hours of video content into an instantly searchable, intelligent assistant. The platform enables users to find specific information quickly in video content, generate shareable content (LinkedIn posts, summaries), and get grounded answers with citations and timestamps. 

The system currently uses a three-column ChatGPT-style interface with conversation history, real-time chat, and a knowledge base explorer. Built on Next.js 14 with Supabase for authentication and database, the platform processes YouTube videos through an Inngest-based pipeline that extracts transcripts and prepares them for AI-powered search and retrieval.

The project is currently in the implementation phase with the foundation (UI, auth, database) complete and the AI processing pipeline being built. The existing video processing pipeline extracts transcripts from YouTube videos but lacks vector embeddings and semantic search capabilities needed for the core RAG functionality.

## 🏗️ Context about Feature

The ZeroEntropy transcript processing pipeline is a critical component that bridges the gap between raw video transcripts and intelligent AI responses. Currently, the system extracts transcripts using `youtube-transcript-plus` and stores basic video metadata in Supabase, but lacks the vector search capabilities needed for semantic retrieval.

The feature integrates with the existing Inngest video processing pipeline (`src/lib/inngest/functions/process-video.ts`) which currently handles: PENDING → QUEUED → PROCESSING → TRANSCRIPT_EXTRACTING → READY/FAILED status flow. The pipeline needs to be extended to include ZeroEntropy processing for vector embeddings and page-based indexing.

Key technical constraints include: multi-tenant data isolation via Supabase RLS, real-time status updates via Supabase Realtime, and the need to preserve precise timestamp mapping for accurate video citations. The system must handle sentence fragmentation in transcripts and ensure proper user scoping for collections.

## 🎯 Feature Vision & Flow

The end-to-end flow enables users to ask questions about their video content and receive AI responses with precise video references and timestamps (e.g., "Video: Sarkozy and the Libya case, Timestamp: 01:38 - 02:40"). 

When a user adds a YouTube video, the system processes it through: URL validation → metadata extraction → transcript extraction → ZeroEntropy indexing with timestamp mapping → vector embedding generation → storage in user-scoped collections. Each transcript segment becomes a "page" in ZeroEntropy with metadata including video ID, title, duration, and precise timestamps.

During chat interactions, user queries trigger semantic search across the user's video collection, retrieving relevant transcript segments with timestamps. The AI generates responses grounded in the retrieved content, providing specific video references and timestamps for verification. The system maintains conversation context and allows users to select specific videos for focused interactions.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: ZeroEntropy Integration Setup

#### Task 1.1: Environment Configuration and Dependencies
- [x] Add ZeroEntropy API key to environment variables in `.env.local`
  - Add `ZEROENTROPY_API_KEY` to environment configuration
  - Update `.env.example` with ZeroEntropy configuration template
  - Ensure proper environment variable validation in client setup

- [x] Install ZeroEntropy SDK and related dependencies
  - install `pnpm install zeroentropy`
  - Update TypeScript types for ZeroEntropy integration

- [x] Create ZeroEntropy client configuration
  - Set up ZeroEntropy client singleton in `src/lib/zeroentropy/client.ts`
  - Implement authentication and API key management
  - Add error handling and retry logic for API calls

#### Task 1.2: Database Schema Updates for ZeroEntropy Integration
- [x] Update videos table for ZeroEntropy metadata
  - Add `zeroentropy_collection_id` field to store the ZeroEntropy collection ID
  - Keep existing video metadata (title, duration, etc.) for display purposes

- [x] Update video status enum for ZeroEntropy processing
  - Add `ZEROENTROPY_PROCESSING` status to video_status enum (covers collection creation + indexing)
  - Update existing status flow to include ZeroEntropy processing steps
  - Ensure backward compatibility with existing video records

- [x] Add ZeroEntropy metadata fields to videos table
  - Add `zeroentropy_collection_id` field to videos table

### Phase 2: Transcript Processing and Metadata Generation

#### Task 2.1: Direct Transcript Processing
- [x] Create transcript processing utilities in `src/lib/zeroentropy/transcript.ts`
  - Use raw transcript segments directly from YouTube (no preprocessing)
  - Implement basic validation for transcript quality and completeness
  - Add error handling for malformed transcript data
  - Add logging for transcript processing metrics

- [x] Implement transcript segment handling
  - Create `processTranscriptSegments()` function that takes raw transcript and formats for ZeroEntropy
  - Ensure each segment preserves original start/end timestamps from YouTube
  - Handle edge cases like very short segments or missing timestamps
  - Add basic validation for segment data integrity

#### Task 2.2: Timestamp Mapping and Metadata Generation
- [x] Create simplified segment metadata utilities in `src/lib/zeroentropy/segment-metadata.ts`
  - Use original timestamps from YouTube transcript (no modification)
  - Add functions to convert seconds to MM:SS format for display
  - Create utilities to handle any missing or malformed timestamps
  - Add basic validation for timestamp data

- [x] Implement metadata generation for ZeroEntropy pages
  - Create `generateSegmentMetadata()` function with video context
  - Include video ID, title, channel name, duration, and segment timestamps
  - Add user ID for proper collection scoping
  - Ensure metadata is consistent with ZeroEntropy requirements

### Phase 3: ZeroEntropy Collection and Page Management

#### Task 3.1: Collection Management System
- [x] Create collection management utilities in `src/lib/zeroentropy/collections.ts`
  - Implement `createUserCollection()` function for user-scoped collections (1 collection per user)
  - Add `getCollection()` and `deleteCollection()` functions
  - Implement collection naming convention: `user-{userId}-videos` (contains all user's videos)
  - Add error handling for collection operations

- [x] Implement collection lifecycle management
  - Create functions to check if collection exists before creating
  - Add cleanup functions for orphaned collections (when user deletes account)
  - Implement collection metadata storage in Supabase (store collection ID in videos table)
  - Add monitoring for collection health and usage

#### Task 3.2: Page-Based Indexing System
- [x] Create page indexing utilities in `src/lib/zeroentropy/pages.ts`
  - Implement `indexTranscriptPage()` function for individual segments (adds to user's collection)
  - Add `batchIndexPages()` function for efficient bulk indexing of all video segments
  - Create page update and deletion functions (for video updates/removals)
  - Add retry logic for failed indexing operations

- [x] Implement page metadata and content structure
  - Define page content structure with transcript text and video metadata
  - Include videoId, title, channel, timestamps in each page for proper citations and filtering
  - Implement page ID generation: `{videoId}-{segmentIndex}` for easy identification
  - Add validation for page content before indexing
  - Ensure videoId is easily accessible for user's video scoping feature

### Phase 4: Inngest Pipeline Integration

#### Task 4.1: Extend Video Processing Pipeline
- [x] Update `process-video.ts` Inngest function in `src/lib/inngest/functions/process-video.ts`
  - Add ZeroEntropy processing steps after transcript extraction (1 job = 1 video)
  - Implement `processTranscriptSegmentsForZeroEntropy()` step function for single video processing
  - Add error handling and status updates for ZeroEntropy operations
  - Update video status flow: `TRANSCRIPT_EXTRACTING → ZEROENTROPY_PROCESSING → READY`

- [x] Create ZeroEntropy processing step functions for single video
  - Implement `ensureUserCollection()` step (create collection if doesn't exist)
  - Add `processTranscriptSegments()` step for direct transcript processing of current video
  - Create `indexVideoTranscriptPages()` step for adding video segments to user's collection
  - Add `validateVideoIndexing()` step for quality assurance of single video

- [x] Add comprehensive error handling and retry logic
  - Implement retry logic for ZeroEntropy API failures
  - Add error logging and monitoring for processing steps
  - Create fallback mechanisms for failed indexing operations
  - Add status rollback for failed ZeroEntropy processing

#### Task 4.2: Status Management and Real-time Updates
- [x] Update video status management for ZeroEntropy processing
  - Add new status transitions: `TRANSCRIPT_EXTRACTING → ZEROENTROPY_PROCESSING → READY`
  - Implement status update functions for ZeroEntropy processing (collection + indexing)
  - Add error status handling for ZeroEntropy failures
  - Ensure real-time updates via Supabase Realtime

- [x] Implement progress tracking and monitoring
  - Add progress indicators for ZeroEntropy processing steps
  - Create monitoring for processing time and success rates
  - Add alerts for failed processing operations
  - Implement retry mechanisms for failed operations

### Phase 5: Search Implementation (Basic)

#### Task 5.1: Semantic Search Implementation
- [ ] Create search utilities in `src/lib/zeroentropy/search.ts`
  - Implement `searchTranscripts()` function for semantic search across user's collection
  - Add `searchTranscriptsByVideos()` function for scoped search (specific videoIds)
  - Add query preprocessing and optimization
  - Create result ranking and relevance scoring
  - Add support for filtering by videoId metadata (user's video scoping feature)

- [ ] Implement search result processing
  - Create functions to format search results with timestamps
  - Add video context and metadata to search results
  - Implement result deduplication and ranking
  - Add support for pagination and result limiting

#### Task 5.2: Search Testing and Validation
- [ ] Create search testing utilities
  - Add functions to test search functionality with sample queries
  - Create validation for search result accuracy and completeness
  - Add performance testing for search operations
  - Implement search result logging and monitoring

- [ ] Add search debugging tools
  - Create utilities to inspect ZeroEntropy collections and pages
  - Add functions to validate search index integrity
  - Implement search query analysis and optimization tools
  - Add monitoring for search performance and success rates

### Phase 6: Testing and Quality Assurance

#### Task 6.1: Unit Testing
- [ ] Create unit tests for ZeroEntropy utilities
  - Test transcript processing and segment handling functions
  - Add tests for timestamp mapping and metadata generation
  - Create tests for collection and page management
  - Add tests for search and RAG functionality

- [ ] Implement integration tests
  - Test complete video processing pipeline with ZeroEntropy
  - Add tests for error handling and retry logic
  - Create tests for multi-tenant data isolation
  - Add performance tests for large transcript processing

#### Task 6.2: End-to-End Testing
- [ ] Create end-to-end test scenarios
  - Test complete user flow from video upload to AI response
  - Add tests for different video types and transcript qualities
  - Create tests for error scenarios and edge cases
  - Add tests for concurrent processing and scaling

- [ ] Implement monitoring and observability
  - Add logging for all ZeroEntropy operations
  - Create metrics for processing time and success rates
  - Add alerts for system health and performance
  - Implement debugging tools for transcript processing

### Phase 7: Deployment and Production Readiness

#### Task 7.1: Production Configuration
- [ ] Configure ZeroEntropy for production environment
  - Set up production API keys and authentication
  - Configure rate limiting and usage monitoring
  - Add production-specific error handling and logging
  - Implement backup and recovery procedures

- [ ] Update deployment configuration
  - Add ZeroEntropy environment variables to production
  - Update Vercel deployment configuration
  - Add monitoring and alerting for ZeroEntropy operations
  - Create rollback procedures for failed deployments

#### Task 7.2: Performance Optimization
- [ ] Optimize processing performance
  - Implement batch processing for multiple videos
  - Add caching for frequently accessed collections
  - Optimize database queries and indexing
  - Add performance monitoring and optimization

- [ ] Implement scaling and reliability
  - Add horizontal scaling for video processing
  - Implement circuit breakers for ZeroEntropy API calls
  - Add data consistency checks and validation
  - Create disaster recovery procedures

---

**Note:** Each task should be completed and tested before moving to the next phase. After completing each top-level task, pause to confirm the implementation is correct before proceeding to the next task.
