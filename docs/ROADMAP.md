# 🗺️ Bravi YouTube AI - GitHub Issues Roadmap

This document contains actionable GitHub issues derived from the Bravi YouTube AI development roadmap. Each sub-step from the original roadmap has been converted into a structured GitHub issue with clear acceptance criteria, dependencies, and time estimates.

## 📊 Project Overview

**Goal**: Build an intelligent YouTube search app that helps users instantly find information hidden inside hours of video content.

**Tech Stack**:
- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js Server Actions, Supabase (Auth + PostgreSQL), Prisma ORM
- AI Services: Anthropic Claude, ZeroEntropy (embeddings), Inngest (background jobs)
- Deployment: Vercel

**Total Estimated Time (Step 1)**: ~2 hours

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
          border: "hsl(var(--border))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          // ... shadcn colors
        }
      }
    }
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
  export const createClient = () => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

- [ ] Create `.env.local` with all required variables:
  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

  # Database
  DATABASE_URL=your_postgres_connection_string

  # Placeholders for later steps
  ANTHROPIC_API_KEY=
  ZEROENTROPY_API_KEY=
  INNGEST_EVENT_KEY=
  INNGEST_SIGNING_KEY=
  ```
- [ ] Create `.env.example` (without sensitive values) as a template for other developers
- [ ] Verify `.env*` files are included in `.gitignore`
- [ ] Document all environment variables with descriptions

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

- [ ] Create health check route `app/api/health/route.ts`:
  ```typescript
  export async function GET() {
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
  }
  ```
- [ ] Install and configure ESLint:
  ```bash
  npm install -D eslint-config-prettier
  ```
- [ ] Install and configure Prettier:
  ```bash
  npm install -D prettier
  echo '{"semi": false, "singleQuote": true}' > .prettierrc
  ```
- [ ] Add useful scripts to `package.json`:
  ```json
  "scripts": {
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "format": "prettier --write .",
    "lint": "next lint"
  }
  ```
- [ ] Test all scripts to ensure they work correctly

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

Once Step 1 is complete, proceed to **Step 2 – YouTube Ingestion Foundations** which includes:
- YouTube Data API integration
- Inngest background jobs setup
- Video detection and metadata extraction
- Real-time status updates with Supabase Realtime
- Knowledge Base UI components

---

## 📝 Notes

- **Time Management**: Step 1 has a total estimate of ~2 hours. Adjust individual issue times based on your experience level.
- **Dependencies**: Some issues can be worked on in parallel (e.g., Issue #6 and #7), while others are sequential.
- **Testing**: Always test locally before deploying to production.
- **Git Workflow**: Create a new branch for each issue, commit regularly, and create pull requests for review.

---

**Generated from**: `docs/bravi_roadmap.md` (Step 1 only)
**Project**: Bravi YouTube AI - Founding Engineer Technical Assessment
**Last Updated**: 2025-10-21
