# Component Reorganization Plan

## 🧠 Context about Project

YouTube-GPT is an AI-powered YouTube knowledge management platform that helps content creators, researchers, and learners efficiently extract, search, and repurpose information from video content. The application allows users to build a searchable knowledge base from YouTube videos and channels, enabling them to ask questions and get AI-powered answers with citations and timestamps. Built with Next.js 14 (App Router), the platform uses Supabase for authentication and data storage, ZeroEntropy for vector search, Claude for AI, and Inngest for background job processing. The current system has functional video ingestion, transcription, embedding generation, and RAG-powered chat, but the component structure is flat and inconsistent, making it difficult to maintain and extend.

## 🏗️ Context about Feature

The current components folder has all React components in a flat directory structure at `/src/components/` with inconsistent naming conventions (mix of PascalCase and kebab-case). This creates several issues: hard to locate related components, unclear organization by domain/feature, duplicate logic across files, and challenges with imports. The architecture uses Context API (AuthContext, ConversationContext, VideoSelectionContext) and custom hooks (useVideos, useAuth) for state management. Key components include ConversationSidebar, ChatArea, KnowledgeBase, VideoCard, and various shared utilities. The reorganization will group components by feature/domain while maintaining all existing functionality, import paths, and component interfaces.

## 🎯 Feature Vision & Flow

The reorganized structure will follow Next.js 14 conventions and modern React patterns: feature-based grouping (`layout/`, `chat/`, `knowledge-base/`, `video/`), consistent kebab-case naming, separation of container/presentational components, and clearer import paths. Users will experience no changes—the UI and functionality remain identical—while developers benefit from improved discoverability, maintainability, and scalability. The implementation will preserve all existing exports, props, and component behavior, requiring only import statement updates across the codebase.

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Create New Directory Structure

- [x] **Create feature directories** in `src/components/`
  - Create `layout/` folder for layout-related components
  - Create `chat/` folder for chat feature components  
  - Create `knowledge-base/` folder for KB feature components
  - Create `video/` folder for shared video-related components
  - Keep `ui/` folder as-is (shadcn components)

- [x] **Create directory structure**
  ```bash
  mkdir -p src/components/layout
  mkdir -p src/components/chat
  mkdir -p src/components/knowledge-base
  mkdir -p src/components/video
  ```

### Phase 2: Move and Rename Components

- [x] **Move layout components** to `src/components/layout/`
  - Rename `ConversationSidebar.tsx` → `conversation-sidebar.tsx` and move to `layout/`
  - Update component exports to use kebab-case naming
  - Rename `ThemeToggle.tsx` → `theme-toggle.tsx` and move to `layout/`

- [x] **Move chat components** to `src/components/chat/`
  - Rename `ChatArea.tsx` → `chat-area.tsx` and move to `chat/`
  - Rename `ChatMessage.tsx` → `chat-message.tsx` and move to `chat/`
  - Rename `video-reference-card.tsx` → `video-reference-card.tsx` and move to `chat/`

- [x] **Move knowledge base components** to `src/components/knowledge-base/`
  - Rename `KnowledgeBase.tsx` → `knowledge-base.tsx` and move to `knowledge-base/`
  - Rename `VideoList.tsx` → `video-list.tsx` and move to `knowledge-base/`
  - Rename `VideoCard.tsx` → `video-card.tsx` and move to `knowledge-base/`

- [x] **Move video components** to `src/components/video/`
  - Rename `video-scope-bar.tsx` → `video-scope-bar.tsx` and move to `video/`
  - Create index file in `video/` to export all video components

- [x] **Remove old files** after confirming everything works
  - Keep old files until all tests pass
  - Delete original files from root components folder

### Phase 3: Update Import Statements Across Codebase

- [x] **Update imports in app files**
  - Update `src/app/page.tsx` to import from new locations
  - Update `src/app/login/page.tsx` if it imports components (N/A - no component imports)
  - Update `src/app/providers.tsx` if it imports components (N/A - no component imports)

- [x] **Update imports in other components**
  - Update imports in `layout/conversation-sidebar.tsx` for ThemeToggle
  - Update imports in `chat/chat-area.tsx` for VideoScopeBar, ChatMessage
  - Update imports in `knowledge-base/knowledge-base.tsx` for VideoList
  - Update imports in `knowledge-base/video-list.tsx` for VideoCard

- [x] **Update imports in hooks and contexts**
  - Check `src/hooks/use-toast.ts` for any component imports (N/A - no component imports)
  - Update any context files that import components (N/A - no component imports)

- [x] **Update imports in lib files**
  - Check `src/lib/` for any component imports (N/A - no component imports)
  - Update if necessary

### Phase 4: Verify and Test

- [x] **Test build** to ensure no import errors
  - Run `pnpm build` to check for compilation errors
  - Fix any import path issues

- [x] **Test application functionality**
  - Start dev server with `pnpm dev`
  - Verify ConversationSidebar loads and functions
  - Verify ChatArea loads and functions
  - Verify KnowledgeBase loads and functions
  - Test all interactive features (selection, chat, scope)

- [x] **Check for broken references**
  - Search for old import paths that weren't updated
  - Run `grep -r "from '@/components/[A-Z]"` to find PascalCase imports
  - Fix any remaining import issues

### Phase 5: Cleanup and Documentation

- [x] **Remove old files** after verification
  - Delete original `ConversationSidebar.tsx`, `ChatArea.tsx`, etc. from root
  - Keep git history for reference

- [x] **Create index files** for cleaner imports (optional enhancement)
  - Create `src/components/layout/index.ts` to export all layout components
  - Create `src/components/chat/index.ts` to export all chat components
  - Create `src/components/knowledge-base/index.ts` to export all KB components
  - Create `src/components/video/index.ts` to export all video components

- [x] **Update any documentation**
  - Update README if it references component structure (N/A - no references)
  - Update any architecture docs (N/A - no docs)

### Phase 6: Final Verification

- [x] **Run full test suite** (if tests exist)
  - Execute `pnpm test` if tests are configured (N/A - no tests configured)
  - Fix any failing tests related to imports

- [x] **Verify production build**
  - Run `pnpm build` one final time
  - Ensure no build errors or warnings
  - Test production build locally

- [x] **Check git diff** for sanity
  - Review `git diff` to ensure only expected changes
  - Verify no unintended deletions or modifications

