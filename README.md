# YouTube GPT - Intelligent Video Knowledge Base

> Transform hours of YouTube content into an instantly searchable, AI-powered knowledge base. Find specific information, generate content, and get grounded answers with citations and timestamps.

## Overview

YouTube GPT helps users instantly find information hidden inside hours of video content. Users can add individual videos or full channels, search across their personal knowledge base, ask AI questions, and get grounded answers with citations and timestamps.

### Key Capabilities

- **Ingest** individual videos or entire channels (latest 10 videos)
- **Search** across your personal video knowledge base
- **Ask questions** with AI-powered retrieval and get grounded answers
- **Generate content** (LinkedIn posts, summaries, outlines) from selected videos
- **Multi-select videos** to create focused context for AI interactions
- **Get citations** with exact timestamps for every answer

## Tech Stack

### Frontend

- [Vite](https://vitejs.dev/) - Fast build tool and dev server
- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/) - Client-side routing
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)

### Backend

- [Supabase](https://supabase.com/) (Auth, PostgreSQL, Realtime, RLS)
- Supabase Database (PostgreSQL with built-in ORM)
- [API Routes](https://vitejs.dev/guide/features.html#api-routes) - Server-side endpoints
- [Vercel](https://vercel.com/) deployment

### AI & Processing

- [Anthropic Claude](https://www.anthropic.com/claude) - LLM for chat
- [ZeroEntropy](https://zeroentropy.dev/) - Vector embeddings & search
- [Inngest](https://www.inngest.com/) - Background jobs
- [youtube-transcript](https://www.npmjs.com/package/youtube-transcript) - Transcript extraction

## Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/) installed
- [Supabase account](https://supabase.com) (free tier available)
- [pnpm](https://pnpm.io/) package manager (recommended)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/youtube-gpt.git
   cd youtube-gpt
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy the example environment file and configure your credentials:

   ```bash
   cp .env.example .env.local
   ```

   Open `.env.local` and fill in your Supabase credentials:

   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true
   ```

   **How to get Supabase credentials:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Navigate to Project Settings (gear icon) > API
   - Copy the **Project URL** and **anon/public key**
   - Navigate to Project Settings > Database > Connection String
   - Select "Transaction" mode and copy the connection string
   - Replace `[YOUR-PASSWORD]` with your database password

4. **Set up the database**

   Set up the database tables in Supabase:

   ```bash
   # Create tables using Supabase SQL editor or migrations
   ```

   This will create the User, Video, and Conversation tables in your Supabase PostgreSQL database.

5. **Start the development server**

   ```bash
   pnpm run dev
   ```

   The app will be available at `http://localhost:8080`

### Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Environment variables configured in `.env.local`
- [ ] Dependencies installed (`pnpm install`)
- [ ] Database migration run (`pnpm run db:migrate`)
- [ ] Dev server running (`pnpm run dev`)
- [ ] App accessible at `http://localhost:8080`

## Features

### Three-Column Layout

- **Left:** Conversation history with profile section
- **Center:** Real-time chat and compose mode
- **Right:** Knowledge Base Explorer with video search and multi-select

### Knowledge Base Management

- Add YouTube videos or channels (auto-ingests latest 10 videos)
- Real-time ingestion status tracking
- Search and filter videos
- Multi-select for focused AI context

### Scope-Aware Chat

- Chat with all videos or selected subset
- Streaming AI responses with citations
- Click citations to jump to timestamps
- Visual tool usage indicators

### Profile & Settings

- Magic link authentication via Supabase Auth
- Dark/light mode toggle with persistent preferences
- User profile management with session handling

## Architecture

### Data Flow

1. **Ingestion:** YouTube link → PENDING status → Metadata fetch → QUEUED status → [Background processing not yet implemented]
2. **Current Status Flow:** PENDING → QUEUED (metadata fetched) → [PROCESSING → READY - not yet implemented]
3. **Planned Flow:** YouTube link → Inngest job → Transcript extraction → Text chunking → Vector embeddings → Supabase storage
4. **Chat:** Question → Vector search (scoped to selected videos) → Claude generates answer → Stream to frontend
5. **Storage:** Messages stored in Supabase with scope metadata

### Project Structure

```
youtube-gpt/
├── supabase/
│   ├── migrations/       # Supabase database migrations
│   └── config.toml      # Supabase configuration
├── src/
│   ├── components/      # React components
│   │   ├── ChatArea.tsx
│   │   ├── ConversationSidebar.tsx
│   │   ├── KnowledgeBase.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── ui/         # shadcn/ui components (40+ components)
│   ├── contexts/       # React Context providers
│   │   └── AuthContext.tsx
│   ├── hooks/          # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/            # Utilities & integrations
│   │   ├── database/   # Database utilities and types
│   │   ├── utils.ts
│   │   ├── supabase/   # Supabase client & auth
│   │   ├── inngest/    # Background job client
│   │   └── youtube/    # YouTube API integration
│   ├── pages/          # Route-level components
│   │   ├── Index.tsx
│   │   ├── Login.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # React entry point
│   ├── index.css       # Global styles
│   └── vite-env.d.ts   # Vite type definitions
├── tests/              # Test files
│   ├── setup/          # Test configuration
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── youtube/        # YouTube-specific tests
├── api/                # API routes
│   └── inngest.ts      # Inngest webhook endpoint
├── scripts/            # Utility scripts
├── docs/               # Documentation
├── .env.local          # Local environment variables (not committed)
├── .env.example        # Template for environment variables
├── package.json        # Dependencies and scripts
├── pnpm-lock.yaml      # pnpm lock file
├── vite.config.ts      # Vite configuration
└── tsconfig.json       # TypeScript configuration
```

## Configuration

### Environment Variables

The application uses the following environment variables (configured in `.env.local`):

```bash
# Supabase Configuration (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Database - Supabase handles connection automatically

# Future Configuration (To be added in later steps)
# AI Services
# ANTHROPIC_API_KEY=
# ZEROENTROPY_API_KEY=

# Background Jobs
# INNGEST_EVENT_KEY=
# INNGEST_SIGNING_KEY=
```

**Important Notes:**

- All client-side environment variables must use the `VITE_` prefix to be accessible in the browser
- Database connection is handled automatically by Supabase
- Never commit `.env.local` or `.env` to version control (both are in `.gitignore`)
- Use `.env.example` as a template for setting up new environments

### Supabase Setup

The application uses Supabase for:

- **Authentication**: Magic link email authentication with session management
- **Database**: PostgreSQL database with Row Level Security (RLS)
- **Real-time**: Live updates for video ingestion status (coming in Step 2)

**Configuration Details:**

- **PKCE Flow**: Enhanced security using Proof Key for Code Exchange
- **Session Persistence**: Auth tokens stored in localStorage
- **Auto Refresh**: Tokens automatically refresh before expiration
- **Session Detection**: Handles magic link callback URLs automatically

### Database Setup (Supabase)

The application uses Supabase for database access with PostgreSQL and built-in type safety.

**Database Schema:**

- **Video**: Tracks ingested YouTube videos with processing status (PENDING, QUEUED, PROCESSING, READY, FAILED)
- **Conversation**: Represents chat sessions between users and AI
- **User Data**: Retrieved directly from Supabase Auth (auth.users table)

**Supabase Commands:**

```bash
# Start local Supabase development environment
npx supabase start

# Apply migrations to local database
npx supabase db reset

# Generate TypeScript types from database schema
npx supabase gen types typescript --local > src/types/database.types.ts

# Open Supabase Studio (visual database editor)
npx supabase studio
```

**Key Features:**

- **Type Safety**: Full TypeScript types generated from schema
- **Migrations**: Version-controlled schema changes
- **Relationships**: Foreign keys with cascade delete
- **Indexes**: Optimized queries on userId and status fields
- **Singleton Pattern**: Prevents connection pool exhaustion in development

**Usage Example:**

```typescript
import { supabase } from '@/lib/supabase/client'

// Query videos for a user
const { data: videos, error } = await supabase
  .from('videos')
  .select('*')
  .eq('userId', userId)
  .eq('status', 'READY')

if (error) {
  console.error('Error fetching videos:', error)
}
```

**Troubleshooting:**

If you encounter connection issues:

1. Verify `DATABASE_URL` in `.env.local` is correct
2. Ensure connection string uses Transaction mode (`?pgbouncer=true`)
3. Check Supabase project is active (not paused)
4. Confirm database password is correct (no special characters need escaping)

## Development

```bash
# Development server
pnpm run dev          # Start Vite dev server (http://localhost:8080)

# Building
pnpm run build        # Build for production
pnpm run build:dev    # Build in development mode

# Code quality
pnpm run lint         # Run ESLint
pnpm exec tsc --noEmit     # Type check without emitting files

# Testing
pnpm run test         # Run tests in watch mode
pnpm run test:ui      # Run tests with UI
pnpm run test:run     # Run tests once
pnpm run test:coverage # Run tests with coverage

# Database
npx supabase studio  # Open Supabase Studio (visual database editor)
npx supabase start   # Start local Supabase development environment
npx supabase db reset # Reset local database (⚠️ deletes all data)

# Future tools
pnpm exec inngest-cli dev  # Start Inngest dev server (Step 3+)
```

## Retrieval Strategy

_To be documented as implementation progresses_

## Design Decisions

_To be documented as implementation progresses_

## Current Implementation Status

### ✅ Implemented Features

- **Authentication**: Supabase Auth with magic link login
- **UI Components**: Complete shadcn/ui component library (40+ components)
- **Database Schema**: Supabase database with User, Video, and Conversation tables
- **Routing**: React Router with protected routes
- **YouTube URL Detection**: Sophisticated URL parsing for videos and channels
- **Video Ingestion**: PENDING → QUEUED status flow with metadata fetching
- **Real-time Updates**: Supabase Realtime subscriptions for live status updates
- **Status Management**: Complete status flow from PENDING to QUEUED with error handling
- **Testing**: Comprehensive test suite with Vitest (80%+ coverage target)
- **Development Tools**: ESLint, Prettier, TypeScript, Vite dev server

### 🚧 In Progress / Placeholder

- **Background Job Processing**: QUEUED → PROCESSING → READY pipeline not yet implemented
- **Transcript Extraction**: Video transcript fetching and processing
- **Vector Embeddings**: Embedding generation and storage
- **AI Chat Interface**: ChatArea component shows placeholder UI
- **Knowledge Base**: KnowledgeBase component shows empty state
- **Vector Search**: Embeddings and search functionality not implemented

### 📋 Planned Features

- Video ingestion and transcript extraction
- AI-powered chat with video context
- Vector search across video content
- Real-time processing status updates
- Multi-video selection and scoped chat

## Known Limitations

- Maximum 10 videos per channel (by design)
- Depends on YouTube auto-generated transcripts
- Processing time varies by video length

## Roadmap

- [ ] Video preview in chat
- [ ] Advanced filtering
- [ ] Export conversations
- [ ] Langfuse tracing

---

**Live Demo:** [Coming soon]

**Loom Demo:** [Coming soon]

Built for the Bravi Founding Engineer technical assessment
