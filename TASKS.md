# VideoList and VideoCard Components Implementation Plan

## 🧠 Context about Project

YouTube-GPT is a full-stack AI-powered YouTube search application that helps users instantly find information hidden inside hours of video content. Users can add individual videos or full channels to create a searchable personal knowledge base, search across multiple videos, ask AI questions, and get grounded answers with citations and timestamps. The application uses Next.js with Supabase for backend services, shadcn/ui for components, and implements a three-column ChatGPT-style interface with a Knowledge Base Explorer in the right column. The system is currently in development with basic URL processing functionality implemented.

## 🏗️ Context about Feature

The Knowledge Base Explorer currently has a URL input form and placeholder document display, but lacks proper video listing functionality. The new VideoList and VideoCard components will replace the current generic document display with a specialized video-focused interface. These components will integrate with the existing YouTube URL processing workflow and display video metadata including thumbnails, titles, channel information, and processing status. The components will be positioned between the URL input form and the footer metrics, providing a dedicated space for video management within the Knowledge Base column.

## 🎯 Feature Vision & Flow

The VideoList component will render a scrollable list of VideoCard components, each displaying essential video information in a card format. Each VideoCard will show a YouTube thumbnail image, video title, channel name, and processing status badge. The cards will be clickable and provide visual feedback for different processing states (queued, processing, ready, failed). The list will be responsive and integrate seamlessly with the existing Knowledge Base layout, replacing the current generic document display. Users will be able to see their uploaded videos at a glance and understand their processing status.

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Create VideoCard Component using shadcn/ui
- [ ] Create `src/components/VideoCard.tsx` file using shadcn/ui Card component as base
- [ ] Define VideoCardProps interface with title, thumbnailUrl, channel, status, and videoId properties
- [ ] Implement card layout using Card, CardContent, and CardHeader components from shadcn/ui
- [ ] Use Badge component for processing status with appropriate variants (default, secondary, destructive)
- [ ] Add Avatar component for channel thumbnails and proper image handling with fallbacks
- [ ] Include Skeleton component for loading states and placeholder content

### Task 2: Create VideoList Component with shadcn/ui patterns
- [ ] Create `src/components/VideoList.tsx` file using ScrollArea component from shadcn/ui
- [ ] Define VideoListProps interface accepting array of video objects with proper typing
- [ ] Implement scrollable container using ScrollArea with proper spacing and layout
- [ ] Add empty state using Alert component with AlertDescription for "no videos" message
- [ ] Use Separator component to divide video cards and maintain visual hierarchy
- [ ] Include proper TypeScript types and shadcn/ui component composition

### Task 3: Integrate Components into KnowledgeBase with shadcn/ui
- [ ] Import VideoList and VideoCard components into KnowledgeBase.tsx
- [ ] Replace existing document display section with VideoList component using proper shadcn/ui layout
- [ ] Update video data structure to match VideoCard props requirements with proper typing
- [ ] Add placeholder video data using shadcn/ui Skeleton components for loading states
- [ ] Ensure proper positioning between URL input and footer metrics using shadcn/ui spacing utilities

### Task 4: Add Processing Status Logic with shadcn/ui components
- [ ] Define processing status types (queued, processing, ready, failed) with proper TypeScript enums
- [ ] Implement status badges using Badge component with appropriate variants and colors
- [ ] Add status-specific visual indicators using Loader2 icon for processing and AlertCircle for errors
- [ ] Use Progress component to show processing progress when available
- [ ] Ensure status updates are reflected in the UI components with proper state management

### Task 5: Style and Polish Components with shadcn/ui design system
- [ ] Apply consistent styling using shadcn/ui design tokens and CSS variables
- [ ] Add hover states using Button component variants (ghost, hover) for interactive video cards
- [ ] Use Tooltip component for additional video information on hover
- [ ] Ensure responsive design works within the Knowledge Base column using shadcn/ui responsive utilities
- [ ] Add proper spacing using shadcn/ui spacing system and typography using shadcn/ui text utilities
- [ ] Test component appearance with different video data scenarios and edge cases
