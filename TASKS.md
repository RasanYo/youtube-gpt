# Add Video Transcript Extraction to Inngest - Implementation Plan

## 🧠 Context about Project

YouTube-GPT is an AI-powered YouTube knowledge base that transforms hours of video content into an instantly searchable, intelligent assistant. The platform serves content creators, researchers, students, and professionals who need to efficiently extract, search, and repurpose information from their personal video libraries. The system uses a three-column ChatGPT-style interface with conversation history, AI chat, and knowledge base management. Built on Next.js 14 with Supabase for authentication and database, the platform currently supports YouTube video ingestion with metadata fetching through Supabase Edge Functions. The system is in active development with core authentication, UI components, and video ingestion working (PENDING → QUEUED status flow), but lacks the automated processing pipeline that would transform raw video metadata into searchable, AI-ready content through transcript extraction and vector embeddings.

## 🏗️ Context about Feature

The video transcript extraction feature sits at the critical junction between video ingestion and AI processing in the YouTube-GPT pipeline. Currently, when users add YouTube videos or channels, the system successfully fetches metadata (title, thumbnail, duration, channel info) and stores it in the `videos` table with status tracking (PENDING → QUEUED → PROCESSING → READY/FAILED). The PENDING → QUEUED transition is fully implemented and working correctly. However, there's a gap between the QUEUED status and the next processing step - transcript extraction and vector embedding generation. The feature must integrate with the existing Inngest background job system in `src/lib/inngest/functions/process-video.ts`, leverage the current video status pipeline, and work alongside the real-time status updates already implemented in the frontend. The system needs to detect when a video transitions to 'QUEUED' status and automatically queue it for transcript processing without manual intervention, creating a seamless event-driven pipeline that scales with user activity. We'll use the `youtube-transcript-plus` package which provides advanced features like built-in TypeScript support, comprehensive error handling, caching capabilities, and better reliability compared to the basic youtube-transcript package.

## 🎯 Feature Vision & Flow

The desired end-to-end behavior creates a fully automated video processing pipeline where users simply paste YouTube URLs and the system handles everything else. When a video's metadata is successfully fetched and stored, the system automatically detects this status change and triggers an Inngest job for transcript extraction. The job processes the video's transcript using the youtube-transcript-plus library, generates vector embeddings for semantic search, and updates the video status to 'READY' for AI queries. Users see real-time status updates in the Knowledge Base panel, from "Processing metadata..." to "Extracting transcript..." to "Ready for AI queries." The system handles both single videos and batch channel processing, with proper error handling and retry mechanisms for failed jobs. The entire flow is invisible to users - they add videos and can immediately start asking AI questions about their content once processing completes.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Package Installation and Dependencies
- [x] **1.1 Install youtube-transcript-plus package**
  - Run `pnpm add youtube-transcript-plus` to install the npm package
  - Add package to dependencies in package.json
  - Verify installation with `pnpm list youtube-transcript-plus`

- [x] **1.2 TypeScript types are included**
  - youtube-transcript-plus includes built-in TypeScript definitions
  - No additional type packages needed
  - Test type imports in the process-video.ts file

### Phase 2: Enhance Inngest Function with Transcript Extraction
- [x] **2.1 Add transcript extraction step to process-video.ts**
  - Import fetchTranscript from youtube-transcript-plus at the top of the file
  - Add new step after status update: 'extract-transcript'
  - Implement transcript extraction using video.youtubeId with proper error handling
  - Use the advanced error handling provided by youtube-transcript-plus

- [x] **2.2 Implement comprehensive error handling**
  - Use youtube-transcript-plus specific error types:
    - YoutubeTranscriptVideoUnavailableError
    - YoutubeTranscriptDisabledError
    - YoutubeTranscriptNotAvailableError
    - YoutubeTranscriptNotAvailableLanguageError
  - Handle network errors and API rate limiting
  - Add retry logic for transient failures

- [x] **2.3 Add transcript validation and processing**
  - Validate transcript length and quality using youtube-transcript-plus response format
  - Clean and format transcript text from TranscriptResponse[] format
  - Add transcript metadata (length, language, quality score) from response properties
  - Store transcript in function response for next processing step

### Phase 3: Update Video Status Pipeline
- [x] **3.1 Add new video status for transcript processing**
  - Add 'TRANSCRIPT_EXTRACTING' status to video_status enum in database
  - Update Supabase migration to include new status
  - Update TypeScript types to include new status

- [ ] **3.2 Update status transitions in Inngest function**
  - Add step to update status to 'TRANSCRIPT_EXTRACTING' before extraction
  - Handle status rollback on transcript extraction failures
  - Add proper error status updates

### Phase 4: Add Comprehensive Logging and Monitoring
- [ ] **4.1 Enhance logging throughout transcript extraction**
  - Add detailed console logs for each step of transcript extraction
  - Log transcript metadata (length, language, quality)
  - Add error logging with context and stack traces
  - Include timing information for performance monitoring

- [ ] **4.2 Add transcript extraction metrics**
  - Track success/failure rates for transcript extraction
  - Monitor processing times and performance
  - Add alerts for high failure rates or performance issues
  - Create debugging tools for troubleshooting transcript issues

### Phase 5: Testing and Validation
- [ ] **5.1 Unit testing for transcript extraction**
  - Write tests for youtube-transcript-plus integration
  - Test error handling with various failure scenarios using specific error types
  - Test transcript validation and processing logic with TranscriptResponse[] format
  - Ensure proper test coverage for all new functionality

- [ ] **5.2 Integration testing**
  - Test end-to-end flow from video ingestion to transcript extraction
  - Validate status updates in real-time with Supabase
  - Test with various YouTube video types and formats
  - Verify error handling and retry mechanisms work correctly

- [ ] **5.3 Performance testing**
  - Test transcript extraction with various video lengths
  - Monitor memory usage and processing times
  - Test concurrent video processing scenarios
  - Optimize performance based on test results


## Reference
- [youtube-transcript-plus GitHub Repository](https://github.com/ericmmartin/youtube-transcript-plus)
- [youtube-transcript-plus npm package](https://www.npmjs.com/package/youtube-transcript-plus)