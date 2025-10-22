# Feature Implementation Plan: Inngest Background Job Processing

**Issue**: #19 - feature/inngest-setup
**Priority**: High
**Estimated Time**: ~15 minutes
**Status**: In Progress

---

## >� Context about Project

YouTube GPT is an AI-powered knowledge base platform that transforms hours of YouTube video content into an instantly searchable, queryable library. Users can add individual videos or entire YouTube channels (up to 10 latest videos) to their personal knowledge base, then use AI to search, ask questions, and generate content based on that video library. The platform provides grounded answers with citations and exact timestamps, making it easy to reference specific moments in videos.

The tech stack includes React 18 + TypeScript + Vite on the frontend, Supabase for authentication and PostgreSQL database with real-time capabilities, and Prisma ORM for type-safe database access. The application deploys to Vercel and follows a mobile-first, three-column responsive layout (conversation sidebar, chat area, knowledge base explorer).

Currently, the project is in **Step 2 of development** (YouTube Ingestion Foundations), building out the backend infrastructure to ingest and process YouTube videos asynchronously. Step 1 (authentication, database setup, deployment) is complete. The system needs background job processing to handle video ingestion (fetching metadata, extracting transcripts, generating embeddings) without blocking the user interface.

---

## <� Context about Feature

Inngest is a background job processing framework that allows asynchronous execution of long-running tasks with built-in retries, observability, and step-based workflows. For this project, Inngest will orchestrate the video ingestion pipeline: when a user adds a YouTube video or channel, the system creates database records with status `QUEUED`, then triggers Inngest events that process videos in the background (status transitions: QUEUED � PROCESSING � READY/FAILED).

The challenge is that the GitHub issue template assumes Next.js App Router architecture (`app/api/inngest/route.ts`), but this project uses **Vite + React + React Router**. Since deployment is on Vercel, we can use **Vercel Serverless Functions** (in the `/api` directory at the project root) to create the Inngest webhook endpoint. The Inngest SDK provides a `serve` function that handles incoming webhook requests from Inngest's cloud infrastructure.

The database schema (Prisma) already has a `Video` model with a `status` enum (QUEUED, PROCESSING, READY, FAILED) and an `error` field for failure messages. The Inngest client needs to be configured with environment variables (`INNGEST_EVENT_KEY` for sending events, `INNGEST_SIGNING_KEY` for webhook verification). This setup is a prerequisite for Issues #15-16 which will implement the actual video ingestion Server Actions and Inngest functions.

---

## <� Feature Vision & Flow

When complete, the Inngest setup will enable the following workflow:

1. **User Action**: User pastes a YouTube URL into the Knowledge Base input and submits
2. **Server Action**: Backend detects URL type (video/channel), creates Video records in database with status `QUEUED`, and emits Inngest events (`video.ingest.requested`)
3. **Inngest Processing**: Inngest cloud receives events, triggers webhook to our `/api/inngest` endpoint, which executes registered functions
4. **Video Ingestion Function**: Updates video status to `PROCESSING`, fetches YouTube metadata, extracts transcripts, generates embeddings, saves to database, updates status to `READY` (or `FAILED` on error)
5. **Real-time UI Update**: Supabase Realtime broadcasts video status changes to frontend, user sees progress indicators update automatically

The Inngest setup itself (this issue) focuses on the infrastructure layer: creating the client, exposing the webhook endpoint, configuring environment variables, and verifying the connection works. The actual ingestion logic (steps 2-4 above) will be implemented in subsequent issues. Expected UX: users never see loading spinners block the interface; they can continue browsing while videos process in the background with live status badges updating.

---

## =� Implementation Plan: Tasks & Subtasks

**Note**: Mark each task and subtask as complete by changing `[ ]` to `[x]` as you finish them.
**Instruction**: After completing each top-level task, pause to confirm implementation is correct before moving to the next task.

---

### **Task 1: Create Inngest Client** ✅
**File**: `src/lib/inngest/client.ts`

- [x] Create the directory structure `src/lib/inngest/` if it doesn't exist
- [x] Create `client.ts` file that imports the Inngest SDK and initializes a new client instance
- [x] Configure the client with:
  - `id`: A unique identifier for this app (e.g., `'youtube-gpt'` or `'bravi-youtube-ai'`)
  - `eventKey`: Read from environment variable `import.meta.env.VITE_INNGEST_EVENT_KEY` for client-side OR use Vite's `import.meta.env.INNGEST_EVENT_KEY` pattern for server-side access
- [x] Export the `inngest` client as a named export so it can be imported in Server Actions and API routes
- [x] Add TypeScript types if needed (Inngest SDK should provide them automatically)
- [x] Verify the file follows the project's CLAUDE.md guidelines (max 100 characters per line, double quotes, proper exports)

**Example structure**:
```typescript
import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'youtube-gpt',
  eventKey: import.meta.env.INNGEST_EVENT_KEY,
})
```

---

### **Task 2: Create Vercel Serverless Function for Inngest Webhook** ✅
**File**: `api/inngest.ts` (at project root, NOT in src/)

- [x] Create `api/` directory at the project root (same level as `src/`, `prisma/`, etc.)
- [x] Create `inngest.ts` file inside the `api/` directory (this becomes a Vercel Serverless Function automatically)
- [x] Import the Inngest `serve` function from `inngest/next` (works with Vercel Functions, not just Next.js)
- [x] Import the `inngest` client from `@/lib/inngest/client` (may need path adjustment since this is outside src/)
- [x] Create a placeholder `functions` array (empty for now, will be populated in Issue #16)
- [x] Export the handler using Inngest's `serve` function, which returns an object with `GET`, `POST`, `PUT` methods
- [x] Configure the `serve` call with the client and functions array
- [x] Verify Vercel will recognize this as a serverless function (Vercel auto-detects `.ts` files in `/api`)

**Example structure**:
```typescript
import { serve } from 'inngest/next'
import { inngest } from '../src/lib/inngest/client'

// Placeholder - will add actual functions in Issue #16
const functions: any[] = []

export default serve({
  client: inngest,
  functions,
})
```

**Note**: Since this file is outside `src/`, the import path for the client may need adjustment. Test with `../src/lib/inngest/client` or configure path aliases in `tsconfig.json` if needed.

---

### **Task 3: Configure Environment Variables** ✅
**Files**: `.env.local`, `.env.example`

- [x] Open Inngest Dashboard (https://app.inngest.com) and navigate to your app/project
- [x] Locate the **Event Key** (used for sending events from your app to Inngest)
- [x] Locate the **Signing Key** (used to verify webhook requests are from Inngest)
- [x] Add both keys to `.env.local`:
  ```bash
  INNGEST_EVENT_KEY=your_event_key_here
  INNGEST_SIGNING_KEY=your_signing_key_here
  ```
- [x] Update `.env.example` to include placeholders for these variables with explanatory comments:
  ```bash
  # Inngest Background Jobs (Step 2+)
  INNGEST_EVENT_KEY=
  INNGEST_SIGNING_KEY=
  ```
- [x] Verify that `.env.local` is in `.gitignore` to prevent committing secrets
- [x] Add a note in README.md or CLAUDE.md if needed about when to set these variables (Step 2+)

**Important**: The `INNGEST_EVENT_KEY` might need the `VITE_` prefix if accessed client-side, but for server-side Vercel Functions, no prefix is needed. Verify based on where the client is used.

---

### **Task 4: Configure Inngest Webhook in Dashboard** ✅
**Platform**: Inngest Dashboard

- [x] Log in to Inngest Dashboard (https://app.inngest.com)
- [x] Navigate to your app's settings or webhook configuration section
- [x] Determine your local development URL:
  - For local testing: Use a tunnel service like `ngrok` or Inngest's built-in dev server
  - Command: `npx inngest-cli dev` (this starts a local dev server that syncs with Inngest cloud)
- [x] If using `npx inngest-cli dev`:
  - Run the command in a separate terminal
  - It will provide a URL to use for the webhook endpoint
  - The Inngest CLI dev server proxies requests between Inngest cloud and your local `/api/inngest` endpoint
- [x] If using ngrok for testing:
  - Run `ngrok http 8080` to expose your local Vite dev server
  - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
  - Add `/api/inngest` to the URL
- [x] For production (after deployment):
  - Use your Vercel deployment URL + `/api/inngest`
  - Example: `https://youtube-gpt.vercel.app/api/inngest`
- [x] Save the webhook configuration in Inngest Dashboard

**Note**: For now, focus on local development setup. Production webhook will be configured during deployment (Issue #21).

---

### **Task 5: Verify Webhook Connection** ✅
**Testing & Validation**

- [x] Start the Vite dev server: `npm run dev` (runs on http://localhost:8080)
- [x] In a separate terminal, start Inngest dev server: `npx inngest-cli dev`
- [x] The Inngest CLI should detect the `/api/inngest` endpoint and establish a connection
- [x] Check the Inngest CLI output for success messages like "Connected to Inngest" or "Functions registered: 0"
- [x] Open the Inngest Dashboard and navigate to the "Functions" tab
- [x] Verify that the connection status shows as "Connected" or "Active"
- [x] Send a test event from the Inngest Dashboard or CLI to verify the webhook receives requests:
  ```bash
  npx inngest-cli send -n "test/event" -d '{"test": true}'
  ```
- [x] Check your Vercel Function logs (or terminal output) to see if the event was received
- [x] If errors occur:
  - Verify environment variables are set correctly
  - Check that `api/inngest.ts` exports the handler properly
  - Ensure the Inngest client is initialized with the correct event key
  - Review Inngest Dashboard logs for webhook delivery failures

**Success criteria**: Inngest CLI shows "Connected", Dashboard shows active connection, test events are received without errors.

---

### **Task 6: Update Documentation & Prepare for Next Issue** ✅
**Files**: `README.md`, `TASKS.md`, commit message

- [x] Update README.md if needed to document the Inngest setup (or note that it's part of Step 2)
- [x] Mark this task (#19) as complete in the project tracking (update TASKS.md, GitHub issue, etc.)
- [ ] Verify all acceptance criteria from Issue #19 are met:
  -  Inngest account created
  -  Inngest SDK installed
  -  Inngest client created at `src/lib/inngest/client.ts`
  -  Route handler created at `api/inngest.ts`
  -  Environment variables added to `.env.local`
  -  Webhook configured in Inngest Dashboard
  -  Webhook connection verified
- [ ] Create a git commit with a descriptive message following the project's commit format:
  ```
  feat(inngest): add background job processing setup

  - Create Inngest client for event-driven workflows
  - Add Vercel serverless function for webhook endpoint
  - Configure environment variables for Inngest keys
  - Verify webhook connection with Inngest dev server

  Part of Step 2 (Issue #19)
  ```
- [ ] Push the branch to GitHub and prepare for PR review (or proceed to Issue #14 if working solo)

---

## =� Implementation Notes

### **Architecture Decision: Vercel Serverless Functions vs Next.js API Routes**

Since this project uses **Vite + React** (not Next.js), we cannot use Next.js API routes (`app/api/inngest/route.ts`). Instead, we use **Vercel Serverless Functions** by creating files in the `/api` directory at the project root. Vercel automatically converts these files into serverless endpoints:

- `/api/inngest.ts` � `https://your-app.vercel.app/api/inngest`

The Inngest SDK's `serve` function from `inngest/next` is compatible with Vercel Functions, not just Next.js.

### **Development Workflow**

For local development, use the **Inngest Dev Server** (`npx inngest-cli dev`) instead of manually configuring webhooks. The dev server:

1. Runs locally on your machine
2. Syncs with Inngest cloud
3. Proxies events between Inngest and your local `/api/inngest` endpoint
4. Provides a UI for viewing function runs, event payloads, and logs
5. Hot-reloads when you change function code

### **Environment Variable Naming**

- **Server-side** (Vercel Functions, Inngest client): Use `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` (no `VITE_` prefix)
- **Client-side** (if needed): Use `VITE_INNGEST_EVENT_KEY` (but avoid exposing keys in the browser if possible)

For this setup, all Inngest operations are server-side, so no `VITE_` prefix is needed.

### **Testing Strategy**

1. **Local Testing**: Use `npx inngest-cli dev` + `npm run dev`
2. **Integration Testing**: Send test events from Inngest Dashboard or CLI
3. **Production Testing**: After deployment (Issue #21), verify webhook works with production URL

### **Next Steps (After Issue #19)**

- **Issue #14**: Create video detection utils (detect YouTube URL types, extract IDs)
- **Issue #15**: Create Server Action to add YouTube content (emit Inngest events)
- **Issue #16**: Create Inngest function to handle video ingestion (the actual processing logic)

---

##  Completion Checklist

Before marking this issue as complete, ensure:

- [ ] All 6 tasks above are marked as complete
- [ ] Inngest client is created and properly configured
- [ ] Vercel serverless function is created and exports the handler
- [ ] Environment variables are set in `.env.local` and documented in `.env.example`
- [ ] Inngest webhook connection is verified (dev server shows "Connected")
- [ ] Code follows CLAUDE.md guidelines (TypeScript, formatting, naming conventions)
- [ ] Git commit is created with descriptive message
- [ ] Ready to proceed to Issue #14 (Video Detection Utils)

---

**Last Updated**: 2025-10-22
**Issue**: #19 - feature/inngest-setup
**Branch**: `19-featureinngest-setup`
