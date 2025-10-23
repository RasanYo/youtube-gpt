# YouTube Metadata Fetcher Implementation Plan

## 🧠 Context about Project

**Brief Summary (10–15 lines):**
YouTube-GPT is a full-stack AI-powered YouTube search application that transforms hours of video content into an instantly searchable knowledge base. The platform allows users to add individual videos or entire channels, search across their personal video library, and get AI-powered answers with citations and timestamps. Built with Next.js 14, Supabase, and Prisma, the system uses background job processing via Inngest for video ingestion, vector embeddings for semantic search, and Claude for AI-powered responses. The application features a three-column ChatGPT-style interface with conversation history, real-time chat, and a knowledge base explorer. Currently in the foundational development phase, we're building the core YouTube ingestion system that will enable users to add content to their searchable knowledge base.

## 🏗️ Context about Feature

**Platform Context (10–15 lines):**
The YouTube metadata fetcher is a critical component of the ingestion pipeline that sits between the URL detector (`detector.ts`) and the video processing system. It leverages the YouTube Data API v3 to fetch comprehensive metadata for both videos and channels, including titles, descriptions, thumbnails, channel information, and statistics. The feature integrates with the existing type system (`types.ts`) and will be used by Inngest background jobs to populate the database before transcript extraction and embedding generation. The implementation must handle API rate limits, error scenarios, and provide structured data that matches the Prisma schema for the Video model. It's designed to work seamlessly with the existing detector utility and will be exported through the main YouTube module index.

## 🎯 Feature Vision & Flow

**End-to-End Behavior (10–15 lines):**
When a user adds a YouTube URL, the system first uses the detector to identify whether it's a video or channel and extract the ID. The metadata fetcher then makes authenticated requests to the YouTube Data API v3 to retrieve comprehensive information about the resource. For videos, it fetches snippet data (title, description, thumbnails), content details (duration), and statistics (view count). For channels, it retrieves channel information, subscriber counts, and branding details. The fetched metadata is normalized into our internal types and returned to the calling service, which will store it in the database and trigger the next step in the ingestion pipeline. The system handles API errors gracefully and provides detailed error information for debugging and user feedback.

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Create YouTube API Client Module
- [ ] **1.1** Create `src/lib/youtube/api.ts` file with basic structure and imports
  - Import axios for HTTP requests
  - Import existing types from `types.ts`
  - Add JSDoc comments for the main function
- [ ] **1.2** Implement `fetchVideoMetadata(id: string, apiKey: string)` function
  - Make GET request to `https://www.googleapis.com/youtube/v3/videos`
  - Request `snippet,contentDetails,statistics` parts
  - Handle response parsing and error cases
- [ ] **1.3** Implement `fetchChannelMetadata(id: string, apiKey: string)` function
  - Make GET request to `https://www.googleapis.com/youtube/v3/channels`
  - Request `snippet,statistics,brandingSettings` parts
  - Handle response parsing and error cases
- [ ] **1.4** Add comprehensive error handling and logging
  - Handle network errors, API errors, and rate limiting
  - Add detailed console logging for debugging
  - Return null on errors with proper error messages
- [ ] **1.5** **VERIFY**: Test API functions with real data
  - Run `node -e "const { fetchVideoMetadata } = require('./src/lib/youtube/api'); fetchVideoMetadata('dQw4w9WgXcQ', process.env.YOUTUBE_API_KEY).then(console.log)"`
  - Verify video metadata is returned with title, thumbnail, and duration

### Task 2: Create Data Transformation Utilities
- [ ] **2.1** Implement `transformVideoData(apiResponse: any): VideoMetadata` function
  - Map YouTube API response to our VideoMetadata interface
  - Convert duration from ISO 8601 to seconds and formatted string
  - Extract thumbnail URL from available sizes (prefer high quality)
  - Format view count and upload date appropriately
- [ ] **2.2** Implement `transformChannelData(apiResponse: any): ChannelMetadata` function
  - Map YouTube API response to our ChannelMetadata interface
  - Format subscriber count with appropriate suffixes (K, M, B)
  - Extract channel icon and verification status
  - Handle missing or null values gracefully
- [ ] **2.3** Add input validation and type guards
  - Validate API response structure before transformation
  - Add type guards to ensure data integrity
  - Handle edge cases like missing fields or unexpected data types
- [ ] **2.4** **VERIFY**: Test data transformation functions
  - Run `npm run build` to ensure TypeScript compilation succeeds
  - Verify no type errors in the transformation functions

### Task 3: Create Main API Interface
- [ ] **3.1** Implement `getVideoMetadata(id: string, apiKey: string): Promise<VideoMetadata | null>` function
  - Call fetchVideoMetadata and transformVideoData
  - Handle all error cases and return null on failure
  - Add proper TypeScript typing and JSDoc documentation
- [ ] **3.2** Implement `getChannelMetadata(id: string, apiKey: string): Promise<ChannelMetadata | null>` function
  - Call fetchChannelMetadata and transformChannelData
  - Handle all error cases and return null on failure
  - Add proper TypeScript typing and JSDoc documentation
- [ ] **3.3** Create `processYouTubeUrl(url: string, apiKey: string): Promise<YouTubeProcessResult>` function
  - Use detector to identify URL type and extract ID
  - Call appropriate metadata function based on type
  - Return structured result with success/error status
  - Handle unknown URL types and API failures
- [ ] **3.4** **VERIFY**: Test main API interface
  - Run `node -e "const { processYouTubeUrl } = require('./src/lib/youtube/api'); processYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', process.env.YOUTUBE_API_KEY).then(console.log)"`
  - Verify complete workflow returns structured VideoMetadata object

### Task 4: Update Module Exports
- [ ] **4.1** Update `src/lib/youtube/index.ts` to export new functions
  - Export `getVideoMetadata`, `getChannelMetadata`, and `processYouTubeUrl`
  - Ensure all types are properly exported
  - Add JSDoc comments for the module
- [ ] **4.2** Verify all imports work correctly
  - Test imports in other parts of the application
  - Ensure no circular dependencies exist
  - Validate TypeScript compilation
- [ ] **4.3** **VERIFY**: Test module exports
  - Run `node -e "const { getVideoMetadata } = require('./src/lib/youtube'); console.log(typeof getVideoMetadata)"`
  - Verify all functions are properly exported and accessible

### Task 5: Create Unit Tests
- [ ] **5.1** Create `tests/unit/youtube/api.test.ts` test file
  - Test successful video metadata fetching with mock data
  - Test successful channel metadata fetching with mock data
  - Test error handling for invalid IDs and API failures
- [ ] **5.2** Test data transformation functions
  - Test `transformVideoData` with various API response formats
  - Test `transformChannelData` with different channel data structures
  - Test edge cases like missing fields or null values
- [ ] **5.3** Test main API interface functions
  - Test `processYouTubeUrl` with valid video URLs
  - Test `processYouTubeUrl` with valid channel URLs
  - Test error handling for invalid URLs and API failures
- [ ] **5.4** Add mock data and test utilities
  - Create sample YouTube API responses for testing
  - Add helper functions for setting up test scenarios
  - Ensure tests are isolated and don't make real API calls

### Task 6: Environment Configuration
- [ ] **6.1** Add YouTube API key to environment variables
  - Add `YOUTUBE_API_KEY` to `.env.local` and `.env.example`
  - Document the API key requirement in README
  - Add validation for missing API key in the code
- [ ] **6.2** Create API key validation utility
  - Add function to validate API key format
  - Add runtime checks for API key availability
  - Provide helpful error messages for missing configuration
- [ ] **6.3** **VERIFY**: Test environment configuration
  - Run `echo $YOUTUBE_API_KEY` to verify API key is loaded
  - Run `npm run build` to ensure environment variables are properly configured

### Task 7: Integration Testing
- [ ] **7.1** Test with real YouTube URLs
  - Test with various video URL formats (watch, shorts, embed, youtu.be)
  - Test with different channel URL formats (channel, user, @handle)
  - Verify metadata accuracy and completeness
- [ ] **7.2** Test error scenarios
  - Test with invalid/private videos
  - Test with non-existent channels
  - Test with malformed URLs
  - Verify proper error handling and user feedback
- [ ] **7.3** Performance testing
  - Test API response times
  - Verify no memory leaks in long-running processes
  - Test concurrent requests handling

### Task 8: Documentation and Cleanup
- [ ] **8.1** Add comprehensive JSDoc documentation
  - Document all public functions with examples
  - Add usage examples for common scenarios
  - Document error handling and return types
- [ ] **8.2** Update project documentation
  - Update README with YouTube API setup instructions
  - Add API usage examples to documentation
  - Document environment variable requirements
- [ ] **8.3** Code cleanup and optimization
  - Remove any console.log statements used for debugging
  - Optimize API calls and data transformation
  - Ensure consistent code style and formatting
