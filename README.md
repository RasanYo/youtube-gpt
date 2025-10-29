# YouTube-GPT - AI-Powered Video Knowledge Base

> Transform hours of YouTube content into an instantly searchable, AI-powered knowledge base. Find specific information, generate content, and get grounded answers with citations and timestamps.

YouTube-GPT is a full-stack Next.js application that helps users find information hidden inside hours of YouTube video content. Users can add individual videos or full channels to create a searchable personal knowledge base, search across multiple videos, ask AI questions, and get grounded answers with citations and timestamps.

🔗 **Live Demo:** [https://youtube-gpt-navy.vercel.app/](https://youtube-gpt-navy.vercel.app/)

## Table of Contents

- [Quickstart](#quickstart)
- [Screenshots](#screenshotsgifs)
- [Setup Instructions](#setup-instructions)
- [Architecture Diagram](#architecture-diagram)
- [Retrieval/Scoping Approach](#retrievalscoping-approach)
- [Design Decisions & Trade-offs](#design-decisions--trade-offs)
- [AI Assistant Coding Flow](#ai-assistant-coding-flow)
- [Known Limitations & Next Steps](#known-limitations--next-steps)
- [Tech Stack](#tech-stack)
- [License](#license)

## Quickstart

```bash
# Clone the repository
git clone https://github.com/RasanYo/youtube-gpt.git
cd youtube-gpt

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npx supabase db reset

# Start development servers
pnpm run dev          # Next.js dev server on http://localhost:8080
```

## Screenshots/GIFs

### Demo Video

<div align="center">
  <a href="https://www.youtube.com/watch?v=xLZLJVsqDHU">
    <img src="https://img.youtube.com/vi/xLZLJVsqDHU/0.jpg" alt="YouTube-GPT Demo Video" style="width:100%;">
  </a>
  <p>
    <a href="https://www.youtube.com/watch?v=xLZLJVsqDHU">📹 Watch Full Demo Video</a>
  </p>
</div>

### Screenshot 1: Login Screen
![Login Interface](./docs/login.png)

### Screenshot 2: Main Interface Overview
![Main Interface](./docs/main%20screen.png)

### Screenshot 3: Main Interface with video preview
![Video Preview](./docs/video%20preview.png)


## Setup Instructions

### Prerequisites

- **Node.js** 18+ installed ([Download](https://nodejs.org/))
- **pnpm** package manager (`npm install -g pnpm`)
- **Supabase** account ([Sign up free](https://supabase.com))
- **Anthropic API** key ([Get one here](https://console.anthropic.com/))
- **ZeroEntropy** API key ([Sign up](https://zeroentropy.dev))
- **Supadata** API key ([Sign up](https://supadata.dev))
- **YouTube Data API** key ([Get one here](https://console.cloud.google.com))
- **Inngest** account ([Sign up](https://inngest.com))
- (Optional) **Langfuse** account for observability

### Local Development Setup

#### 1. Clone and Install

```bash
git clone https://github.com/your-username/youtube-gpt.git
cd youtube-gpt
pnpm install
```

#### 2. Configure Environment Variables

Create `.env.local` file in the root directory:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# YouTube Data API (Required)
YOUTUBE_API_KEY=your-youtube-api-key

# Anthropic Claude (Required)
ANTHROPIC_API_KEY=sk-ant-...

# ZeroEntropy (Required)
ZEROENTROPY_API_KEY=your-zeroentropy-api-key
ZEROENTROPY_BASE_URL=https://api.zeroentropy.dev

# Inngest (Required for background jobs)
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key

# Supadata (Required for transcript extraction)
SUPADATA_API_KEY=your-supadata-api-key

# Langfuse (Optional - for observability)
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com
```

#### 3. Set up Supabase Database

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files from `supabase/migrations/`:
   - `20251023170117_init_base_tables.sql`
   - `20251024090804_add_pending_video_status.sql`
   - `20251024090940_set_pending_as_default_video_status.sql`

**Option B: Using Supabase CLI (Local Development)**

```bash
# Start local Supabase
npx supabase start

# Link to your remote project (optional)
npx supabase link --project-ref your-project-ref

# Push migrations to remote
npx supabase db push

# Generate TypeScript types (optional)
npx supabase gen types typescript --linked > src/lib/supabase/types.ts
```

The database schema includes:
- **videos** table - Tracks ingested YouTube videos with processing status (PENDING, QUEUED, PROCESSING, TRANSCRIPT_EXTRACTING, ZEROENTROPY_INDEXING, READY, FAILED)
- **conversations** table - Stores chat sessions
- **messages** table - Stores conversation messages with citations
- RLS (Row Level Security) policies for multi-tenant data isolation
- Indexes on `user_id` and `status` for performance

#### 4. Start Development Servers

**Terminal 1: Next.js Development Server**

```bash
pnpm dev
```

The app will be available at `http://localhost:8080`

**Terminal 2: Inngest Development Server** (optional: for local testing purposes)

```bash
pnpm run dev:inngest
# Visit http://localhost:8288 for the Inngest Dev server
```

This runs the Inngest dev server for background job processing (video transcription, embedding generation, video deletions).

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                        (Next.js)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Conversation │  │  Chat Area   │  │ Knowledge    │    │
│  │   Sidebar    │  │              │  │  Base        │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────┬──────────────────────────────────────────────┘
             │
             ├── HTTP/SSE ───────────────────┐
             │                                 │
             │                         ┌──────▼─────────┐
             │                         │  Supabase    │
             │                         │   (Auth + DB) │
             │                         │   Realtime    │
             │                         └──────┬─────────┘
             │                                 │
             ▼                                 │
    ┌─────────────────────────────────────┐   │
    │   Next.js App Router (Server)      │   │
    │                                     │   │
    │   ┌─────────────────────────┐      │   │
    │   │   Server Actions         │      │   │
    │   │   - addYouTubeContent    │      │   │
    │   │   - getConversations     │      │   │
    │   │   - createConversation   │      │   │
    │   └─────────────────────────┘      │   │
    │                                     │   │
    │   ┌─────────────────────────┐      │   │
    │   │   API Routes            │      │   │
    │   │   - /api/chat           │      │   │
    │   │   - /api/inngest        │      │   │
    │   └─────────────────────────┘      │   │
    └────────┬──────────────────────┬──────┘   │
             │                     │          │
             │                     ▼          │
             │           ┌──────────────────┐ │
             │           │  Inngest         │ │
             │           │  (Background     │ │
             │           │   Jobs)          │ │
             │           └──────────────────┘ │
             │                                │
             ▼                                │
┌────────────────────────┐    ┌─────────────▼───────────────┐
│    YouTube Data API    │    │  ZeroEntropy                │
│                        │    │  (Vector Search)            │
│  - Fetch metadata      │    │                             │
│  - Get channel videos  │    │  - Store embeddings         │
└────────────────────────┘    │  - Semantic search         │
                              │  - User collections         │
                              └──────┬──────────────────────┘
                                     │
                              ┌──────▼──────────────┐
                              │  Anthropic Claude   │
                              │  (LLM)              │
                              │                     │
                              │  - Generates        │
                              │    answers          │
                              │  - Creates citations│
                              └─────────────────────┘
```

### Data Flow

#### Video Ingestion Flow

1. **User Input**: User pastes YouTube URL (video or channel) in Knowledge Base Explorer
2. **Detection**: Server Action detects URL type:
   - Video URL → Single video to process
   - Channel URL → Fetch latest 10 videos
3. **Database Update**: Create video record with status `PENDING`
4. **Metadata Fetch**: Supabase Edge Function calls YouTube Data API to get video metadata (status `PENDING` → `QUEUED`)
5. **Inngest Trigger**: Trigger `video.transcript.processing.requested` event (status `QUEUED` → `PROCESSING`)
7. **Inngest Background Processing**:
   - Extract transcript using `youtube-transcript` package (status `PROCESSING` → `TRANSCRIPT_EXTRACTING`)
   - Hiearchical chunking of transcript:
       - Level 1: 30-90 sec segments (for precise information pinpointing)
       - Level 2: Segment size proportional to video size (cf. [chunking.ts](src/lib/zeroentropy/chunking.ts) for more details)
   - Create embeddings and store chunks in user's ZeroEntropy collection (status `TRANSCRIPT_EXTRACTING` → `ZEROENTROPY_INDEXING` → `READY` on success)
8. **Real-time Update**: Frontend receives update via Supabase Realtime subscription
9. **User Feedback**: Toast notification and UI update

#### Chat Flow

1. **User Query**: User types question in chat interface (and optionally a command, i.e `Summarize` or `Create Post`)
2. **Scope Detection**: Extract scope from request (all videos by default or selected subset)
3.1. **Request Transmission**: Transmit active conversation messages, scoped videoIds, and optional command to `/api/chat` route
3.2 **User message saving**: In parallel, save user question to database. Frontend receives update via Supabase Realtime subscription and updates chat UI (cf. [useChatMessagePersistence](src/components/chat/use-chat-message-persistence.tsx))
4. **AI response generation**: 
   - If a command is selected, reformulate the user query usinng a command-specific prompt template
   - AI calls knowledgebase-querying-tools
   - Include video citation placeholders (video titles, timestamps)
6. **Streaming Response**: Stream response back to frontend via SSE
8. **Citation Parsing**: Parse citations from response using regex
9. **Message Storage**: Save message to Supabase with:
   - Content
   - Role (user/assistant)
   - Conversation ID
   - Citations metadata
10. **Display**: Render response with clickable citations and markdown format

#### Scope Management

- **Scope Types**:
  - `all`: Searches across all user's videos (default)
  - `selected`: Searches only within selected videos (passed as `videoIds` array)
- **Scope Tracking**: _(TODO — not yet implemented)_ Each conversation is intended to store its scope in `conversationMetadata`
- **Scope Restoration**: When user clicks conversation in history, scope is restored automatically
- **Visual Feedback**: Scope bar shows video chips when limited, "Reset to All" button to clear

## Retrieval/Scoping Approach

### Vector Search Architecture

The application uses ZeroEntropy for semantic search across video transcripts with intelligent scoping.

#### Collection Strategy

- **Per-User Collections**: Each user has their own ZeroEntropy collection named `user-{userId}-videos`
- **Document Structure**: Hierarchical two-level chunking strategy:
  - **Level 1 chunks**: 30-90 second segments for precise retrieval
  - **Level 2 chunks**: Segment size proportional to video size (cf. [chunking.ts](src/lib/zeroentropy/chunking.ts) for more details)
- **Metadata per Chunk**:
  ```json
  {
    "videoId": "abc123",
    "videoTitle": "Remote Work Best Practices",
    "channelName": "Tech Talks",
    "startTime": 120.5,
    "endTime": 150.5,
    "chunkIndex": 4,
    "chunkLevel": "1"
  }
  ```

#### Search Implementation

- **ZeroEntropy Vector Database**: The system uses ZeroEntropy's vector database to perform semantic searches across video transcripts. Each user has their own collection named `user-{userId}-videos` that is automatically created on first use, providing natural multi-tenant isolation.

- **Hierarchical Indexing**: When a video is ingested, its transcript is chunked hierarchically and indexed with metadata including video ID, video title, timestamps, and chunk level.

- **Two-Level Search Strategy**: The system provides two search tools to Claude, each targeting different chunk granularities:
  - **searchDetailed**: Searches Level 1 chunks (30-90 second segments) for precise facts, timestamps, exact quotes, and detailed information
  - **searchThematic**: Searches Level 2 chunks (5-20 minute sections) for broad overviews, main topics, themes, and high-level concepts

- **Search Process Flow**: 
  - AI calls a search tool with the user's question
  - System queries ZeroEntropy with filters for video scope (selected videos or all videos) and chunk level (1 or 2)
  - ZeroEntropy returns top matching snippets ranked by relevance with scores and metadata
  - Results are formatted with video titles, timestamps, and content excerpts

- **Scope Filtering**: 
  - If conversation is scoped to specific videos, search only looks within those video IDs
  - When no scope is set, search covers all videos in the user's collection
  - Chunk level filter ensures detailed searches return precise segments, while thematic searches return broader sections

- **AI Tool Selection**: Claude decides which tool to use based on query type:
  - Specific questions trigger detailed searches
  - General overview questions trigger thematic searches
  - Complex questions may cause Claude to use both tools sequentially for comprehensive coverage

#### Visual Feedback

When AI uses the search tool:
- Shows "Searching your videos..." or "Searching in detail..." in chat
- Highlights citations in response

## Design Decisions & Trade-offs

Many decisions were taken with the goal of advancing fast in the codebase. Refinements and optimizations were planned for further iterations rather than perfecting each decision upfront. Due to time constraints, iterative UX testing was limited.

### Architecture & Framework
**Decision:** Built with Next.js 14 App Router
- **Rationale:** Server-side rendering for better performance, built-in API routes, and React Server Components reduce client-side JavaScript. Server Actions provide type-safe server-side mutations without separate API files.
- **Trade-off:** Generated initial interface with Lovable which works uses only Vite. Noticed quite late the limitations and complexity it brought, so huge time loss trying to implement SSR and migrating to Next.js

**Decision:** Multiple specific Context Providers
- **Rationale:** Separating providers by use and functionality. Easier debugging, file simplicity, granulare re-rendering on specific context change
- **Tradeoff:** Intercontext dependencies (ConversationProvider depends on AuthProvider), changing order can lead to bugs


### Technology Stack Choices
**Decision:** Omitted Prisma ORM, using Supabase auto-generated types directly
- **Rationale:** Initially stuck with Vite (no SSR), Prisma didn't work, so switched to Supabase's auto-generated TypeScript types to advance quickly.
- **Trade-off:** Database modifications require manual SQL scripts, then semi-automatic code adaptation, instead of Prisma's migration workflow.

**Decision:** Supadata for transcript extraction
- **Rationale:** `youtube-transcript` was not working in deployed environment. Only worked on local Node.js server. Issue notices by community and never fixed
- **Trade-off:** Priced API and took some time finding an alternative for `youtube-transcript`

### Citation Strategy
**Decision:** Automatic citation detection in AI response via regex
- **Rationale:** Works with any LLM output format without forcing structured responses, robust fallback parsing
- **Trade-off:** Regex maintenance for edge cases vs formal schema-based citations. Imprecise LLM formatting in the output can cause bad referencing.

### Chunking Strategy
**Decision:** Hierarchical two-level chunking
- **Rationale:** Level 1 chunks enable precise timestamp retrieval for specific facts and quotes, while Level 2 chunks capture thematic overviews for broad questions. This dual granularity allows the AI to choose appropriate search depth based on query intent—detailed questions use Level 1, overview questions use Level 2.
- **Trade-off:** Duplicate information is stored in the vector store since Level 2 chunks are created by grouping Level 1 chunks, meaning the same content exists at both granularities. This increases storage costs and indexing time, but enables more effective semantic search by matching chunk size to query type.

**Decision:** Custom chunking implementation instead of ZeroEntropy's built-in semantic chunking
- **Rationale:** Custom chunking allows full control over chunk metadata and embedding timestamps directly in metadata. Embedding timestamps in text content instead of metadata could potentially degrade RAG quality, though this remains hypothetical and untested. Unsure about LLM timestamp extraction quality
- **Trade-off:** Increased code complexity and maintenance burden. We don't benefit from ZeroEntropy's built-in and refined semantic chunking algorithms that may better preserve semantic meaning across chunk boundaries.

### User Experience
**Decision:** Going for ChatGPT similar flow
- **Rationale:** Reduced user friction
- **Tradeoff:** User feedback needed to evaluate if it is actually coherent with our use cases.

## AI Assistant Coding Flow

This project was developed using AI assistants (Claude, Copilot) with an iterative, refined workflow. The following describes the evolution and current approach:

### Early Challenges

Initially, significant time was lost due to:
- **Lazy prompts** that lacked context and specificity
- **Non-optimized contexts** that didn't provide sufficient background leading to incorrect use of libraries and sometimes major bugs/unoptimized code
- **Rigid roadmaps** that became outdated quickly as development iterated and changed course

### Initial Attempt: Roadmap-Driven Approach

An early attempt involved:
1. Using LLMs to generate an extensive roadmap from task descriptions
2. Converting that roadmap into a long list of tasks with paired commit titles and messages
3. Creating GitHub issues for each task with full context

**Problem:** This approach failed because:
- Development is iterative and can change course
- Tasks and issues became irrelevant as priorities shifted
- The roadmap became a maintenance burden rather than a helpful guide

### Current Refined Workflow

The project now follows this iterative, context-rich flow:

#### 1. Task Planning
- **Describe the desired outcome** with clear requirements and success criteria
- **Add documentation references** to relevant libraries, APIs, or frameworks
- **Discuss implementation approach** with the AI to refine understanding

#### 2. Issue Creation
- Create a GitHub issue with:
  - Descriptive title
  - Detailed description explaining the goal and requirements
  - Any relevant context or constraints

#### 3. Branch Management
- Create a new feature branch from `develop`
- Keep branch focused on single feature/issue

#### 4. Implementation Phase

**Step A: Context Gathering**
- Read the current issue to understand the task
- Use a Cursor custom issue-reading command to load context

**Step B: Research & Planning**
- Read relevant library documentation thoroughly
- Analyze the codebase structure and identify relevant files
- Generate an implementation plan using a structured prompt template
- Create `TASKS.md` with:
  - Project and feature description
  - Documentation references
  - Step-by-step implementation plan
  - Validation criteria for each task

**Step C: Plan Validation**
- Open separate chat sessions with library-specific assistants
- Validate the implementation plan against (and then refine for):
  - Security best practices
  - Framework conventions
  - Correct library usage patterns
  - Performance considerations

**Step D: Execution**
- Create a dedicated assistant context with the implementation plan
- Implement tasks one by one in `TASKS.md`
- After each task:
  - Validate against the plan's criteria
  - Run tests and check for errors
- For complex tasks, use Claude Code for higher quality output (when not constrained by session limits)

#### 5. Iterative Feedback Loop
- **For complex features:** Request human feedback between implementation phases
- **For simple tasks:** Validate automatically before proceeding
- Pause for review when encountering edge cases or design decisions

#### 6. Completion & Commit
- Ensure all implementations are complete and tested
- Use Cursor command to generate commit message from code changes
- Push modifications to the branch
- Create pull request

### Key Principles Learned

1. **Context is King:** Always provide rich context (docs, code structure, requirements). Using multiple library/task specific chats to refine the implementation plan was a game changer to make sure that libraries are implemented correctly. Initially had to fight myself against he wrong implementations of the AIs
2. **Iterative Validation:** Validate each step before moving forward for complex tasks
3. **Human in the Loop:** Especially for complex features, keep human oversight
4. **Quality over Speed:** Assign small and concret tasks one at a time rather than giving broad intepretable tasks.
5. **Adapt, Don't Adhere:** Roadmaps are guides, not rigid constraints
6. **Plan out execution:** Broad and open questions with high entropy lead to poor AI work. I learned to formulate my prompts as numbered steps, with the first one being precise context generation for the AI (analyzing relevant files and documentations). Sometime having a discussion with the AI (without code generations) beforehand can also create a helpful context.
7. **Code Quality:** Maintain readable code and keep files under a size threshold. Well-structured, concise code helps the AI understand the codebase better, leading to more coherent code generations. Hence regularly refactor code base (due to time constraints not done fully towards the end...)


### Future Improvements

1. **Modular Specialized Agents with Structured Context Loading**
   - Develop a framework for modular, task-oriented agents and commands—each using distinct prompting styles and responsibilities.
   - Ensure that every agent begins with an explicit context-loading step, gathering relevant documentation, file structure, and requirement summaries before execution, improving reliability and relevance of all generated code or documentation.

2. **Parallel Autonomous Agents for Background Tasks**
   - Leverage these modular agents in background tasks (e.g., code refactoring, automated debugging, UI migration, continuous documentation) working in parallel to the main development flow.
   - Enable agents to operate within isolated branches or sandbox environments, allowing them to propose, test, and PR improvements asynchronously—accelerating project velocity without interfering with feature delivery.


## Known Limitations & Next Steps

### Current Limitations

1. **Transcript Dependence**
   - Relies on YouTube auto-generated captions
   - Videos without captions cannot be processed
   - Video frames are not embedded. Could be a very useful feature, especially for educational videos (calculus for example) where users could want to ask questions about a specific thing they see in the video
   - Future: Support for manual transcript upload or audio transcription and video frame embedding

2. **Citation Accuracy**
   - Citations depend on AI model interpretation
   - Regex parsing may miss non-standard citation formats
   - As saif before, chunks of ~3 minutes. Citing video sometime off by a couple seconds/minutes
   - Future: Structured output mode for guaranteed citation format and finer chunking with more overlap.

3. **Single Knowledgebase**
   - Single source of truth
   - Depending on topics/project, a user might want to have different Knowledgebases with different sets of videos

4. **Content Generation**
   - User has to manually select and copy AI generated content (summary/post)
   - Unnecessary and uncomfortable flow
   - Video citations sometimes also inside generated content. If user wants to copy post to Linkedin for example, has to manually remove the citations from the copied selection

5. **UI Bugs**
   - Minor UI bugs still present that can harm UX
   - Dropdown menu to edit chat title/delete chat overflows over column width (fixed bug initially, but fix commit must have been lost and only noticed before handout deadline)
   - AI message generation cursor always on newline. Should be inline next to last character for more natural feel


### Next Steps & Roadmap

1. **Web Extension and multiple KBs**
   - [ ] Give to a user the option to creata multiple KBs with different sets of videos
   - [ ] Create a web extension which embeds a button on a youtube video page to directly add videos to a KB from youtube (like adding a video to a youtube playlist). Simpler and faster flow than copying URL and pasting on UI everytime

2. **Content Generation**
   - [ ] UI component to directly copy AI response or generated summary/post with one click, instead of having to manually select and copy output

3. **Collaboration ?**
   - [ ] Team workspaces with shared video libraries
   - [ ] Multi-user conversations with @mentions
   - [ ] Video annotations and comments

4. **Platform Expansion**
   - [ ] Support for Vimeo, self-hosted videos, moodle course videos
   - [ ] Audio-only podcast support
   - [ ] Local video file upload and processing

5. **UX Improvements & Bug Fixes**
   - [ ] Automatic redirect to login screen on logout
   - [ ] Fix conversation item menu display bug
   - [ ] Handle deleted video citations gracefully: when a citation references a deleted video, automatically open video preview with option to re-add to knowledge base
   - [ ] Improve markdown formatting of AI responses
   - [ ] Add "Thinking..." state when AI is generating without using tools
   - [ ] Remove or hide intermediate AI thinking messages (e.g., "Let me think...", "Let me walk through the knowledge base") - make them temporary and remove/hide when final message is generated
   - [ ] Avoid multiple references to the same video snippet within the same AI response
   - [ ] When generating posts with "Create Post" command, exclude citations from the post body (keep them separate or omit entirely)
   - [ ] Add user avatar to user messages in chat (needs UX review to evaluate actual value)
   - [ ] Add retry button for failed video uploads; make videos not selectable while processing
   - [ ] Fix footer height inconsistencies across columns for better visual alignment

6. **User Feedback & Analytics**
   - [ ] Add user feedback features: random popup for user satisfaction (binary input or similar to Claude Code asking to evaluate experience between 1-5 during response generation); appears at random moments, not for all messages
   - [ ] Integrate Microsoft Clarity for UX feedback and user behavior analytics (heatmaps, session recordings, insights)

---


## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with SSR/SSG
- **React 18** + **TypeScript** - UI library with type safety
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **next-themes** - Dark/light mode support
- **react-resizable-panels** - Resizable sidebar layout

### Backend
- **Next.js Server Actions** - Server-side mutations
- **Next.js API Routes** - REST endpoints
- **Supabase** - PostgreSQL database, Authentication, Real-time
- **Supabase Edge Functions** - Serverless compute for video metadata
- **Row-Level Security (RLS)** - Multi-tenant data isolation

### AI & Processing
- **Anthropic Claude** (via AI SDK) - LLM for chat and generation
- **ZeroEntropy** - Vector embeddings and semantic search
- **Inngest** - Background job processing
- **Supadata** - YouTube transcript extraction

### Developer Experience
- **TypeScript** - Static type checking
- **ESLint** + **Prettier** - Code quality
- **Vitest** - Unit and integration testing
- **pnpm** - Fast, disk space efficient package manager

### Deployment
- **Vercel** - Hosting and deployment platform
- **Supabase Cloud** - Managed database and auth

## License

MIT License

2025 Rasan Younis

---

Built with ❤️ for the Bravi Technical Assessment
