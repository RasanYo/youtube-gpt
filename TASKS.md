# Video URL Input Feature Implementation Plan

## 🧠 Context about Project
**Brief Summary (10–15 lines):**
This is a full-stack AI-powered YouTube search application called "YouTube-GPT" that helps users find information hidden inside hours of video content. Users can add individual videos or full channels to create a searchable personal knowledge base, search across multiple videos, ask AI questions, and get grounded answers with citations and timestamps. The system uses Next.js with App Router, Supabase for auth/database, Prisma as ORM, and processes videos through background jobs with Inngest. The current state shows a three-column ChatGPT-style interface with a Knowledge Base Explorer on the right that currently has a placeholder "Add Document" button.

## 🏗️ Context about Feature (10–15 lines)
The Knowledge Base Explorer currently displays an empty state with a static "Add Document" button in the footer. This feature needs to replace that button with a text input field and "Load" button to accept YouTube video URLs. The input will be processed by a server action that validates the URL and logs it to console. This is a foundational step before implementing the full video ingestion pipeline that will eventually process videos through Inngest background jobs, extract transcripts, generate embeddings, and make content searchable.

## 🎯 Feature Vision & Flow (10–15 lines)
Users will see a text input field with placeholder "Paste YouTube video URL" and a "Load" button in the Knowledge Base footer. When they paste a YouTube URL and click "Load", the form submits to a server action that validates the URL format, extracts the video ID, and console.logs the URL. The UI should provide immediate feedback (loading state) and handle basic validation errors. This creates the foundation for the full video ingestion workflow that will later process videos, extract metadata, and add them to the searchable knowledge base.

## 📋 Implementation Plan: Tasks & Subtasks

### Task 1: Create Server Action for Video URL Processing
- [ ] Create `app/actions/youtube.ts` file
- [ ] Implement `addVideoUrl` server action that accepts a video URL string
- [ ] Add basic URL validation to ensure it's a YouTube video URL
- [ ] Extract video ID from the URL using regex or URL parsing
- [ ] Console.log the received URL and extracted video ID
- [ ] Add proper error handling for invalid URLs

### Task 2: Update KnowledgeBase Component UI
- [ ] Replace the "Add Document" button with a form containing input and button
- [ ] Add state management for the URL input value using useState
- [ ] Import and use the Input component from shadcn/ui
- [ ] Add form submission handler that calls the server action
- [ ] Add loading state during form submission
- [ ] Update button text from "Add Document" to "Load"
- [ ] Add proper form validation and error display

### Task 3: Test and Validate Implementation
- [ ] Test with valid YouTube video URLs (standard and short formats)
- [ ] Test with invalid URLs to ensure proper error handling
- [ ] Verify console.log output shows correct URL and video ID
- [ ] Test loading states and form reset after submission
- [ ] Ensure UI remains responsive and accessible
