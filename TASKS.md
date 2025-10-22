# Issue #5: Supabase Setup - Implementation Plan

## 🧠 Context about Project

**YouTube GPT** is an intelligent video knowledge base application that transforms hours of YouTube content into an instantly searchable, AI-powered platform. Users can ingest individual videos or entire channels (latest 10 videos), search across their personal video library, ask AI questions with grounded answers including citations and timestamps, and generate content from selected videos. The platform targets content creators, researchers, and professionals who need to quickly extract insights from large volumes of video content.

The project is currently in **Step 1 of development** (Project Bootstrap & Skeleton Deployment), building the foundational infrastructure before implementing core AI and video processing features. The tech stack uses **Vite + React 18 + TypeScript** for the frontend, with **Supabase** (PostgreSQL + Auth) as the backend service, **Prisma ORM** for database management, and planned integration with **Anthropic Claude** for AI chat, **ZeroEntropy** for vector embeddings, and **Inngest** for background jobs.

The UI features a three-column responsive layout: left sidebar for conversation history with profile section, center area for real-time chat with the AI assistant, and right sidebar for the knowledge base explorer with video search and multi-select capabilities. Authentication uses Supabase magic link email authentication, and the app includes dark/light mode theming using next-themes and Tailwind CSS with shadcn/ui components.

---

## 🏗️ Context about Feature

Supabase integration serves as the **backbone for authentication and data persistence** in YouTube GPT. The platform requires secure user authentication to maintain personal video libraries, conversation histories, and user preferences. Supabase provides PostgreSQL database hosting, real-time subscriptions for live status updates during video ingestion, Row Level Security (RLS) for multi-tenant data isolation, and magic link authentication.

This feature establishes the client-side Supabase utilities that will be used throughout the React application. Since the project uses **Vite (not Next.js)**, we'll implement a **client-only architecture** without server-side rendering or Server Actions. The Supabase client will handle authentication state management, database queries via Prisma (to be implemented in Issue #7), and real-time subscriptions for video ingestion status updates (Step 2).

The implementation must account for the existing **AuthContext** (`src/contexts/AuthContext.tsx`) which currently provides user state management. We'll integrate Supabase authentication into this context, replacing the placeholder implementation. Environment variables will use the **VITE_ prefix** (e.g., `VITE_SUPABASE_URL`) for client-side access in Vite. The Supabase client will be initialized as a singleton to prevent multiple instances and ensure consistent auth state across the application.

---

## 🎯 Feature Vision & Flow

**End-to-End Behavior**: Users visit the login page and enter their email address. The app sends a magic link via Supabase Auth to the user's email. Upon clicking the link, the user is authenticated and redirected to the main application with the three-column layout. The auth state persists across page refreshes using Supabase's session management with localStorage. Users can log out from the profile section in the left sidebar, which clears the session and redirects to the login page.

**Technical Flow**: The Supabase client is initialized once at app startup with credentials from environment variables. The AuthContext wraps the entire app, listening to Supabase's `onAuthStateChange` event to reactively update user state. Protected routes (Index page) check authentication status and redirect unauthenticated users to the login page. The Login component calls Supabase's `signInWithOtp` method for magic link delivery. The callback handler (to be implemented in Issue #6) validates the email token and establishes the session.

**UX Expectations**: Authentication should be seamless with loading states during magic link delivery and session initialization. Error states display user-friendly messages for network issues, invalid tokens, or expired links. The profile section shows the authenticated user's email and provides a clearly visible logout button. Dark/light mode preference persists alongside auth state, and theme selection remains consistent across login/logout flows.

---

## 📋 Implementation Plan: Tasks & Subtasks

### **Task 1: Create Supabase Project and Obtain Credentials**

- [x] **1.1 Create Supabase Project**
  - Navigate to [supabase.com](https://supabase.com) and sign in with GitHub
  - Click "New Project" and name it "youtube-gpt" or "bravi-youtube-ai"
  - Select a strong database password and store it securely (you'll need this for Prisma in Issue #7)
  - Choose the region closest to your target users (e.g., US East for North America)
  - Wait 2-3 minutes for project provisioning to complete

- [x] **1.2 Obtain API Credentials**
  - Navigate to Project Settings (gear icon) > API section
  - Copy the **Project URL** (format: `https://xxxxx.supabase.co`)
  - Copy the **anon/public key** (long JWT token starting with `eyJ...`)
  - Keep the dashboard tab open for reference during implementation

---

### **Task 2: Install Supabase Dependencies**

- [x] **2.1 Install Required Packages**
  - Run `npm install @supabase/supabase-js` in the project root
  - This installs the Supabase JavaScript client library (v2.x)
  - Note: We're NOT installing `@supabase/ssr` since we're using Vite (client-only), not Next.js

- [x] **2.2 Verify Installation**
  - Check `package.json` to confirm `@supabase/supabase-js` appears in dependencies
  - Run `npm list @supabase/supabase-js` to verify the installed version (should be ~2.x)

---

### **Task 3: Create Environment Variables Configuration**

- [x] **3.1 Create `.env.local` File**
  - Create a new file `.env.local` in the project root (same level as `package.json`)
  - Add the following variables with your actual Supabase credentials:
    ```
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    ```
  - Replace the placeholder values with the credentials from Task 1.2

- [x] **3.2 Update `.gitignore`**
  - Open `.gitignore` and verify it includes `.env.local` and `.env*.local`
  - This prevents accidentally committing sensitive credentials to Git

- [x] **3.3 Create `.env.example` Template**
  - Create `.env.example` in the project root with placeholder values:
    ```
    VITE_SUPABASE_URL=https://your-project-id.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    ```
  - This serves as a template for other developers setting up the project

- [ ] **3.4 Update TypeScript Environment Types**
  - Open `src/vite-env.d.ts` and add type declarations for environment variables:
    ```typescript
    interface ImportMetaEnv {
      readonly VITE_SUPABASE_URL: string
      readonly VITE_SUPABASE_ANON_KEY: string
    }
    ```
  - This provides TypeScript autocomplete and type safety for `import.meta.env`

---

### **Task 4: Create Supabase Client Utility**

- [ ] **4.1 Create Directory Structure**
  - Create a new directory `src/lib/supabase/`
  - This organizes all Supabase-related utilities in one location

- [ ] **4.2 Implement Client Singleton**
  - Create `src/lib/supabase/client.ts` with the following implementation:
    ```typescript
    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
    ```
  - This creates a singleton Supabase client with proper auth configuration
  - PKCE flow provides enhanced security for single-page applications
  - Session persistence uses localStorage to maintain auth state across page refreshes

- [ ] **4.3 Add Helper Type Exports**
  - Add TypeScript type exports at the bottom of `client.ts`:
    ```typescript
    export type Database = any // Will be replaced with Prisma-generated types in Issue #7
    export type SupabaseClient = typeof supabase
    ```
  - This provides type safety for components using the Supabase client

---

### **Task 5: Integrate Supabase with AuthContext**

- [ ] **5.1 Read Current AuthContext Implementation**
  - Open `src/contexts/AuthContext.tsx` to understand the current structure
  - Note the existing `user`, `isLoading`, and any auth methods currently defined
  - We'll replace placeholder logic with real Supabase authentication

- [ ] **5.2 Update AuthContext with Supabase Auth**
  - Import the Supabase client at the top: `import { supabase } from '@/lib/supabase/client'`
  - Import Supabase types: `import type { User, Session } from '@supabase/supabase-js'`
  - Update the user state type to use Supabase's `User` type instead of a custom interface
  - Add session state: `const [session, setSession] = useState<Session | null>(null)`

- [ ] **5.3 Implement Auth State Listener**
  - In the AuthProvider component, add a `useEffect` hook to listen for auth changes:
    ```typescript
    useEffect(() => {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      })

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    }, [])
    ```
  - This ensures auth state stays synchronized with Supabase across tabs and page refreshes

- [ ] **5.4 Update AuthContext Value**
  - Update the context value object to include `session` alongside `user` and `isLoading`
  - Ensure the context provider wraps the entire app in `src/App.tsx` (it should already be there)

---

### **Task 6: Create Authentication Helper Functions**

- [ ] **6.1 Create Auth Service File**
  - Create `src/lib/supabase/auth.ts` to centralize auth operations
  - This keeps authentication logic separate from UI components

- [ ] **6.2 Implement Sign In Function**
  - Add a `signIn` function for magic link authentication:
    ```typescript
    export async function signInWithMagicLink(email: string) {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (error) throw error
      return data
    }
    ```
  - This will be used in the Login page (to be updated in Issue #6)

- [ ] **6.3 Implement Sign Out Function**
  - Add a `signOut` function:
    ```typescript
    export async function signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
    ```
  - This will be used in the profile section logout button

- [ ] **6.4 Implement Get User Function**
  - Add a helper to get the current user:
    ```typescript
    export async function getCurrentUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    }
    ```
  - Useful for components that need to verify auth status programmatically

---

### **Task 7: Test Supabase Connection**

- [ ] **7.1 Create Test Component**
  - Create `src/components/SupabaseTest.tsx` as a temporary testing component:
    ```typescript
    import { useEffect, useState } from 'react'
    import { supabase } from '@/lib/supabase/client'

    export const SupabaseTest = () => {
      const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading')
      const [error, setError] = useState<string>('')

      useEffect(() => {
        async function testConnection() {
          try {
            const { data, error } = await supabase.auth.getSession()
            if (error) throw error
            setStatus('connected')
          } catch (err) {
            setStatus('error')
            setError(err instanceof Error ? err.message : 'Unknown error')
          }
        }
        testConnection()
      }, [])

      return (
        <div style={{ padding: '20px', border: '1px solid', margin: '20px' }}>
          <h3>Supabase Connection Test</h3>
          <p>Status: {status}</p>
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </div>
      )
    }
    ```

- [ ] **7.2 Add Test Component to App**
  - Temporarily add `<SupabaseTest />` to `src/App.tsx` (inside the router, above routes)
  - Start the dev server with `npm run dev`
  - Visit `http://localhost:8080` and verify the test component shows "Status: connected"

- [ ] **7.3 Test Environment Variables**
  - Open browser DevTools Console
  - Run `console.log(import.meta.env.VITE_SUPABASE_URL)` to verify env vars are loaded
  - Should display your Supabase URL (not `undefined`)

- [ ] **7.4 Test Auth State Listener**
  - Add a `console.log('Auth state changed:', session)` inside the `onAuthStateChange` callback in AuthContext
  - Reload the page and check the console - you should see "Auth state changed: null" (since not logged in yet)
  - This confirms the auth listener is working correctly

- [ ] **7.5 Remove Test Component**
  - Once connection is verified, remove `<SupabaseTest />` from `src/App.tsx`
  - Delete `src/components/SupabaseTest.tsx`
  - Remove any debugging console.logs added during testing

---

### **Task 8: Update Documentation**

- [ ] **8.1 Update README.md**
  - Add a new "Environment Setup" section to `README.md`
  - Document the required environment variables and how to obtain them
  - Add instructions: "Copy `.env.example` to `.env.local` and fill in your Supabase credentials"

- [ ] **8.2 Document Supabase Setup**
  - Add a comment block at the top of `src/lib/supabase/client.ts` explaining:
    - Purpose of the singleton pattern
    - Why we use PKCE flow
    - How session persistence works

- [ ] **8.3 Create Setup Checklist**
  - Add a checklist to the README showing developers what they need:
    - [ ] Node.js 18+ installed
    - [ ] Supabase account created
    - [ ] Environment variables configured
    - [ ] Dependencies installed (`npm install`)
    - [ ] Dev server running (`npm run dev`)

---

### **Task 9: Commit and Push Changes**

- [ ] **9.1 Stage Changes**
  - Run `git status` to review all modified and new files
  - Run `git add .` to stage all changes
  - Verify `.env.local` is NOT staged (should be gitignored)

- [ ] **9.2 Create Commit**
  - Commit with a descriptive message following the project's commit format:
    ```
    feat(backend): implement Supabase client setup

    - Install @supabase/supabase-js dependency
    - Create Supabase client singleton with PKCE auth flow
    - Configure environment variables with VITE_ prefix
    - Integrate Supabase auth with existing AuthContext
    - Add auth helper functions (signIn, signOut, getCurrentUser)
    - Test connection and verify auth state listener

    Closes #5
    ```

- [ ] **9.3 Push to Remote**
  - Run `git push origin 5-featuresupabase-setup`
  - Verify the push succeeds without errors

- [ ] **9.4 Verify Branch Status**
  - Visit GitHub repository and confirm the branch appears
  - Check that `.env.local` is not visible in the committed files

---

### **Task 10: Prepare for Issue #6 (Authentication Setup)**

- [ ] **10.1 Review Next Steps**
  - Read Issue #6 (Authentication Setup) to understand what comes next
  - The AuthContext is now ready for the Login page implementation
  - Next issue will add the actual login UI and callback handler

- [ ] **10.2 Create Pull Request (Optional)**
  - If working with a team, create a PR for Issue #5
  - Add reviewers and link to Issue #5 in the PR description
  - Mark the issue's acceptance criteria as completed in the PR

- [ ] **10.3 Test in Supabase Dashboard**
  - Navigate to Supabase Dashboard > Authentication > Users
  - Currently should show 0 users (authentication UI comes in Issue #6)
  - Verify the Auth settings show "Email" provider is enabled by default

---

**Note**: After completing each major task (Tasks 1-10), please confirm with me that the implementation is correct before moving to the next task. Mark completed tasks with `[x]` as you progress.
