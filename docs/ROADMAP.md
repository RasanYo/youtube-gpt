# 🗺️ Bravi YouTube AI - GitHub Issues Roadmap

This document contains actionable GitHub issues derived from the Bravi YouTube AI development roadmap. Each sub-step from the original roadmap has been converted into a structured GitHub issue with clear acceptance criteria, dependencies, and time estimates.

## 📊 Project Overview

**Goal**: Build an intelligent YouTube search app that helps users instantly find information hidden inside hours of video content.

**Tech Stack**:

- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js Server Actions, Supabase (Auth + PostgreSQL), Prisma ORM
- AI Services: Anthropic Claude, ZeroEntropy (embeddings), Inngest (background jobs)
- Deployment: Vercel

**Total Estimated Time**: 
- Step 1: ~2 hours
- Step 2: ~2 hours
- **Total (Steps 1-2)**: ~4 hours

---

## 📋 Table of Contents - Step 1

**Step 1 – Project Bootstrap & Skeleton Deployment** (~2 hours)

1. [Issue #1: Project Generation & Setup](#issue-1-11---project-generation--setup)
2. [Issue #2: Tailwind & Dark Mode Configuration](#issue-2-12---tailwind--dark-mode-configuration)
3. [Issue #3: shadcn/ui Installation](#issue-3-13---shadcnui-installation)
4. [Issue #4: Three-Column Layout](#issue-4-14---three-column-layout)
5. [Issue #5: Supabase Setup](#issue-5-15---supabase-setup)
6. [Issue #6: Authentication Setup](#issue-6-16---authentication-setup)
7. [Issue #7: Prisma & Database Setup](#issue-7-17---prisma--database-setup)
8. [Issue #8: Environment Variables](#issue-8-18---environment-variables)
9. [Issue #9: Infrastructure & Testing](#issue-9-19---infrastructure--testing)
10. [Issue #10: Vercel Deployment](#issue-10-110---vercel-deployment)
11. [Issue #11: UI Polish & Placeholders](#issue-11-111---ui-polish--placeholders)

---

## 🎯 GitHub Issues

### Issue #1: 1.1 - Project Generation & Setup

**Branch Name:** `feature/1.1-project-setup`

**Labels:** `setup`, `infrastructure`, `Step 1`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 1: 2 hours total)

**Dependencies:** None (first issue)

#### 🎯 Description

Set up the foundational Next.js project with TypeScript and Tailwind CSS, and initialize the GitHub repository. This is the first step in creating the Bravi YouTube AI application.

#### ✅ Acceptance Criteria

- [x] Create a new Next.js project with TypeScript using the following command:
  ```bash
  npx create-next-app@latest bravi-youtube-ai --typescript --tailwind --app --eslint
  cd bravi-youtube-ai
  ```
- [x] Initialize Git repository locally
- [x] Create GitHub repository using `gh` CLI:
  ```bash
  git init
  gh repo create bravi-youtube-ai --public --source=. --remote=origin
  ```
- [x] Push initial commit to GitHub:
  ```bash
  git add .
  git commit -m "Initial commit: Next.js setup"
  git push -u origin main
  ```
- [x] Configure `.gitignore` to include `.env`, `.env.local`, `node_modules`, `.next`

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Followed by: Issue #2 (1.2 - Tailwind & Dark Mode Configuration)

---

### Issue #2: 1.2 - Tailwind & Dark Mode Configuration

**Branch Name:** `feature/1.2-tailwind-dark-mode`

**Labels:** `styling`, `dark-mode`, `Step 1`, `priority: high`

**Estimated Time:** ~10 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #1 (Project Generation & Setup)

#### 🎯 Description

Configure Tailwind CSS with dark mode support and set up CSS variables for theming. This establishes the foundation for the application's visual design system with light/dark mode toggle capability.

#### ✅ Acceptance Criteria

- [x] Configure dark mode in `tailwind.config.ts`:
  ```typescript
  module.exports = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          border: 'hsl(var(--border))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          // ... shadcn colors
        },
      },
    },
  }
  ```
- [x] Add CSS variables in `app/globals.css` for both light and dark themes
- [x] Test the toggle between light and dark mode using Tailwind's class strategy
- [x] Verify that color variables work correctly in both modes

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #1 (1.1 - Project Generation & Setup)
- Followed by: Issue #3 (1.3 - shadcn/ui Installation)

---

### Issue #3: 1.3 - shadcn/ui Installation

**Branch Name:** `feature/1.3-shadcn-ui-setup`

**Labels:** `ui`, `components`, `Step 1`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #2 (Tailwind & Dark Mode Configuration)

#### 🎯 Description

Initialize shadcn/ui component library and install essential base components needed for the application. Also create a ThemeToggle component using next-themes for dark/light mode switching.

#### ✅ Acceptance Criteria

- [x] Initialize shadcn/ui:
  ```bash
  npx shadcn-ui@latest init
  ```
- [x] Install core shadcn/ui components:
  ```bash
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add input
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add tabs
  npx shadcn-ui@latest add sheet
  npx shadcn-ui@latest add dropdown-menu
  npx shadcn-ui@latest add avatar
  npx shadcn-ui@latest add toast
  npx shadcn-ui@latest add skeleton
  npx shadcn-ui@latest add checkbox
  npx shadcn-ui@latest add badge
  ```
- [x] Install next-themes for theme management:
  ```bash
  npm install next-themes
  ```
- [x] Create `ThemeToggle` component with next-themes integration
- [x] Verify that all imported components work correctly

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #2 (1.2 - Tailwind & Dark Mode Configuration)
- Followed by: Issue #4 (1.4 - Three-Column Layout)

---

### Issue #4: 1.4 - Three-Column Layout

**Branch Name:** `feature/1.4-three-column-layout`

**Labels:** `layout`, `frontend`, `ui`, `Step 1`, `priority: high`

**Estimated Time:** ~20 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #3 (shadcn/ui Installation)

#### 🎯 Description

Create the main three-column layout structure for the application: left sidebar for conversation history, center area for chat, and right sidebar for knowledge base. Implement responsive design with sticky headers.

#### ✅ Acceptance Criteria

- [ ] Create `app/layout.tsx` with three-column structure:
  ```typescript
  <div className="flex h-screen">
    <aside className="w-[18%] border-r">{/* Left: History */}</aside>
    <main className="flex-1">{/* Center: Chat */}</main>
    <aside className="w-[30%] border-l">{/* Right: KB */}</aside>
  </div>
  ```
- [ ] Create placeholder components:
  - `components/layout/ConversationSidebar.tsx` (left column)
  - `components/layout/ChatArea.tsx` (center column)
  - `components/layout/KnowledgeBase.tsx` (right column)
- [ ] Make the layout responsive using Tailwind breakpoints
- [ ] Add sticky positioning for column headers
- [ ] Test layout on different screen sizes

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #3 (1.3 - shadcn/ui Installation)
- Followed by: Issue #5 (1.5 - Supabase Setup)

---

### Issue #5: 1.5 - Supabase Setup

**Branch Name:** `feature/1.5-supabase-setup`

**Labels:** `backend`, `database`, `supabase`, `Step 1`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #4 (Three-Column Layout)

#### 🎯 Description

Set up Supabase as the backend service for authentication and PostgreSQL database. Create client-side and server-side Supabase utilities with proper configuration for both browser and server environments.

#### ✅ Acceptance Criteria

- [ ] Create a new project on [supabase.com](https://supabase.com)
- [ ] Copy Supabase URL and anon key from Project Settings > API
- [ ] Install Supabase dependencies:
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [ ] Create `lib/supabase/client.ts` for client-side usage:
  ```typescript
  import { createBrowserClient } from '@supabase/ssr'
  export const createClient = () =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  ```
- [ ] Create `lib/supabase/server.ts` for server-side usage with cookie helpers for Server Actions & Route Handlers
- [ ] Create `lib/supabase/middleware.ts` for auth refresh in middleware
- [ ] Verify Supabase connection works

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #4 (1.4 - Three-Column Layout)
- Followed by: Issue #6 (1.6 - Authentication Setup)

---

### Issue #6: 1.6 - Authentication Setup

**Branch Name:** `feature/1.6-authentication`

**Labels:** `auth`, `backend`, `supabase`, `Step 1`, `priority: high`

**Estimated Time:** ~20 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #5 (Supabase Setup)

#### 🎯 Description

Implement magic link authentication using Supabase Auth. Create login page, authentication actions, callback handler, route protection middleware, and profile section with logout functionality.

#### ✅ Acceptance Criteria

- [x] Configure Magic Link in Supabase Dashboard > Authentication > Providers
- [x] Create login page `app/login/page.tsx` with email input and "Send Magic Link" button
- [x] Create Server Action for magic link in `app/login/actions.ts`:
  ```typescript
  'use server'
  export async function signInWithEmail(email: string) {
    const supabase = createServerClient(...)
    return await supabase.auth.signInWithOtp({ email })
  }
  ```
- [x] Create callback handler `app/auth/callback/route.ts`
- [x] Protect routes with middleware in `middleware.ts`
- [x] Create `ProfileSection` component in sidebar with:
  - Avatar (or initials)
  - User name + email
  - Logout button
  - ThemeToggle
- [x] Implement logout action:
  ```typescript
  'use server'
  export async function signOut() {
    const supabase = createServerClient(...)
    await supabase.auth.signOut()
    redirect('/login')
  }
  ```
- [x] Persist theme preference in localStorage

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #5 (1.5 - Supabase Setup)
- Followed by: Issue #7 (1.7 - Prisma & Database Setup)

---

### Issue #7: 1.7 - Prisma & Database Setup

**Branch Name:** `feature/1.7-prisma-database`

**Labels:** `database`, `prisma`, `backend`, `Step 1`, `priority: high`

**Estimated Time:** ~20 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #5 (Supabase Setup)

#### 🎯 Description

Set up Prisma ORM with PostgreSQL (via Supabase), define the initial database schema for Phase 1 (User, Video, Conversation models), and create the necessary migrations.

#### ✅ Acceptance Criteria

- [ ] Install Prisma dependencies:
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- [ ] Configure `prisma/schema.prisma` with Supabase PostgreSQL connection:

  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }
  ```

- [ ] Define Phase 1 schema with models:
  - `User` (id, email, name, avatarUrl, createdAt, updatedAt, videos, conversations)
  - `Video` (id, userId, youtubeId, title, thumbnailUrl, channelName, duration, status, error, createdAt, updatedAt, user)
  - `VideoStatus` enum (QUEUED, PROCESSING, READY, FAILED)
  - `Conversation` (id, userId, title, createdAt, updatedAt, user)
- [ ] Create and apply migration:
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Generate Prisma Client:
  ```bash
  npx prisma generate
  ```
- [ ] Create `lib/prisma.ts` with singleton pattern:
  ```typescript
  import { PrismaClient } from '@prisma/client'
  const globalForPrisma = global as unknown as { prisma: PrismaClient }
  export const prisma = globalForPrisma.prisma || new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #5 (1.5 - Supabase Setup)
- Followed by: Issue #8 (1.8 - Environment Variables)

---

### Issue #8: 1.8 - Environment Variables

**Branch Name:** `feature/1.8-environment-variables`

**Labels:** `configuration`, `setup`, `Step 1`, `priority: high`

**Estimated Time:** ~10 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #5 (Supabase Setup), Issue #7 (Prisma & Database Setup)

#### 🎯 Description

Create comprehensive environment variable configuration files for local development and production deployment. Set up `.env.local` with all required variables and create a template `.env.example` file.

#### ✅ Acceptance Criteria

- [x] Create `.env.local` with all required variables:

  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

  # Database
  DATABASE_URL=your_postgres_connection_string
  ```

- [x] Create `.env.example` (without sensitive values) as a template for other developers
- [x] Verify `.env*` files are included in `.gitignore`
- [x] Document all environment variables with descriptions

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #5 (1.5 - Supabase Setup), Issue #7 (1.7 - Prisma & Database Setup)
- Followed by: Issue #9 (1.9 - Infrastructure & Testing)

---

### Issue #9: 1.9 - Infrastructure & Testing

**Branch Name:** `feature/1.9-infrastructure-testing`

**Labels:** `infrastructure`, `testing`, `setup`, `Step 1`, `priority: medium`

**Estimated Time:** ~15 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #1 (Project Generation & Setup)

#### 🎯 Description

Set up development infrastructure including health check endpoint, ESLint configuration, Prettier code formatting, and useful npm scripts for database management and code quality.

#### ✅ Acceptance Criteria

- [x] Create health check route `app/api/health/route.ts`:
  ```typescript
  export async function GET() {
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
  }
  ```
- [x] Install and configure ESLint:
  ```bash
  npm install -D eslint-config-prettier
  ```
- [x] Install and configure Prettier:
  ```bash
  npm install -D prettier
  echo '{"semi": false, "singleQuote": true}' > .prettierrc
  ```
- [x] Add useful scripts to `package.json`:
  ```json
  "scripts": {
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "format": "prettier --write .",
    "lint": "next lint"
  }
  ```
- [x] Test all scripts to ensure they work correctly

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #1 (1.1 - Project Generation & Setup)
- Followed by: Issue #10 (1.10 - Vercel Deployment)

---

### Issue #10: 1.10 - Vercel Deployment

**Branch Name:** `feature/1.10-vercel-deployment`

**Labels:** `deployment`, `infrastructure`, `vercel`, `Step 1`, `priority: high`

**Estimated Time:** ~15 minutes (part of Step 1: 2 hours total)

**Dependencies:** All previous issues in Step 1

#### 🎯 Description

Deploy the application to Vercel production environment. Configure environment variables in Vercel Dashboard and verify that all core functionality (authentication, database, theme toggle) works in production.

#### ✅ Acceptance Criteria

- [ ] Connect GitHub repository to Vercel
- [ ] Configure all environment variables in Vercel Dashboard (from `.env.local`)
- [ ] Deploy application and obtain production URL
- [ ] Test login flow on production (magic link authentication)
- [ ] Verify three-column layout displays correctly in production
- [ ] Test dark/light mode toggle in production
- [ ] Verify database connection works by accessing `/api/health` endpoint
- [ ] Check for any deployment errors in Vercel logs

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: All previous issues (Issues #1-#9)
- Followed by: Issue #11 (1.11 - UI Polish & Placeholders)

---

### Issue #11: 1.11 - UI Polish & Placeholders

**Branch Name:** `feature/1.11-ui-polish-placeholders`

**Labels:** `ui`, `polish`, `frontend`, `Step 1`, `priority: medium`

**Estimated Time:** ~15 minutes (part of Step 1: 2 hours total)

**Dependencies:** Issue #4 (Three-Column Layout)

#### 🎯 Description

Add polish to the UI with helpful placeholders, empty states, and mini-metrics for the knowledge base. Test responsive design across different device sizes to ensure a great user experience.

#### ✅ Acceptance Criteria

- [ ] Add "New Chat" button in left sidebar
- [ ] Add placeholder "No conversations yet" in conversation sidebar
- [ ] Add mini-metrics footer in Knowledge Base column (right sidebar):
  - Total videos: 0
  - Last ingestion: Never
- [ ] Add empty state in chat area with helpful message
- [ ] Test responsive design on mobile devices (< 768px)
- [ ] Test responsive design on tablet devices (768px - 1024px)
- [ ] Verify all UI elements are properly styled and aligned
- [ ] Ensure consistent spacing and typography throughout

#### 🔗 Related

- Part of: **Step 1 – Project Bootstrap & Skeleton Deployment**
- Depends on: Issue #4 (1.4 - Three-Column Layout)
- Final issue of Step 1

---

## ✅ Step 1 - Expected Outcomes

After completing all issues in Step 1, you should have:

- ✅ App deployed on Vercel with live URL
- ✅ Login/logout functional with magic link authentication
- ✅ Three-column responsive layout
- ✅ Dark/light mode toggle persisted
- ✅ Profile section with user info
- ✅ Prisma database connected
- ✅ Environment variables configured
- ✅ Clean codebase ready for Step 2

---

## 🚀 Next Steps

Once Step 1 is complete, proceed to [**Step 2 – YouTube Ingestion Foundations**](#-table-of-contents---step-2) (Issues #12-#21) which includes:

- YouTube Data API integration
- Inngest background jobs setup
- Video detection and metadata extraction
- Real-time status updates with Supabase Realtime
- Knowledge Base UI components

---

## 📝 Notes - Step 1

- **Time Management**: Step 1 has a total estimate of ~2 hours. Adjust individual issue times based on your experience level.
- **Dependencies**: Some issues can be worked on in parallel (e.g., Issue #6 and #7), while others are sequential.
- **Testing**: Always test locally before deploying to production.
- **Git Workflow**: Create a new branch for each issue, commit regularly, and create pull requests for review.

---

## 📋 Table of Contents - Step 2

**Step 2 – YouTube Ingestion Foundations** (~2 hours)

12. [Issue #12: YouTube Data API Setup](#issue-12-21---youtube-data-api-setup)
13. [Issue #13: Inngest Setup](#issue-13-22---inngest-setup)
14. [Issue #14: Video Detection Utils](#issue-14-23---video-detection-utils)
15. [Issue #15: Server Action - Add YouTube Content](#issue-15-24---server-action---add-youtube-content)
16. [Issue #16: Inngest Function - Video Ingestion](#issue-16-25---inngest-function---video-ingestion)
17. [Issue #17: Retry Mechanism](#issue-17-26---retry-mechanism)
18. [Issue #18: Supabase Realtime Setup](#issue-18-27---supabase-realtime-setup)
19. [Issue #19: Knowledge Base UI](#issue-19-28---knowledge-base-ui)
20. [Issue #20: Basic Observability](#issue-20-29---basic-observability)
21. [Issue #21: Testing & Deployment](#issue-21-210---testing--deployment)

---

## 🎯 Step 2 - GitHub Issues

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
  npm install youtube-sr
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
  import { youtube } from 'youtube-sr'

  export async function getVideoMetadata(videoId: string) {
    // Fetch title, thumbnail, duration, channelName
  }

  export async function getChannelVideos(channelId: string, limit = 10) {
    // Fetch latest N videos from channel
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
  - For videos: Creates Video record with status QUEUED and emits Inngest event
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
  - Step 1: Updates video status to PROCESSING
  - Step 2: Fetches video metadata from YouTube API
  - Step 3: Saves metadata to database (title, thumbnail, channelName, duration)
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
    const video = await prisma.video.findUnique({ where: { id: videoId } })
    if (!video) throw new Error('Video not found')

    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'QUEUED', error: null },
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
  - Watching status change from QUEUED → PROCESSING → READY
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
  - Status badge with color coding (QUEUED=yellow, PROCESSING=blue, READY=green, FAILED=red)
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
  - [ ] Verify status updates in real-time (QUEUED → PROCESSING → READY)
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

**Generated from**: `docs/bravi_roadmap.md` (Steps 1-2)
**Project**: Bravi YouTube AI - Founding Engineer Technical Assessment
**Last Updated**: 2025-10-22
