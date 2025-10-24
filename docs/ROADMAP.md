# 🗺️ Bravi YouTube AI - GitHub Issues Roadmap (Step 2)

This document contains actionable GitHub issues for **Step 2 – YouTube Ingestion Foundations** of the Bravi YouTube AI development roadmap. Each sub-step has been converted into a structured GitHub issue with clear acceptance criteria, dependencies, and time estimates.

## 📊 Project Overview

**Goal**: Build the backend ingestion system with real-time state management via Inngest and Supabase Realtime, enabling users to add YouTube videos and channels to their knowledge base.

**Tech Stack**:

- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js Server Actions, Supabase (Auth + PostgreSQL + Realtime)
- Background Jobs: Inngest
- APIs: YouTube Data API v3
- Deployment: Vercel

**Step 2 Estimated Time**: ~2 hours

**Prerequisites**: Step 1 must be completed (project setup, authentication, database, and deployment)

---

## 📋 Table of Contents

**Step 2 – YouTube Ingestion Foundations** (~2 hours)

1. [Issue #12: YouTube Data API Setup](#issue-12-21---youtube-data-api-setup)
2. [Issue #13: Inngest Setup](#issue-13-22---inngest-setup)
3. [Issue #14: Video Detection Utils](#issue-14-23---video-detection-utils)
4. [Issue #15: Server Action - Add YouTube Content](#issue-15-24---server-action---add-youtube-content)
5. [Issue #16: Inngest Function - Video Ingestion](#issue-16-25---inngest-function---video-ingestion)
6. [Issue #17: Retry Mechanism](#issue-17-26---retry-mechanism)
7. [Issue #18: Supabase Realtime Setup](#issue-18-27---supabase-realtime-setup)
8. [Issue #19: Knowledge Base UI](#issue-19-28---knowledge-base-ui)
9. [Issue #20: Basic Observability](#issue-20-29---basic-observability)
10. [Issue #21: Testing & Deployment](#issue-21-210---testing--deployment)

---

## 🎯 GitHub Issues

### Issue #12: 2.1 - YouTube Data API Setup

**Branch Name:** `feature/2.1-youtube-api-setup`

**Labels:** `backend`, `api`, `Step 2`, `priority: high`

**Estimated Time:** ~10 minutes (part of Step 2: 2 hours total)

**Dependencies:** All Step 1 issues

#### 🎯 Description

Set up YouTube Data API v3 integration to fetch video and channel metadata. This enables the application to retrieve information about YouTube videos and channels that users want to add to their knowledge base.

#### ✅ Acceptance Criteria

- [ ] Create project on [Google Cloud Console](https://console.cloud.google.com)
- [ ] Enable YouTube Data API v3 in the APIs & Services section
- [ ] Create API key and copy it for environment variables
- [ ] Add `YOUTUBE_API_KEY` to `.env.local`:
  ```bash
  YOUTUBE_API_KEY=your_youtube_api_key_here
  ```
- [ ] Add `YOUTUBE_API_KEY` to Vercel environment variables
- [ ] Install YouTube package:
  ```bash
  npm install youtube-transcript
  ```
- [ ] Verify API key works by testing a simple API call

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: All Step 1 issues
- Followed by: Issue #13 (2.2 - Inngest Setup)

---

### Issue #13: 2.2 - Inngest Setup

**Branch Name:** `feature/2.2-inngest-setup`

**Labels:** `backend`, `background-jobs`, `infrastructure`, `Step 2`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #12 (YouTube Data API Setup)

#### 🎯 Description

Set up Inngest for background job processing. Inngest will handle video ingestion workflows asynchronously, allowing the app to process videos without blocking the user interface.

#### ✅ Acceptance Criteria

- [ ] Create account on [inngest.com](https://www.inngest.com)
- [ ] Install Inngest SDK:
  ```bash
  npm install inngest
  ```
- [ ] Create Inngest client `lib/inngest/client.ts`:
  ```typescript
  import { Inngest } from 'inngest'
  export const inngest = new Inngest({
    id: 'bravi-youtube-ai',
    eventKey: process.env.INNGEST_EVENT_KEY,
  })
  ```
- [ ] Create route handler `app/api/inngest/route.ts`:
  ```typescript
  import { serve } from 'inngest/next'
  import { inngest } from '@/lib/inngest/client'
  import { functions } from '@/lib/inngest/functions'

  export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [functions.handleVideoIngestion],
  })
  ```
- [ ] Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` to `.env.local`
- [ ] Configure webhook in Inngest Dashboard pointing to `/api/inngest`
- [ ] Verify webhook connection is successful

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #12 (2.1 - YouTube Data API Setup)
- Followed by: Issue #14 (2.3 - Video Detection Utils)

---

### Issue #14: 2.3 - Video Detection Utils

**Branch Name:** `feature/2.3-video-detection`

**Labels:** `backend`, `utilities`, `Step 2`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #12 (YouTube Data API Setup)

#### 🎯 Description

Create utility functions to detect YouTube URL types (video vs channel) and extract IDs. Also implement functions to fetch video metadata and channel videos using the YouTube Data API.

#### ✅ Acceptance Criteria

- [ ] Create `lib/youtube/detector.ts` with URL detection logic:
  ```typescript
  export function detectYouTubeType(url: string): {
    type: 'video' | 'channel' | 'invalid'
    id: string | null
  } {
    // Regex to detect video ID (v=...)
    // Regex to detect channel (/@handle or /channel/ID)
    // Return type + extracted ID
  }
  ```
- [ ] Create `lib/youtube/api.ts` for fetching metadata:
  ```typescript
  // Note: This will use YouTube Data API v3 directly instead of youtube-sr
  // The youtube-transcript package is used for transcription only

  export async function getVideoMetadata(videoId: string) {
    // Fetch title, thumbnail, duration, channelName using YouTube Data API v3
  }

  export async function getChannelVideos(channelId: string, limit = 10) {
    // Fetch latest N videos from channel using YouTube Data API v3
  }
  ```
- [ ] Test detection functions with various YouTube URLs:
  - Standard video URL: `https://www.youtube.com/watch?v=VIDEO_ID`
  - Short URL: `https://youtu.be/VIDEO_ID`
  - Channel URL with handle: `https://www.youtube.com/@channelhandle`
  - Channel URL with ID: `https://www.youtube.com/channel/CHANNEL_ID`
- [ ] Verify metadata fetching returns correct information
- [ ] Add error handling for invalid URLs and API failures

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #12 (2.1 - YouTube Data API Setup)
- Followed by: Issue #15 (2.4 - Server Action: Add YouTube Content)

---

### Issue #15: 2.4 - Server Action: Add YouTube Content

**Branch Name:** `feature/2.4-add-youtube-content`

**Labels:** `backend`, `server-actions`, `Step 2`, `priority: high`

**Estimated Time:** ~20 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #14 (Video Detection Utils), Issue #13 (Inngest Setup)

#### 🎯 Description

Create a Server Action that handles adding YouTube videos or channels to the user's knowledge base. This action will detect the URL type, create database records, and trigger Inngest background jobs for processing.

#### ✅ Acceptance Criteria

- [ ] Install zod for URL validation:
  ```bash
  npm install zod
  ```
- [ ] Create `app/actions/youtube.ts` with `addYouTubeContent` function that:
  - Authenticates the user
  - Detects URL type (video or channel)
  - For videos: Creates Video record with status PENDING, fetches metadata, then updates to QUEUED
  - For channels: Fetches latest 10 videos, creates records for each, and emits events
  - Returns success with video count
- [ ] Add input validation with zod to ensure valid YouTube URLs
- [ ] Handle error cases:
  - Unauthorized users
  - Invalid URLs
  - Duplicate videos (already in KB)
  - API failures
- [ ] Test adding single video URL
- [ ] Test adding channel URL
- [ ] Verify database records are created correctly
- [ ] Verify Inngest events are emitted

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #14 (2.3 - Video Detection Utils), Issue #13 (2.2 - Inngest Setup)
- Followed by: Issue #16 (2.5 - Inngest Function: Video Ingestion)

---

### Issue #16: 2.5 - Inngest Function: Video Ingestion

**Branch Name:** `feature/2.5-video-ingestion-function`

**Labels:** `backend`, `inngest`, `background-jobs`, `Step 2`, `priority: high`

**Estimated Time:** ~20 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #15 (Server Action: Add YouTube Content)

#### 🎯 Description

Create the Inngest function that processes video ingestion in the background. This function will update video status, fetch metadata from YouTube, and save it to the database.

#### ✅ Acceptance Criteria

- [ ] Create `lib/inngest/functions/video-ingestion.ts` with `handleVideoIngestion` function that:
  - Listens for `video.ingest.requested` events
  - Step 1: Updates video status to PROCESSING (from QUEUED)
  - Step 2: Fetches video transcript from YouTube
  - Step 3: Generates vector embeddings from transcript
  - Step 4: Updates status to READY on success or FAILED on error
  - Includes proper error handling and logging
- [ ] Create `lib/inngest/functions/index.ts` to export all functions
- [ ] Register the function in `app/api/inngest/route.ts`
- [ ] Test ingestion with Inngest Dev Server:
  ```bash
  npx inngest-cli dev
  ```
- [ ] Verify each step executes correctly
- [ ] Verify error cases update status to FAILED with error message
- [ ] Check Inngest dashboard shows function execution history

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #15 (2.4 - Server Action: Add YouTube Content)
- Followed by: Issue #17 (2.6 - Retry Mechanism)

---

### Issue #17: 2.6 - Retry Mechanism

**Branch Name:** `feature/2.6-retry-mechanism`

**Labels:** `backend`, `error-handling`, `Step 2`, `priority: medium`

**Estimated Time:** ~10 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #16 (Inngest Function: Video Ingestion)

#### 🎯 Description

Implement retry functionality for failed video ingestions. Users should be able to retry processing videos that failed due to temporary errors (API rate limits, network issues, etc.).

#### ✅ Acceptance Criteria

- [ ] Create Server Action `retryVideoIngestion` in `app/actions/youtube.ts`:
  ```typescript
  'use server'
  export async function retryVideoIngestion(videoId: string) {
  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single()
  
  if (fetchError || !video) throw new Error('Video not found')

  const { error: updateError } = await supabase
    .from('videos')
    .update({ status: 'QUEUED', error: null })
    .eq('id', videoId)
    })

    await inngest.send({
      name: 'video.ingest.requested',
      data: { videoId, youtubeId: video.youtubeId },
    })
  }
  ```
- [ ] Add authorization check to ensure users can only retry their own videos
- [ ] Test retry functionality with a failed video
- [ ] Verify status changes from FAILED → QUEUED → PROCESSING → READY
- [ ] Verify error message is cleared on retry

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #16 (2.5 - Inngest Function: Video Ingestion)
- Followed by: Issue #18 (2.7 - Supabase Realtime Setup)

---

### Issue #18: 2.7 - Supabase Realtime Setup

**Branch Name:** `feature/2.7-supabase-realtime`

**Labels:** `backend`, `frontend`, `supabase`, `realtime`, `Step 2`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #16 (Inngest Function: Video Ingestion)

#### 🎯 Description

Set up Supabase Realtime to enable real-time video status updates in the UI. Users will see video ingestion progress update automatically without needing to refresh the page.

#### ✅ Acceptance Criteria

- [ ] Enable Realtime in Supabase Dashboard > Database > Replication
- [ ] Add publication for `Video` table
- [ ] Create React hook `hooks/useRealtimeVideos.ts` that:
  - Fetches initial videos for the user
  - Subscribes to real-time changes (INSERT, UPDATE) on Video table
  - Filters by current user ID
  - Updates state automatically when videos change
  - Cleans up subscription on unmount
- [ ] Test real-time updates by:
  - Adding a new video and seeing it appear immediately
  - Watching status change from PENDING → QUEUED → PROCESSING → READY
  - Verifying multiple browser tabs stay in sync
- [ ] Verify subscription cleanup prevents memory leaks

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #16 (2.5 - Inngest Function: Video Ingestion)
- Followed by: Issue #19 (2.8 - Knowledge Base UI)

---

### Issue #19: 2.8 - Knowledge Base UI

**Branch Name:** `feature/2.8-knowledge-base-ui`

**Labels:** `frontend`, `ui`, `Step 2`, `priority: high`

**Estimated Time:** ~20 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #18 (Supabase Realtime Setup), Issue #17 (Retry Mechanism)

#### 🎯 Description

Build the Knowledge Base UI components in the right column, including video input, video cards with status badges, and video list with real-time updates.

#### ✅ Acceptance Criteria

- [ ] Create `components/kb/VideoInput.tsx` with:
  - Input field for pasting YouTube URLs
  - Submit button with loading state
  - Form validation
  - Success/error toast notifications
- [ ] Create `components/kb/VideoCard.tsx` with:
  - Video thumbnail
  - Title and channel name
  - Status badge with color coding (PENDING=yellow, QUEUED=gray, PROCESSING=blue, READY=green, FAILED=red)
  - Retry button for failed videos
  - Duration and creation date
- [ ] Create `components/kb/VideoList.tsx` with:
  - Integration with `useRealtimeVideos` hook
  - Empty state when no videos exist
  - Proper loading states
  - Video cards displayed in reverse chronological order
- [ ] Integrate all components into `components/layout/KnowledgeBase.tsx`
- [ ] Test video addition flow end-to-end
- [ ] Verify real-time status updates display correctly
- [ ] Test retry button functionality
- [ ] Ensure responsive design

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #18 (2.7 - Supabase Realtime Setup), Issue #17 (2.6 - Retry Mechanism)
- Followed by: Issue #20 (2.9 - Basic Observability)

---

### Issue #20: 2.9 - Basic Observability

**Branch Name:** `feature/2.9-observability`

**Labels:** `frontend`, `observability`, `Step 2`, `priority: medium`

**Estimated Time:** ~10 minutes (part of Step 2: 2 hours total)

**Dependencies:** Issue #19 (Knowledge Base UI)

#### 🎯 Description

Add basic observability features including metrics footer in the Knowledge Base and logging for Inngest events to help monitor system health and debug issues.

#### ✅ Acceptance Criteria

- [ ] Create `components/kb/MetricsFooter.tsx` component that displays:
  - Total number of videos
  - Number of failed videos (if any)
  - Last ingestion timestamp
  - Format timestamps with relative time (e.g., "2 minutes ago")
- [ ] Add metrics footer to bottom of Knowledge Base column
- [ ] Add console logging in Inngest functions with timestamps:
  - Log when video ingestion starts
  - Log when each step completes
  - Log errors with context
- [ ] Test metrics update correctly as videos are added/processed
- [ ] Verify logs appear in Inngest dashboard
- [ ] Style metrics footer to be subtle but readable

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: Issue #19 (2.8 - Knowledge Base UI)
- Followed by: Issue #21 (2.10 - Testing & Deployment)

---

### Issue #21: 2.10 - Testing & Deployment

**Branch Name:** `feature/2.10-testing-deployment`

**Labels:** `testing`, `deployment`, `Step 2`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 2: 2 hours total)

**Dependencies:** All previous Step 2 issues (Issues #12-#20)

#### 🎯 Description

Perform comprehensive testing of the complete ingestion flow and deploy Step 2 features to production. Verify all functionality works correctly in both development and production environments.

#### ✅ Acceptance Criteria

- [ ] **Local Testing:**
  - [ ] Test adding a single video URL
  - [ ] Test adding a channel URL (should add 10 videos)
  - [ ] Verify status updates in real-time (PENDING → QUEUED → PROCESSING → READY)
  - [ ] Test retry on a failed video
  - [ ] Verify thumbnails and metadata display correctly
  - [ ] Test with different YouTube URL formats
  - [ ] Check for console errors
- [ ] **Deployment:**
  - [ ] Push all Step 2 changes to GitHub
  - [ ] Deploy to Vercel
  - [ ] Add new environment variables to Vercel:
    - `YOUTUBE_API_KEY`
    - `INNGEST_EVENT_KEY`
    - `INNGEST_SIGNING_KEY`
  - [ ] Configure Inngest webhook in production (point to production URL)
  - [ ] Run database migrations on production if needed
- [ ] **Production Testing:**
  - [ ] Test complete ingestion flow in production
  - [ ] Verify real-time updates work in production
  - [ ] Monitor Inngest dashboard for job execution
  - [ ] Check Vercel logs for errors
  - [ ] Verify metrics display correctly
- [ ] **Verification:**
  - [ ] Confirm no breaking changes to Step 1 features
  - [ ] Verify authentication still works
  - [ ] Check page load performance

#### 🔗 Related

- Part of: **Step 2 – YouTube Ingestion Foundations**
- Depends on: All previous Step 2 issues (Issues #12-#20)
- Final issue of Step 2

---

## ✅ Step 2 - Expected Outcomes

After completing all issues in Step 2, you should have:

- ✅ Users can add YouTube videos/channels via input in KB column
- ✅ Automatic ingestion with real-time status updates (queued → processing → ready/failed)
- ✅ Retry functionality for failed videos
- ✅ Video list with thumbnails and metadata
- ✅ Mini-metrics displayed in KB footer
- ✅ Foundation ready for Step 3 (transcription & embeddings)

---

## 📝 Notes

- **Prerequisites**: Ensure Step 1 is fully completed before starting Step 2 issues
- **Time Management**: Step 2 has a total estimate of ~2 hours. Adjust individual issue times based on your experience level
- **Dependencies**: Issues should be completed in order (Issue #12 → #13 → #14, etc.) to maintain proper dependencies
- **Testing**: Always test locally before deploying to production
- **Git Workflow**: Create a new branch for each issue, commit regularly, and create pull requests for review
- **Real-time Updates**: Pay special attention to Supabase Realtime configuration for live status updates

---

**Generated from**: `docs/bravi_roadmap.md` (Step 2 only)
**Project**: Bravi YouTube AI - Founding Engineer Technical Assessment
**Last Updated**: 2025-10-22
