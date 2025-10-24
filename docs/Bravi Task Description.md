# Founding Engineer Bravi

<aside>
💡

**Timebox:** ~1 week (6–12h recommended)

**Goal:** Build a full-stack AI product feature from a high-level brief, making your own architecture, schema, and implementation choices.

</aside>

## **1. About Bravi**

Bravi is building the unified communication layer for home-services companies (shutters, solar panels, etc.). We deliver AI receptionists (voice/chat), outbound campaigns, transcription & labeling, CRM for conversations, and automation workflows.

We move quickly, build vertical slices end-to-end, and care deeply about **design quality, reliability, and scalability**.

This test simulates how we work: you’ll take a high-level product request and **imagine, design, and ship** the full solution ✨.

## **2. 🤓 The User & Their Goal**

You will build an **intelligent YouTube search app** that helps users instantly find information hidden inside hours of video content.

Users can add individual videos or full channels to create a searchable personal knowledge base. They can search across one or multiple videos, ask AI questions, and get grounded answers with citations and timestamps.

You are building for a user who:

- Watches YouTube videos or follows YouTube channels.
- Wants to **find specific information quickly** in their videos.
- Wants to **turn that knowledge into shareable content** (LinkedIn posts, summaries, outlines).
- Needs answers to be **trustworthy and grounded** in sources (citations, timestamps).

**Example jobs-to-be-done:**

1. “What are the three pricing strategies mentioned in this video?”
2. “Summarize the learnings of the selected videos from into a LinkedIn post.”
3. “Find every mention of ‘maintenance cost idea’ in my selected videos and their timestamp”
4. “Can you find all the videos talking about Claude code, and do a linkedin post about the best practices using bullet points”

## **3. 🏗️ What to Build**

A **three-column web app** (ChatGPT-style):

- **Left column:** Conversation history. Profile section at bottom.
- **Center:** Real-time Chat and a Compose mode for generating structured outputs.
- **Right column:** Knowledge Base (KB) Explorer with:
  - Video list, search, filtering, and selection
  - **Add YouTube content input directly in this column** (video or channel)

The user can:

- Paste a **YouTube video** or **channel** link in the right column.
- If channel: automatically ingest the **latest 10 videos** from that channel.
- Search and filter their KB.
- **Multi-select videos** to use as the **active context** for chat and compose modes.
- Chat with an AI that only searches within the current context.
- Generate content (LinkedIn posts, summaries, outlines) from the scoped videos.
- Browse conversation history, restore scope, and manage their profile/theme.
  ![This is an example of what we built for Bravi’s clients, where they can upload documents to the knowledge base, and have a chat to interact with the documents. You’ll be building the same but instead of docs it will be youtube videos.](attachment:f48dbcff-a14e-4231-8780-cb2ddb3f13fa:Screenshot_2025-08-10_at_11.52.51.png)
  This is an example of what we built for Bravi’s clients, where they can upload documents to the knowledge base, and have a chat to interact with the documents. You’ll be building the same but instead of docs it will be youtube videos.

## **4. ⚠️ Required Technologies**

- **Next.js (App Router)**
- **Server Actions**
- **Supabase** (Auth, DB, Storage, Realtime, RLS)
- **Supabase Database** (PostgreSQL with built-in ORM)
- **Vercel** (deployment)
- **shadcn/ui** + **Tailwind CSS**
- **Inngest** (background jobs)
- **ZeroEntropy** (embeddings/vector search)
- **Your choice of LLM** (Recommended: Claude)
- **Realtime chat** (SSE or Supabase Realtime)

<aside>
💡

It’s important that you stick to this stack!

</aside>

## **5. Feature Expectations**

### **Authentication & Profile**

- Simple User authentication (magic link or OAuth).
- Profile section in left column bottom:
  - User info (name, email, avatar if available)
  - Logout button
  - Dark/light mode toggle (persisted)

### **Knowledge Base Explorer (Right Column)**

- **Top of column:** input to paste a YouTube link (video or channel).
- Detect type:
  - Video → ingest that video.
  - Channel → ingest latest 10 videos from that channel.
- Show ingestion status (queued → processing → ready / failed) next to each video.
- Allow retry for failed ingestions.
- List videos with thumbnail, title, and key metadata.
- Search and filter.
- **Multi-select videos** with checkboxes.
- Toolbar appears when ≥1 selected: “Use as Context” / “Clear Selection”.

### **Scope-Aware Chat (Center Column)**

- Modes:
  1. **All videos** (default)
  2. **Subset** (one or several selected)
- Scope bar with chips for each scoped video and a “Reset to All” button.
- Retrieval only searches in scoped videos.
- Streamed responses with **citations** (video title + timestamp).
- Clicking citation opens video at that timestamp.
- When a tool is used (for instance RAG tool), something should appear in the frontend to notify that the tool is used in the backend (similar to when chatgpt does an internet search)

### **Conversation History (Left Column)**

- List past conversations (title auto-generated from first message or editable).
- Click to restore conversation **and its scope**.
- “New Chat” button.

### **Observability & Metrics**

- Mini-metrics: total videos, total conversations, last ingestion time, recent failures.
- Clear empty/error states.
- User feedback for success/failure actions.

## **6. Design Expectations**

- Use **shadcn/ui** and Tailwind with thoughtful spacing, typography, and visual hierarchy.
- Clear states: empty, loading, error, success.
- Responsive layout; accessible interactions; keyboard-friendly chat input.
- Polished scope chips, selection toolbar, and profile section.
- **Add video/channel input should feel like part of the KB** — not a separate screen.

<aside>
💡

The user experience will be super important for this test!

</aside>

## **7. Use of AI Coding Tools**

This exercise is **not realistically doable without leveraging AI coding tools** such as **Cursor, Claude Code, GitHub Copilot, ChatGPT, etc.**

We will evaluate **how** you use these tools:

- How you break down the problem into prompts.
- How you review, edit, and integrate AI-generated code.
- Whether you maintain code clarity and quality while moving quickly.
- How you balance speed vs. correctness vs. design.

You are expected to:

- Use AI to accelerate development.
- Still write and adapt code thoughtfully

## **8. Deliverables**

1. **Deployed app** on Vercel (live URL).
2. **GitHub repo** with:
   - `README.md` including:
     - Screenshots/GIFs
     - Setup instructions
     - Architecture diagram
     - Design decisions & trade-offs
     - Retrieval/scoping approach
     - Known limitations & next steps
   - `.env.example`
3. **Loom video** (≤5 min) demo showing:
   - Adding a channel (auto-ingest 10 videos) + a single video via right column input
   - Multi-select scope in KB Explorer and asking a scoped question
   - Restoring scope from conversation history
   - Profile section (theme toggle, logout)
4. A call with Pierre-Habté to discuss the process, improvements etc

## **9. Evaluation Criteria**

- **Product thinking (20%)** — Is the UX natural? Is scope selection clear? Are outputs useful?
- **Full-stack execution (20%)** — Clean architecture, correct use of Supabase/Auth, background jobs work.
- **AI/RAG quality (15%)** — Relevant, grounded answers with accurate citations and timestamps.
- **Design & craft (15%)** — Visual polish, responsiveness, accessible basics.
- **Reliability (10%)** — Error handling, retries, user feedback.
- AI coding flow **(20%)**

**Bonus points:**

- Langfuse traces
- video preview in chat
- any other thing you think is cool

## Resources

- https://www.npmjs.com/package/youtube-transcript
- https://vercel.com/templates/next.js/nextjs-ai-chatbot
- https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
- https://platform.openai.com/docs/guides/function-calling
- https://docs.zeroentropy.dev/introduction
- https://www.youtube.com/watch?v=LsEqkdVXjvI&t=100s
- https://www.youtube.com/watch?v=PRqHKpTHQVE
- https://www.youtube.com/watch?v=amEUIuBKwvg
- https://www.inngest.com/docs?ref=nav
