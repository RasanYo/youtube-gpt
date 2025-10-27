# YouTube-GPT - AI-Powered Video Knowledge Base

> Transform hours of YouTube content into an instantly searchable, AI-powered knowledge base. Find specific information, generate content, and get grounded answers with citations and timestamps.

YouTube-GPT is a full-stack Next.js application that helps users find information hidden inside hours of YouTube video content. Users can add individual videos or full channels to create a searchable personal knowledge base, search across multiple videos, ask AI questions, and get grounded answers with citations and timestamps.

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

### Screenshot 1: Main Interface Overview
**Description:** Three-column ChatGPT-style interface showing the complete application layout:
- **Left Column:** Conversation history sidebar with list of past conversations, each with editable titles. Profile section at bottom showing user avatar, name, email, dark/light mode toggle, and logout button.
- **Center Column:** Real-time chat interface displaying a conversation with the AI assistant. Shows streaming responses with inline citations that are clickable (e.g., "Managing Remote Teams (2:34)"). Input field at bottom with send button.
- **Right Column:** Knowledge Base Explorer showing:
  - Input field at top for adding YouTube URLs (video or channel)
  - List of videos with thumbnails, titles, channel names, and status indicators (READY, PROCESSING, PENDING, FAILED)
  - Search bar for filtering videos
  - Checkboxes for multi-select functionality
  - Selection toolbar showing "Use as Context" button when videos are selected

### Screenshot 2: Video Ingestion Flow
**Description:** Demonstrating the video ingestion process:
- User pastes a YouTube channel URL in the input field
- System detects it's a channel and shows "Ingesting 10 videos..."
- Shows thumbnail grid of videos being processed with status indicators:
  - PENDING (queued)
  - QUEUED (metadata fetched)
  - PROCESSING (transcript extraction in progress)
  - READY (available for search)
  - FAILED (retry button shown)
- Progress indicators and tooltips showing what each status means

### Screenshot 3: Scope-Aware Chat with Citations
**Description:** Showcasing the scoped search functionality:
- Scope bar at top of chat showing selected video chips (e.g., "Remote Work Best Practices 🎬", "Team Management Tips 🎬")
- "Reset to All" button to clear scope
- AI response shown with multiple citations:
  ```
  Based on the selected videos, there are three pricing strategies:
  
  1. Value-based pricing [Remote Work Video (3:45)]
  2. Competitive pricing [Team Management Video (5:12)]
  3. Cost-plus pricing [Remote Work Video (7:23)]
  ```
- Visual indicator showing "AI is searching your videos..." when RAG tool is active
- Clickable citations that highlight the source video and jump to specific timestamps

### Screenshot 4: Conversation History
**Description:** Left sidebar showing conversation management:
- List of conversations with auto-generated titles based on first message
- Example titles: "What are the pricing strategies?", "Summarize remote work best practices", "Generate LinkedIn post from video"
- Each conversation shows last message preview and timestamp
- "New Chat" button at top
- Profile section at bottom with user info and settings

### Screenshot 5: Dark/Light Mode Toggle
**Description:** Side-by-side comparison showing:
- Left: Light mode with bright background, dark text, YouTube-red accents
- Right: Dark mode with #141414 background, glowing cyan accents, modern aesthetic
- Both show the same conversation and layout for easy comparison

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

**How to get credentials:**

1. **Supabase:**
   - Go to your Supabase project dashboard
   - Navigate to Project Settings > API
   - Copy the Project URL and anon/public key
   - Get database password from Project Settings > Database > Connection String

2. **YouTube Data API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Copy the API key

3. **Anthropic:**
   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create an API key
   - Copy the key (starts with `sk-ant-`)

4. **ZeroEntropy:**
   - Sign up at [zeroentropy.dev](https://zeroentropy.dev)
   - Get your API key from dashboard
   - Base URL is typically `https://api.zeroentropy.dev`

5. **Supadata:**
   - Sign up at [supadata.dev](https://supadata.dev)
   - Get your API key from dashboard
   - Used for extracting YouTube transcripts

6. **Inngest:**
   - Sign up at [inngest.com](https://inngest.com)
   - Create a new app
   - Copy Event Key and Signing Key from settings

7. **Langfuse (Optional):**
   - Sign up at [cloud.langfuse.com](https://cloud.langfuse.com)
   - Get your secret and public keys from settings

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
- **videos** table - Tracks ingested YouTube videos with processing status (PENDING, QUEUED, PROCESSING, READY, FAILED)
- **conversations** table - Stores chat sessions
- **messages** table - Stores conversation messages with citations
- RLS (Row Level Security) policies for multi-tenant data isolation
- Indexes on `user_id` and `status` for performance

#### 4. Start Development Servers

You need to run two servers simultaneously:

**Terminal 1: Next.js Development Server**

```bash
pnpm run dev
```

The app will be available at `http://localhost:8080`

**Terminal 2: Inngest Development Server** (optional: for local testing purposes)

```bash
npx inngest-cli dev
```

This runs the Inngest dev server for background job processing (video transcription, embedding generation).

#### 5. Deploy to Production (Vercel)

Push to `main` branch

Don't forget to add all environment variables in the Vercel project settings!

### Setup Checklist

- [ ] Node.js 18+ installed
- [ ] pnpm package manager installed
- [ ] Supabase account created
- [ ] Environment variables configured in `.env.local`
- [ ] Dependencies installed (`pnpm install`)
- [ ] Database migrations applied (via Supabase SQL editor)
- [ ] Dev server running (`pnpm run dev`)
- [ ] Inngest dev server running (`npx inngest-cli dev`)
- [ ] App accessible at `http://localhost:8080`

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
3. **Metadata Fetch**: Supabase Edge Function calls YouTube Data API to get:
   - Video title
   - Thumbnail URL
   - Channel name
   - Duration
4. **Database Update**: Create video record with status `PENDING`
5. **Status Update**: Update status to `QUEUED` after metadata fetch
6. **Inngest Trigger**: Trigger `video.transcript.processing.requested` event
7. **Background Processing**:
   - Status: `QUEUED` → `PROCESSING`
   - Extract transcript using `youtube-transcript` package
   - Status: `PROCESSING` → `TRANSCRIPT_EXTRACTING`
   - Chunk transcript into 30-second segments
   - Status: `TRANSCRIPT_EXTRACTING` → `INDEXING`
   - Generate embeddings for each chunk via ZeroEntropy
   - Store chunks in user's ZeroEntropy collection
   - Status: `INDEXING` → `READY`
8. **Real-time Update**: Frontend receives update via Supabase Realtime subscription
9. **User Feedback**: Toast notification and UI update

#### Chat Flow

1. **User Query**: User types question in chat interface
2. **Scope Detection**: Extract scope from request (all videos or selected subset)
3. **Scope Filter**: If specific videos selected, pass `videoId` filter to search
4. **Semantic Search**: Call ZeroEntropy to search user's collection:
   - Query: User's question
   - Filter: Video IDs (if scoped)
   - Limit: Top 5 results
   - Include metadata: Video title, timestamps, score
5. **Context Building**: Format search results as context for Claude
6. **LLM Call**: Send to Anthropic Claude with:
   - System prompt (instructions for citations)
   - Search results as context
   - Conversation history
   - User's question
7. **Streaming Response**: Stream response back to frontend via SSE
8. **Citation Parsing**: Parse citations from response using regex
9. **Message Storage**: Save message to Supabase with:
   - Content
   - Role (user/assistant)
   - Conversation ID
   - Citations metadata
10. **Display**: Render response with clickable citations

#### Scope Management

- **Scope Types**:
  - `all`: Searches across all user's videos (default)
  - `selected`: Searches only within selected videos (passed as `videoIds` array)
- **Scope Tracking**: Each conversation stores its scope in `conversationMetadata` JSON field
- **Scope Restoration**: When user clicks conversation in history, scope is restored automatically
- **Visual Feedback**: Scope bar shows video chips when limited, "Reset to All" button to clear

## Retrieval/Scoping Approach

### Vector Search Architecture

The application uses ZeroEntropy for semantic search across video transcripts with intelligent scoping.

#### Collection Strategy

- **Per-User Collections**: Each user has their own ZeroEntropy collection named `user-{userId}`
- **Document Structure**: Each video transcript is split into 30-second chunks
- **Metadata per Chunk**:
  ```json
  {
    "videoId": "abc123",
    "videoTitle": "Remote Work Best Practices",
    "channelName": "Tech Talks",
    "startTime": 120.5,
    "endTime": 150.5,
    "chunkIndex": 4
  }
  ```

#### Search Implementation

Located in `src/lib/search-videos.ts`:

```typescript
// Search with scoping support
export async function searchVideos(params: SearchVideosParams): Promise<SearchResult[]> {
  const { query, userId, videoIds, limit = 10 } = params
  
  // Get user's collection
  const collectionName = await getOrCreateUserCollection(userId)
  
  // Build filter for specific videos if provided
  let filter: Record<string, unknown> | undefined
  if (videoIds && videoIds.length > 0) {
    filter = {
      videoId: {
        $in: videoIds  // Only search in selected videos
      }
    }
  }
  
  // Search ZeroEntropy collection
  const response = await client.queries.topSnippets({
    collection_name: collectionName,
    query,
    k: limit,
    filter: filter || undefined,  // Apply scope filter
    include_document_metadata: true,
    precise_responses: true  // Get precise snippets (~200 chars)
  })
  
  // Transform and return results with video metadata
  return results
}
```

#### Scoping Mechanism

**All Videos (Default)**:
```typescript
// No filter applied - searches entire collection
searchVideos({ query: "pricing strategies", userId })
```

**Selected Videos**:
```typescript
// Filter applied - only searches in selected videos
searchVideos({ 
  query: "remote work tips", 
  userId,
  videoIds: ["video1", "video2"]  // Scope to these videos only
})
```

#### Retrieval-Augmented Generation (RAG)

The chat API uses AI SDK with tool calling:

**Tool Definition** (`src/lib/tools/search-tool.ts`):
```typescript
export const searchTool = {
  name: 'searchKnowledgeBase',
  description: 'Search across videos for relevant content',
  parameters: z.object({
    query: z.string().describe('Search query'),
    videoIds: z.array(z.string()).optional()
  })
}
```

**System Prompt** (instructs AI when to search):
```typescript
const systemPrompt = `You are Bravi AI, an intelligent assistant.

You have access to a search tool. Use your judgment:
- Questions about video content → Use search tool
- General conversation → Respond directly

When searching:
1. Provide comprehensive answers
2. Always include video citations with timestamps
3. Format: [Video Title] (timestamp)`

Example: Based on the videos, here are pricing strategies:
1. Value-based pricing [Remote Work Video (3:45)]
2. Competitive pricing [Team Mgmt Video (5:12)]
```

#### Citation Format

Citations are automatically parsed from AI responses and made clickable:

**Format**: `[Video Title] (timestamp)`

**Example**: "Managing Remote Teams (2:34)"

**Implementation** (`src/lib/citations/parser.ts`):
- Regex pattern: `/\[([^\]]+)\] \((\d+):(\d+)\)/g`
- Extracts video title and timestamp
- Creates clickable links that open YouTube at specific timestamp
- Renders as inline component with hover effects

#### Visual Feedback

When AI uses the search tool:
- Shows "🔍 AI is searching your videos..." in chat
- Updates status to "AI is thinking..."
- Displays citation count when results found
- Highlights citations in response

## Design Decisions & Trade-offs

*To be documented*

## Known Limitations & Next Steps

*To be documented*

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

MIT

---

Built with ❤️ for the Bravi Technical Assessment