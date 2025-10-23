# Inngest Function for Video Database Entry Creation - Implementation Plan

## 🧠 Context about Project
This is a YouTube-GPT application that helps users search and extract information from YouTube videos. The system uses Next.js with Prisma for database operations, Supabase for authentication, Inngest for background job processing, and is designed to create a searchable knowledge base from YouTube content. Currently, the application has a working URL detection system that can identify video and channel URLs, but only logs the extracted IDs to the console.

## 🏗️ Context about Feature
The current implementation in `src/lib/youtube/api.ts` successfully detects YouTube URLs and extracts video/channel IDs, but lacks database persistence. We need to create an Inngest function that handles the background processing of video database entry creation. The Video model in the Prisma schema requires a userId, youtubeId, title, channelName, and duration - but we only have the youtubeId from URL detection. We need to create a minimal video record with just the ID and QUEUED status, with placeholder values for required fields that will be populated later during the full ingestion process.

## 🎯 Feature Vision & Flow
When a user submits a YouTube URL through the KnowledgeBase component, the system should:
1. Detect and extract the YouTube ID (already working)
2. Get the current authenticated user ID from Supabase
3. Trigger an Inngest function with type (video/channel) and ID
4. The Inngest function creates a new Video record in the database with:
   - youtubeId: extracted from URL
   - userId: current authenticated user
   - status: QUEUED
   - placeholder values for required fields (title, channelName, duration)
5. Return success/failure to the UI
6. The record will be updated later during full ingestion with real metadata
7. For channel types, the function should ignore and do nothing for now

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Create Database Service Function
- [ ] Create `src/lib/database/video.ts` with `createQueuedVideo` function
  - [ ] Import Prisma client and VideoStatus enum
  - [ ] Accept parameters: youtubeId (string), userId (string)
  - [ ] Create video record with placeholder values for required fields
  - [ ] Handle duplicate youtubeId errors gracefully
  - [ ] Return success/error result object

### Task 2: Create Inngest Function for Video Processing
- [ ] Create `src/lib/inngest/functions/video-processing.ts`
  - [ ] Import Inngest client and database service function
  - [ ] Define function with event name `youtube.process`
  - [ ] Accept event data: `{ type: 'video' | 'channel', id: string, userId: string }`
  - [ ] Handle video type: call `createQueuedVideo` with id and userId
  - [ ] Handle channel type: log and do nothing (ignore for now)
  - [ ] Add proper error handling and logging
  - [ ] Return success/error status

### Task 3: Update Inngest Configuration
- [ ] Modify `api/inngest.ts` to register the new function
  - [ ] Import the new video processing function
  - [ ] Add function to the Inngest client configuration
  - [ ] Ensure proper error handling for function registration

### Task 4: Update YouTube API to Trigger Inngest Function
- [ ] Modify `src/lib/youtube/api.ts` to trigger Inngest function
  - [ ] Import Inngest client
  - [ ] Import `getCurrentUser` from Supabase auth
  - [ ] Update `processYouTubeUrl` to send event to Inngest after URL detection
  - [ ] Handle authentication errors (user not logged in)
  - [ ] Handle Inngest event sending errors
  - [ ] Maintain existing console logging for debugging

### Task 5: Update UI to Handle Inngest Results
- [ ] Modify `src/components/KnowledgeBase.tsx` to show Inngest-specific feedback
  - [ ] Update success message to indicate video was queued for processing
  - [ ] Update error handling to show Inngest-specific errors
  - [ ] Add loading state during Inngest event sending
  - [ ] Consider showing video ID in success message

### Task 6: Add Error Handling and Validation
- [ ] Add proper error handling for edge cases
  - [ ] Handle case where user is not authenticated
  - [ ] Handle Inngest service unavailability
  - [ ] Add input validation for youtubeId format
  - [ ] Add database connection error handling in Inngest function
  - [ ] Handle duplicate video submissions (same youtubeId for same user)

### Task 7: Testing and Verification
- [ ] Test the complete flow with valid YouTube URLs
  - [ ] Test with authenticated user
  - [ ] Test with unauthenticated user (should show error)
  - [ ] Test duplicate video submission
  - [ ] Verify Inngest function processes events correctly
  - [ ] Verify database records are created correctly
  - [ ] Test error scenarios and UI feedback
  - [ ] Test channel type handling (should be ignored)
