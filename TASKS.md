# OAuth Integration & Profile Management Implementation Plan

## 🧠 Context about Project

YouTube-GPT is a full-stack AI-powered YouTube search application that helps users extract, search, and repurpose information from their video libraries. The application transforms YouTube videos into a searchable knowledge base using AI (Claude) and semantic search (ZeroEntropy embeddings). 

Users can ingest individual videos or entire YouTube channels, creating a personal video library. The app provides a ChatGPT-style interface with three columns: conversation history (left), chat/compose area (center), and knowledge base explorer (right). Users can ask questions across their video collection and get grounded, cited responses with timestamps.

The system uses Next.js 14 (App Router), Supabase for auth/database/storage, Prisma ORM, Inngest for background jobs, shadcn/ui for UI components, and Tailwind CSS. Currently, authentication is implemented via Supabase magic link (passwordless email login), and the application serves content creators, researchers, students, and professionals who need to efficiently search and extract information from YouTube content libraries.

## 🏗️ Context about Feature

The application currently supports only magic link (email-based passwordless) authentication through Supabase. The `AuthContext` provides user session management and exposes a single `login(email)` method that sends OTP magic links. The login page (`src/app/login/page.tsx`) only shows an email input form.

Profile information is currently derived directly from `user.email` in the `ConversationSidebarProfile` component, showing the email address and generating initials from the first character of the email. There is no profiles table in the database yet, and avatar functionality is limited to email-based initials.

The system uses Supabase's `auth.users` table for authentication, with PKCE flow enabled for security. The auth context properly handles SSR hydration guards and real-time session updates. The application infrastructure is already set up to support OAuth (Supabase config has OAuth provider sections, all currently disabled).

## 🎯 Feature Vision & Flow

The feature will add OAuth authentication alongside magic link, giving users choice between quick social logins (Google/GitHub) or passwordless email. After integration, users will see both OAuth buttons and email input on the login page, maintaining the current magic link flow while adding social provider options.

OAuth providers (Google, GitHub) will automatically populate `user_metadata` with avatar URLs and display names from the provider. The login page will show both options: a "Continue with Google" button and a "Continue with GitHub" button alongside the existing magic link form.

When users authenticate via OAuth, they'll be automatically redirected back to the app after provider consent, maintaining session continuity with the existing PKCE flow. The profile component will be enhanced to show actual profile pictures from OAuth providers or fall back to initials for magic link users.

A new `CurrentUserAvatar` component will be created (following Supabase UI patterns) using hooks `useCurrentUserImage()` and `useCurrentUserName()` that read from `user.user_metadata`. This will be integrated into the sidebar profile section, replacing the current basic avatar implementation.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Setup & Configuration (Foundation)

#### Task 1.1: Configure OAuth Providers in Supabase ✅
**Objective**: Enable Google and GitHub OAuth providers in Supabase configuration

**Subtasks**:
- [x] Add complete `[auth.external.google]` configuration block to `supabase/config.toml` with proper structure (enabled, client_id, secret, redirect_uri)
- [x] Add complete `[auth.external.github]` configuration block to `supabase/config.toml` with proper structure
- [x] Use environment variable references: `client_id = "env(GOOGLE_CLIENT_ID)"` and `secret = "env(GOOGLE_CLIENT_SECRET)"` for Google
- [x] Use environment variable references: `client_id = "env(GITHUB_CLIENT_ID)"` and `secret = "env(GITHUB_CLIENT_SECRET)"` for GitHub
- [x] Add environment variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` to `.env.local`
- [x] Update `.env.example` to document OAuth environment variables

**Validation Criteria**:
- ✅ Google provider has complete configuration block in `config.toml` with `enabled = true`
- ✅ GitHub provider has complete configuration block in `config.toml` with `enabled = true`
- ✅ All secrets use environment variable references (never commit secrets)
- ✅ Configuration follows Supabase OAuth provider setup guide format
- ✅ All environment variables documented in `.env.example`

**References**:
- [Supabase GitHub OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

**Example Configuration Structure for `supabase/config.toml`:**
```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = ""
skip_nonce_check = false
email_optional = false

[auth.external.github]
enabled = true
client_id = "env(GITHUB_CLIENT_ID)"
secret = "env(GITHUB_CLIENT_SECRET)"
redirect_uri = ""
skip_nonce_check = false
email_optional = false
```

**Note**: Leaving `redirect_uri = ""` uses Supabase's default callback URL: `https://<project-ref>.supabase.co/auth/v1/callback`. You'll add this callback URL to your OAuth provider dashboards (Google Cloud Console and GitHub Developer Settings).

---

#### Task 1.2: Configure Redirect URLs in Supabase ✅
**Objective**: Set up proper OAuth redirect URLs in Supabase configuration

**Subtasks**:
- [x] Check current `additional_redirect_urls` array in `supabase/config.toml` (line 125)
- [x] Add `http://localhost:3000` to allow local development redirects (Next.js runs on port 3000)
- [x] Add `http://127.0.0.1:3000` as alternative localhost redirect
- [x] Document that the Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) must be added to OAuth provider dashboards
- [x] Verify that `site_url` in config matches your local dev URL (should be `http://127.0.0.1:3000`)

**Validation Criteria**:
- ✅ `additional_redirect_urls` includes both local development URLs
- ✅ Configuration matches Supabase redirect URL requirements
- ✅ No type errors in config file
- ✅ Team understands redirect URL requirements

---

#### Task 1.3: Create Environment Variable Documentation ✅
**Objective**: Document OAuth setup requirements for team members

**Subtasks**:
- [x] Create section in `README.md` or new `docs/auth-setup.md` explaining OAuth setup process
- [x] Document steps to obtain Google OAuth credentials from Google Cloud Console
- [x] Document steps to obtain GitHub OAuth credentials from GitHub Developer Settings
- [x] List required redirect URLs that must be added to OAuth provider dashboards (production URL + local dev URLs)
- [x] Add environment variable validation section (Task 2.3)

**Validation Criteria**:
- ✅ Clear documentation exists for setting up OAuth providers
- ✅ Instructions include links to both Google and GitHub developer consoles
- ✅ Redirect URLs are explicitly listed for both local and production environments
- ✅ Any team member can follow docs to set up OAuth locally

---

#### Task 1.4: Create Server-Side Supabase Client ✅
**Objective**: Create server-side Supabase client for OAuth callback handling in Next.js App Router

**Subtasks**:
- [x] Create `src/utils/supabase/server.ts` file
- [x] Implement server-side client using `createServerClient` from `@supabase/ssr` package
- [x] Use Next.js `cookies()` API to read/write session cookies for SSR compatibility
- [x] Ensure proper cookie configuration for auth tokens (httpOnly, secure in production)
- [x] Export a `createClient()` function that returns the server-side client instance
- [x] Add JSDoc comments explaining SSR usage and cookie handling

**Validation Criteria**:
- ✅ File created at `src/utils/supabase/server.ts`
- ✅ Uses `@supabase/ssr` package for server-side rendering support
- ✅ Properly handles cookies with Next.js `cookies()` API
- ✅ Configured with appropriate security settings (httpOnly, secure)
- ✅ Can be imported via `import { createClient } from '@/utils/supabase/server'`
- ✅ No TypeScript errors

**References**:
- [Supabase Next.js Server Components Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [@supabase/ssr Documentation](https://supabase.com/docs/references/javascript/creating-a-client#nextjs-server-components)

---

### Phase 2: Authentication Context Enhancement

#### Task 2.1: Add OAuth Methods to AuthContext ✅
**Objective**: Extend AuthContext to support OAuth authentication alongside magic link

**Subtasks**:
- [x] Add `signInWithGoogle()` method to `AuthContext` that calls `supabase.auth.signInWithOAuth()` with provider `'google'`
- [x] Add `signInWithGitHub()` method to `AuthContext` that calls `supabase.auth.signInWithOAuth()` with provider `'github'`
- [x] Configure `redirectTo` option to `${window.location.origin}/auth/callback` (server-side callback route handles code exchange)
- [x] Update `AuthContextType` interface to export these new methods
- [x] Add try-catch blocks with error logging for debugging OAuth failures
- [x] Add loading states to track OAuth flow progress

**Validation Criteria**:
- ✅ `AuthContext` exports both `signInWithGoogle()` and `signInWithGitHub()` functions
- ✅ Methods use `signInWithOAuth` from Supabase with correct provider parameter
- ✅ OAuth redirect URL points to `/auth/callback` route (for server-side code exchange)
- ✅ Error handling with console logging for debugging
- ✅ Loading states prevent concurrent OAuth attempts
- ✅ No TypeScript errors in `src/contexts/AuthContext.tsx`

**Important**: The OAuth callback route (created in Task 3.3) is required for PKCE flow with Next.js App Router. The client redirects to the provider, then the provider redirects back to `/auth/callback` where the server exchanges the code for a session.

---

#### Task 2.2: Update Auth Hook in Context ✅
**Objective**: Ensure useAuth hook returns new OAuth methods

**Subtasks**:
- [x] Verify `useAuth()` hook exports all authentication methods (login, signInWithGoogle, signInWithGitHub, logout)
- [x] Add JSDoc comments for new OAuth methods explaining their behavior and usage
- [x] Test that all methods are accessible via `const { signInWithGoogle, signInWithGitHub, login, logout } = useAuth()`

**Validation Criteria**:
- ✅ All auth methods accessible via `useAuth()` hook
- ✅ JSDoc comments added for public-facing auth methods
- ✅ TypeScript types updated to include new OAuth methods in context value
- ✅ No runtime errors when calling auth methods from components

---

#### Task 2.3: Add OAuth Error Handling and Loading States ✅
**Objective**: Implement robust error handling for OAuth edge cases

**Subtasks**:
- [x] Add error handling for OAuth popup blocker scenarios (show user-friendly toast message)
- [x] Add error handling for user consent rejection (show user-friendly message without crashing)
- [x] Add error handling for network failures during OAuth flow
- [x] Implement loading state in OAuth buttons to prevent multiple simultaneous OAuth attempts
- [x] Add toast notifications for OAuth errors with actionable user guidance
- [x] Log detailed error information to console for debugging while showing user-friendly messages

**Validation Criteria**:
- ✅ Users get helpful feedback when popup is blocked
- ✅ Users get clear messages when OAuth consent is rejected
- ✅ No unhandled promise rejections in OAuth flow
- ✅ Loading states prevent concurrent OAuth attempts
- ✅ Toast notifications provide actionable guidance
- ✅ Console logs include detailed error info for debugging

---

### Phase 3: UI Components for OAuth Login

#### Task 3.1: Create OAuth Provider Buttons Component ✅
**Objective**: Build reusable OAuth button components following design system

**Subtasks**:
- [x] Create `src/components/auth/oauth-buttons.tsx` component file
- [x] Implement Google OAuth button with Google icon (use `lucide-react` or custom SVG)
- [x] Implement GitHub OAuth button with GitHub icon
- [x] Style buttons to match existing design system (use Button component from `@/components/ui/button`)
- [x] Add loading states when OAuth flow is initiated (disable button, show spinner)
- [x] Add proper accessibility labels and ARIA attributes

**Validation Criteria**:
- ✅ Component file created at `src/components/auth/oauth-buttons.tsx`
- ✅ Buttons styled consistently with existing UI (shadcn/ui Button variants)
- ✅ Icons displayed correctly (Google and GitHub logos or recognizable iconography)
- ✅ Loading state disables button and shows visual feedback
- ✅ Buttons have accessible labels and semantic HTML
- ✅ Component exports properly for use in login page

---

#### Task 3.2: Update Login Page UI ✅
**Objective**: Integrate OAuth buttons into existing login page

**Subtasks**:
- [x] Import `OAuthButtons` component (or individual buttons) into `src/app/login/page.tsx`
- [x] Add horizontal divider (OR separator) between OAuth buttons and magic link form
- [x] Layout OAuth buttons in responsive grid or vertical stack above email form
- [x] Wire OAuth button onClick handlers to call `signInWithGoogle()` and `signInWithGitHub()` from context
- [x] Add error handling to show toast notifications if OAuth fails
- [x] Update page layout to maintain visual hierarchy (OAuth options prominent, email form below)

**Validation Criteria**:
- ✅ Login page shows both OAuth buttons and magic link form
- ✅ Visual separator (OR divider) between auth methods
- ✅ OAuth buttons trigger authentication flow when clicked
- ✅ Error toasts appear if OAuth authentication fails
- ✅ Layout remains responsive on mobile (buttons stack vertically)
- ✅ Existing magic link functionality unaffected

---

#### Task 3.3: Create OAuth Callback Route ✅
**Objective**: Implement server-side callback route to handle OAuth code exchange with PKCE flow

**Subtasks**:
- [x] Create `src/app/auth/callback/route.ts` file
- [x] Import `createClient` from `@/utils/supabase/server` (server-side client from Task 1.4)
- [x] Extract `code` from `searchParams` and validate it exists
- [x] Extract optional `next` parameter for post-auth redirect (default to `/`)
- [x] Call `supabase.auth.exchangeCodeForSession(code)` to exchange OAuth code for session
- [x] Handle errors gracefully (redirect to error page if code exchange fails)
- [x] Redirect to home page or specified `next` URL after successful authentication
- [x] Add proper error handling and logging for debugging

**Validation Criteria**:
- ✅ Route file created at `src/app/auth/callback/route.ts`
- ✅ Properly extracts and validates OAuth `code` from URL
- ✅ Successfully exchanges code for session using server-side client
- ✅ Redirects to correct destination after authentication
- ✅ Error handling provides user feedback
- ✅ Route is a server component (no 'use client' directive)
- ✅ No TypeScript errors

**References**:
- [Supabase GitHub OAuth Callback Example](https://supabase.com/docs/guides/auth/social-login/auth-github#nextjs)
- [Next.js 14 Route Handlers Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

### Phase 4: Avatar & Profile Hooks Implementation

#### Task 4.1: Create useCurrentUserImage Hook ✅
**Objective**: Build hook to extract profile image from user metadata

**Subtasks**:
- [x] Create `src/hooks/use-current-user-image.ts` file
- [x] Import `useAuth` to access current user
- [x] Extract avatar URL from multiple possible metadata paths: `user.user_metadata.avatar_url`, `user.user_metadata.picture`, `user.user_metadata.image_url` (different providers use different field names)
- [x] Handle case where metadata is empty (return null for no avatar)
- [x] Add TypeScript return type `string | null`
- [x] Add JSDoc comment explaining hook behavior, fallback chain, and return value

**Validation Criteria**:
- ✅ Hook file created at correct path `src/hooks/use-current-user-image.ts`
- ✅ Hook returns `string | null` (URL or null)
- ✅ Properly extracts avatar from OAuth provider metadata across Google, GitHub, and other providers
- ✅ Handles multiple provider field names (avatar_url, picture, image_url)
- ✅ Returns null gracefully when no avatar exists
- ✅ Includes TypeScript types and JSDoc documentation explaining fallback chain
- ✅ No console errors when hook is used

---

#### Task 4.2: Create useCurrentUserName Hook ✅
**Objective**: Build hook to extract display name from user metadata

**Subtasks**:
- [x] Create `src/hooks/use-current-user-name.ts` file
- [x] Import `useAuth` to access current user
- [x] Extract display name from `user.user_metadata.full_name` or `user.user_metadata.display_name`
- [x] Fall back to `user.email` if no display name exists
- [x] Fall back further to email prefix (username before @) if no metadata
- [x] Add TypeScript return type and JSDoc documentation

**Validation Criteria**:
- ✅ Hook file created at `src/hooks/use-current-user-name.ts`
- ✅ Hook returns user-friendly display name
- ✅ Properly falls back through display_name → email → email prefix
- ✅ Returns string (never null/undefined)
- ✅ Includes JSDoc explaining fallback chain
- ✅ No runtime errors when used

---

### Phase 5: CurrentUserAvatar Component

#### Task 5.1: Create CurrentUserAvatar Component ✅
**Objective**: Build avatar component following Supabase UI patterns

**Subtasks**:
- [x] Create `src/components/auth/current-user-avatar.tsx` component
- [x] Import `Avatar`, `AvatarImage`, `AvatarFallback` from `@/components/ui/avatar`
- [x] Use `useCurrentUserImage()` hook to get avatar URL
- [x] Use `useCurrentUserName()` hook to get display name
- [x] Generate initials from display name by splitting on spaces and taking first letter of each word
- [x] Render `AvatarImage` with `src={profileImage}` and `alt={name}`
- [x] Render `AvatarFallback` with initials (uppercase)
- [x] Handle case where profileImage is null (show only fallback)
- [x] Add 'use client' directive for client-side rendering

**Validation Criteria**:
- ✅ Component file created at `src/components/auth/current-user-avatar.tsx`
- ✅ Component uses both custom hooks (image and name hooks)
- ✅ Initials generated correctly from multiple words (e.g., "John Doe" → "JD")
- ✅ Avatar fallback shows initials when no image exists
- ✅ Avatar image displays correctly when OAuth provides one
- ✅ Component is client component (has 'use client')
- ✅ No console warnings about missing alt text or hydration

---

#### Task 5.2: Export Avatar Component ✅
**Objective**: Make component available for import

**Subtasks**:
- [x] Export `CurrentUserAvatar` as default or named export
- [x] Check if components should be exported from `src/components/auth/index.ts` (create if doesn't exist)
- [x] Verify export syntax matches project conventions

**Validation Criteria**:
- ✅ Component can be imported via `import { CurrentUserAvatar } from '@/components/auth/current-user-avatar'`
- ✅ Any index.ts barrel exports are updated
- ✅ Import path follows project structure

---

### Phase 6: Profile Integration

#### Task 6.1: Replace Avatar in ConversationSidebarProfile ✅
**Objective**: Update profile section to use new avatar component

**Subtasks**:
- [x] Open `src/components/conversations/conversation-sidebar-profile.tsx`
- [x] Import `CurrentUserAvatar` from `@/components/auth/current-user-avatar`
- [x] Replace existing `Avatar` + `AvatarFallback` implementation with `<CurrentUserAvatar />`
- [x] Update display name logic to use `user.user_metadata.full_name` or fallback to email
- [x] Keep existing email display in subtitle
- [x] Maintain existing logout functionality and styling

**Validation Criteria**:
- ✅ Profile section uses `CurrentUserAvatar` component
- ✅ Display name shows OAuth name when available
- ✅ Email still displays correctly in subtitle
- ✅ Existing layout and styling preserved
- ✅ Logout button still works
- ✅ No visual regressions in profile section

---

### Phase 7: Testing & Validation

**Note**: OAuth flow requires the callback route created in Task 3.3. The flow works as follows: (1) User clicks OAuth button → (2) Redirects to provider (Google/GitHub) → (3) Provider redirects back to `/auth/callback` → (4) Server exchanges code for session → (5) User redirected to app.

#### Task 7.1: Test Magic Link Authentication Flow
**Objective**: Verify existing magic link still works

**Subtasks**:
- [ ] Test login flow with email magic link on login page
- [ ] Verify email is received (check Inbucket at `http://localhost:54324`)
- [ ] Click magic link from email
- [ ] Confirm user is authenticated and redirected to home
- [ ] Check that session persists across page refreshes
- [ ] Verify profile section shows correct email and initials

**Validation Criteria**:
- ✅ Magic link email is sent successfully
- ✅ User can authenticate via magic link
- ✅ Session persists after redirect
- ✅ Profile shows correct information
- ✅ No console errors during magic link flow

---

#### Task 7.2: Test Google OAuth Authentication Flow
**Objective**: Verify Google OAuth integration works

**Subtasks**:
- [ ] Click "Continue with Google" button on login page
- [ ] Complete OAuth consent flow on Google (must be logged into Google)
- [ ] Verify redirect back to app callback route
- [ ] Confirm user is authenticated and redirected to home
- [ ] Check that profile shows Google display name and avatar
- [ ] Test logout and login again to verify session handling

**Validation Criteria**:
- ✅ OAuth redirect to Google works
- ✅ User can consent and authenticate via Google
- ✅ Profile shows Google avatar image (if available)
- ✅ Profile shows Google display name
- ✅ Session persists correctly
- ✅ No console errors during Google OAuth flow

---

#### Task 7.3: Test GitHub OAuth Authentication Flow
**Objective**: Verify GitHub OAuth integration works

**Subtasks**:
- [ ] Click "Continue with GitHub" button on login page
- [ ] Complete OAuth consent flow on GitHub (must be logged into GitHub)
- [ ] Verify redirect back to app callback route
- [ ] Confirm user is authenticated and redirected to home
- [ ] Check that profile shows GitHub display name and avatar
- [ ] Test logout and login again to verify session handling

**Validation Criteria**:
- ✅ OAuth redirect to GitHub works
- ✅ User can consent and authenticate via GitHub
- ✅ Profile shows GitHub avatar image (if available)
- ✅ Profile shows GitHub display name
- ✅ Session persists correctly
- ✅ No console errors during GitHub OAuth flow

---

#### Task 7.4: Test Account Linking Behavior (Critical)
**Objective**: Document and verify how Supabase handles accounts with the same email across different providers

**Subtasks**:
- [ ] Sign up with magic link using email `test@example.com` - note the created user ID
- [ ] Log out completely
- [ ] Attempt to sign in with Google OAuth using the same email `test@example.com` - note the new user ID
- [ ] **Document behavior**: These will be TWO separate accounts (User A vs User B) - Supabase does NOT auto-link accounts
- [ ] Test reverse scenario: sign up with GitHub first, then try magic link with same email
- [ ] Verify that Supabase creates separate user entries in `auth.users` table for each auth method
- [ ] Document this behavior in README or docs (users should use one auth method consistently)
- [ ] Test error message clarity if user tries to switch methods

**Validation Criteria**:
- ✅ Understanding documented: same email = different accounts unless manually linked
- ✅ Test confirms separate user IDs created for each auth method with same email
- ✅ No data loss - each account maintains its own data
- ✅ Clear documentation for users about account behavior
- ✅ Team understands account linking requires manual intervention if needed
- ✅ Consider enabling `enable_manual_linking = true` in config.toml if users need this feature

**Important Note**: Supabase does NOT automatically link accounts with the same email from different providers for security reasons (prevents account hijacking). If account linking is desired, it requires enabling `enable_manual_linking = true` and implementing a manual linking flow, which is outside the scope of this initial OAuth implementation.

---

### Phase 8: Documentation & Deployment

#### Task 8.1: Validate Environment Variables Before OAuth Implementation
**Objective**: Ensure all required OAuth environment variables are properly configured

**Subtasks**:
- [ ] Create environment variable validation helper in `src/lib/supabase/client.ts` or separate file
- [ ] Check for required variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- [ ] Validate env vars at app startup or in AuthContext initialization
- [ ] Show helpful error messages if OAuth env vars are missing when OAuth methods are called
- [ ] Add runtime checks before calling `signInWithOAuth` to prevent cryptic errors

**Validation Criteria**:
- ✅ Validation logic checks all required OAuth environment variables
- ✅ Clear error messages guide developers to configure missing variables
- ✅ No cryptic Supabase errors from missing OAuth credentials
- ✅ Graceful fallback behavior if OAuth is not configured

---

#### Task 8.2: Update Project Documentation
**Objective**: Document OAuth integration for team and users

**Subtasks**:
- [ ] Update `README.md` to mention OAuth support alongside magic link
- [ ] Document supported OAuth providers (Google, GitHub)
- [ ] Add setup instructions for OAuth environment variables
- [ ] Document any production configuration differences (redirect URLs)
- [ ] Add screenshots of login page showing OAuth options

**Validation Criteria**:
- ✅ README includes OAuth setup instructions
- ✅ Environment variables documented
- ✅ Production redirect URLs listed
- ✅ Visual guide (screenshots) included
- ✅ Team can follow docs to deploy OAuth to production

---

#### Task 8.3: Prepare for Production Deployment
**Objective**: Ensure OAuth works in production environment

**Subtasks**:
- [ ] Add production redirect URLs to Google OAuth console
- [ ] Add production redirect URLs to GitHub OAuth console
- [ ] Update Supabase project settings to allow production redirect URL
- [ ] Set production environment variables in Vercel/destination platform
- [ ] Test OAuth flow in production staging environment

**Validation Criteria**:
- ✅ Production OAuth apps configured in Google and GitHub consoles
- ✅ Supabase project allows production redirects
- ✅ Environment variables set in production environment
- ✅ OAuth works in production (staging tested)
- ✅ No console errors in production

---

## 📊 Summary

This implementation plan integrates OAuth authentication (Google and GitHub) alongside existing magic link authentication in the YouTube-GPT application. The plan follows a phased approach:

1. **Setup & Configuration**: Enable OAuth providers in Supabase config, configure redirect URLs, create server-side client, and document setup
2. **Context Enhancement**: Add OAuth methods to AuthContext with proper redirect URLs to callback route
3. **UI & Callback**: Create OAuth buttons, update login page, and implement server-side callback route for PKCE code exchange
4. **Avatar Hooks**: Build hooks to extract user metadata (image, name) with fallback chains
5. **Avatar Component**: Implement CurrentUserAvatar following Supabase UI patterns
6. **Profile Integration**: Replace profile avatar with new component in sidebar
7. **Testing**: Comprehensive testing of all authentication flows including account linking behavior
8. **Documentation**: Update docs for team and production deployment with environment validation

**Critical Implementation Details:**
- **Server-Side Callback Route** (Task 3.3): Required for Next.js App Router with PKCE flow to exchange OAuth code for session
- **Server-Side Supabase Client** (Task 1.4): Uses `@supabase/ssr` for proper cookie-based session management in Next.js

**Key Implementation Notes:**
- **OAuth Callback Route Required**: With Next.js App Router and PKCE flow, a server-side callback route (`/auth/callback`) is required to exchange the OAuth code for a session. This is different from client-side-only implementations.
- **Server-Side Client**: Uses `@supabase/ssr` package with Next.js `cookies()` API for proper SSR session handling
- **Redirect Flow**: OAuth flow redirects to provider → back to `/auth/callback` → code exchange → redirect to app
- **Account Linking**: Supabase does NOT auto-link accounts with the same email from different providers (separate accounts for security)
- **Metadata Extraction**: Multiple avatar metadata paths supported (avatar_url, picture, image_url) for different OAuth providers
- **Environment Validation**: Environment variable validation ensures graceful failures if OAuth is not configured
- **Error Handling**: Proper error handling for popup blockers, consent rejection, and network failures

The implementation enhances user experience by offering multiple sign-in options while maintaining compatibility with existing magic link functionality. Users authenticating via OAuth will automatically get profile pictures and display names from their social accounts, while magic link users retain the current email-based experience.

