# 🚀 Bravi YouTube AI - Roadmap Détaillée

**Temps total estimé:** 12-14 heures  
**Stack:** Next.js 14 (App Router) • Supabase • Prisma • Inngest • ZeroEntropy • Claude API • shadcn/ui

---

## 📋 Step 1 – Project Bootstrap & Skeleton Deployment

**🎯 Goal:** Scaffolder et déployer un squelette production-ready avec auth, UI système, et layout 3 colonnes.

**⏱️ Temps estimé:** ~2 heures

### ✅ TODO List

#### 1.1 Project Generation & Setup

- [ ] Créer un nouveau projet Next.js avec TypeScript
  ```bash
  npx create-next-app@latest bravi-youtube-ai --typescript --tailwind --app --eslint
  cd bravi-youtube-ai
  ```
- [ ] Initialiser Git et créer repo GitHub
  ```bash
  git init
  gh repo create bravi-youtube-ai --public --source=. --remote=origin
  git add .
  git commit -m "Initial commit: Next.js setup"
  git push -u origin main
  ```
- [ ] Configurer `.gitignore` pour inclure `.env`, `.env.local`, `node_modules`, `.next`

#### 1.2 Tailwind & Dark Mode Configuration

- [ ] Configurer dark mode dans `tailwind.config.ts`
  ```typescript
  module.exports = {
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          border: 'hsl(var(--border))',
          background: 'hsl(var(--background))',
          foreground: 'hsl(var(--foreground))',
          // ... shadcn colors
        },
      },
    },
  }
  ```
- [ ] Ajouter variables CSS dans `app/globals.css` pour thème light/dark
- [ ] Tester le toggle dark/light mode avec Tailwind class strategy

#### 1.3 shadcn/ui Installation

- [ ] Initialiser shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] Installer les composants de base
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
- [ ] Créer composant `ThemeToggle` avec next-themes
  ```bash
  npm install next-themes
  ```
- [ ] Vérifier que tous les imports de composants fonctionnent correctement

#### 1.4 Three-Column Layout

- [ ] Créer `app/layout.tsx` avec structure de base
  ```typescript
  <div className="flex h-screen">
    <aside className="w-[18%] border-r">{/* Left: History */}</aside>
    <main className="flex-1">{/* Center: Chat */}</main>
    <aside className="w-[30%] border-l">{/* Right: KB */}</aside>
  </div>
  ```
- [ ] Créer composants placeholder:
  - `components/layout/ConversationSidebar.tsx` (gauche)
  - `components/layout/ChatArea.tsx` (centre)
  - `components/layout/KnowledgeBase.tsx` (droite)
- [ ] Rendre le layout responsive avec Tailwind breakpoints
- [ ] Ajouter sticky positioning pour headers de colonnes

#### 1.5 Supabase Setup

- [ ] Créer projet Supabase sur [supabase.com](https://supabase.com)
- [ ] Copier URL et anon key depuis Project Settings > API
- [ ] Installer dépendances Supabase
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [ ] Créer `lib/supabase/client.ts` (client-side)
  ```typescript
  import { createBrowserClient } from '@supabase/ssr'
  export const createClient = () =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  ```
- [ ] Créer `lib/supabase/server.ts` (server-side)
  ```typescript
  import { createServerClient } from '@supabase/ssr'
  // Helpers pour cookies dans Server Actions & Route Handlers
  ```
- [ ] Créer `lib/supabase/middleware.ts` pour auth refresh

#### 1.6 Authentication Setup

- [ ] Configurer Magic Link dans Supabase Dashboard > Authentication > Providers
- [ ] Créer page de login `app/login/page.tsx`
  ```typescript
  // Form avec email input + "Send Magic Link" button
  ```
- [ ] Créer Server Action pour magic link
  ```typescript
  // app/login/actions.ts
  'use server'
  export async function signInWithEmail(email: string) {
    const supabase = createServerClient(...)
    return await supabase.auth.signInWithOtp({ email })
  }
  ```
- [ ] Créer callback handler `app/auth/callback/route.ts`
- [ ] Protéger routes avec middleware dans `middleware.ts`
- [ ] Créer composant `ProfileSection` dans sidebar avec:
  - Avatar (ou initiales)
  - Nom + email de l'utilisateur
  - Bouton Logout
  - ThemeToggle
- [ ] Implémenter logout action
  ```typescript
  'use server'
  export async function signOut() {
    const supabase = createServerClient(...)
    await supabase.auth.signOut()
    redirect('/login')
  }
  ```
- [ ] Persister theme preference dans localStorage

#### 1.7 Prisma & Database Setup

- [ ] Installer Prisma
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- [ ] Configurer `prisma/schema.prisma` avec Supabase connection

  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }

  generator client {
    provider = "prisma-client-js"
  }
  ```

- [ ] Définir schéma minimal Phase 1

  ```prisma
  model User {
    id            String    @id @default(uuid())
    email         String    @unique
    name          String?
    avatarUrl     String?
    createdAt     DateTime  @default(now())
    updatedAt     DateTime  @updatedAt
    videos        Video[]
    conversations Conversation[]
  }

  model Video {
    id           String   @id @default(cuid())
    userId       String
    youtubeId    String   @unique
    title        String
    thumbnailUrl String?
    channelName  String?
    duration     Int?
    status       VideoStatus @default(QUEUED)
    error        String?
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt
    user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId, status])
  }

  enum VideoStatus {
    QUEUED
    PROCESSING
    READY
    FAILED
  }

  model Conversation {
    id        String   @id @default(cuid())
    userId    String
    title     String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    @@index([userId])
  }
  ```

- [ ] Créer et appliquer migration
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Générer Prisma Client
  ```bash
  npx prisma generate
  ```
- [ ] Créer `lib/prisma.ts` avec singleton
  ```typescript
  import { PrismaClient } from '@prisma/client'
  const globalForPrisma = global as unknown as { prisma: PrismaClient }
  export const prisma = globalForPrisma.prisma || new PrismaClient()
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
  ```

#### 1.8 Environment Variables

- [ ] Créer `.env.local` avec toutes les variables

  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

  # Database
  DATABASE_URL=your_postgres_connection_string

  # Will be added later
  ANTHROPIC_API_KEY=
  ZEROENTROPY_API_KEY=
  INNGEST_EVENT_KEY=
  INNGEST_SIGNING_KEY=
  ```

- [ ] Créer `.env.example` (sans valeurs sensibles)
- [ ] Ajouter `.env*` au `.gitignore`

#### 1.9 Infrastructure & Testing

- [ ] Créer route de health check `app/api/health/route.ts`
  ```typescript
  export async function GET() {
    return Response.json({ status: 'ok', timestamp: new Date().toISOString() })
  }
  ```
- [ ] Configurer ESLint
  ```bash
  npm install -D eslint-config-prettier
  ```
- [ ] Configurer Prettier
  ```bash
  npm install -D prettier
  echo '{"semi": false, "singleQuote": true}' > .prettierrc
  ```
- [ ] Ajouter scripts dans `package.json`
  ```json
  "scripts": {
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "format": "prettier --write .",
    "lint": "next lint"
  }
  ```

#### 1.10 Vercel Deployment

- [ ] Connecter repo GitHub à Vercel
- [ ] Configurer environment variables dans Vercel Dashboard
- [ ] Déployer et obtenir URL de production
- [ ] Tester login flow sur production
- [ ] Vérifier que le layout 3 colonnes s'affiche correctement
- [ ] Tester dark/light mode toggle
- [ ] Vérifier connexion DB avec `/api/health`

#### 1.11 UI Polish & Placeholders

- [ ] Ajouter bouton "New Chat" dans sidebar gauche
- [ ] Ajouter placeholder "No conversations yet" dans sidebar
- [ ] Ajouter mini-metrics footer dans KB column (right):
  - Total videos: 0
  - Last ingestion: Never
- [ ] Ajouter empty state dans chat area
- [ ] Tester responsive design sur mobile/tablet

### 🛠️ Tools/Technologies

- Next.js 14 (App Router)
- TypeScript
- Supabase (Auth + Postgres)
- Prisma ORM
- shadcn/ui + Tailwind CSS
- next-themes (dark mode)
- Vercel (deployment)

### ✅ Expected Outcome

- ✅ App déployée sur Vercel avec URL live
- ✅ Login/logout fonctionnel avec magic link
- ✅ Layout 3 colonnes responsive
- ✅ Dark/light mode toggle persisté
- ✅ Profile section avec user info
- ✅ Base de données Prisma connectée
- ✅ Variables d'environnement configurées
- ✅ Codebase propre prêt pour Step 2

---

## 📥 Step 2 – YouTube Ingestion Foundations

**🎯 Goal:** Construire le backend d'ingestion avec gestion d'état en temps réel via Inngest et Supabase Realtime.

**⏱️ Temps estimé:** ~2 heures

### ✅ TODO List

#### 2.1 YouTube Data API Setup

- [ ] Créer projet sur [Google Cloud Console](https://console.cloud.google.com)
- [ ] Activer YouTube Data API v3
- [ ] Créer API key et la copier
- [ ] Ajouter `YOUTUBE_API_KEY` dans `.env.local` et Vercel
- [ ] Installer package YouTube
  ```bash
  npm install youtube-transcript
  ```

#### 2.2 Inngest Setup

- [ ] Créer compte sur [inngest.com](https://www.inngest.com)
- [ ] Installer Inngest SDK
  ```bash
  npm install inngest
  ```
- [ ] Créer `lib/inngest/client.ts`
  ```typescript
  import { Inngest } from 'inngest'
  export const inngest = new Inngest({
    id: 'bravi-youtube-ai',
    eventKey: process.env.INNGEST_EVENT_KEY,
  })
  ```
- [ ] Créer route handler `app/api/inngest/route.ts`

  ```typescript
  import { serve } from 'inngest/next'
  import { inngest } from '@/lib/inngest/client'
  import { functions } from '@/lib/inngest/functions'

  export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [functions.handleVideoIngestion],
  })
  ```

- [ ] Configurer webhook dans Inngest Dashboard pointant vers `/api/inngest`

#### 2.3 Video Detection Utils

- [ ] Créer `lib/youtube/detector.ts`
  ```typescript
  export function detectYouTubeType(url: string): {
    type: 'video' | 'channel' | 'invalid'
    id: string | null
  } {
    // Regex pour détecter video ID (v=...)
    // Regex pour détecter channel (/@handle ou /channel/ID)
    // Return type + extracted ID
  }
  ```
- [ ] Créer `lib/youtube/api.ts` pour fetch metadata

  ```typescript
  // Note: This will use YouTube Data API v3 directly instead of youtube-sr
  // The youtube-transcript package is used for transcription only

  export async function getVideoMetadata(videoId: string) {
    // Fetch title, thumbnail, duration, channelName using YouTube Data API v3
  }

  export async function getChannelVideos(channelId: string, limit = 10) {
    // Fetch latest N videos from channel using YouTube Data API v3
  }
  ```

- [ ] Tester les fonctions de détection avec différentes URLs

#### 2.4 Server Action: Add YouTube Content

- [ ] Créer `app/actions/youtube.ts`

  ```typescript
  'use server'

  import { inngest } from '@/lib/inngest/client'
  import { detectYouTubeType } from '@/lib/youtube/detector'
  import { getChannelVideos } from '@/lib/youtube/api'
  import { prisma } from '@/lib/prisma'
  import { auth } from '@/lib/auth'

  export async function addYouTubeContent(url: string) {
    const user = await auth()
    if (!user) throw new Error('Unauthorized')

    const { type, id } = detectYouTubeType(url)

    if (type === 'video') {
      // Create Video record with status QUEUED
      const video = await prisma.video.create({
        data: {
          userId: user.id,
          youtubeId: id,
          status: 'QUEUED',
          title: 'Loading...',
        },
      })

      // Emit Inngest event
      await inngest.send({
        name: 'video.ingest.requested',
        data: { videoId: video.id, youtubeId: id },
      })

      return { success: true, videoId: video.id }
    }

    if (type === 'channel') {
      // Fetch latest 10 videos
      const videos = await getChannelVideos(id, 10)

      // Create records for each
      const createdVideos = await Promise.all(
        videos.map((v) =>
          prisma.video.create({
            data: {
              userId: user.id,
              youtubeId: v.id,
              status: 'QUEUED',
              title: v.title || 'Loading...',
              thumbnailUrl: v.thumbnail,
            },
          }),
        ),
      )

      // Emit events
      await Promise.all(
        createdVideos.map((v) =>
          inngest.send({
            name: 'video.ingest.requested',
            data: { videoId: v.id, youtubeId: v.youtubeId },
          }),
        ),
      )

      return { success: true, count: createdVideos.length }
    }

    throw new Error('Invalid YouTube URL')
  }
  ```

- [ ] Ajouter validation d'URL avec zod
  ```bash
  npm install zod
  ```

#### 2.5 Inngest Function: Video Ingestion

- [ ] Créer `lib/inngest/functions/video-ingestion.ts`

  ```typescript
  import { inngest } from '../client'
  import { prisma } from '@/lib/prisma'
  import { getVideoMetadata } from '@/lib/youtube/api'

  export const handleVideoIngestion = inngest.createFunction(
    { id: 'video-ingestion', name: 'Handle Video Ingestion' },
    { event: 'video.ingest.requested' },
    async ({ event, step }) => {
      const { videoId, youtubeId } = event.data

      // Step 1: Update status to PROCESSING
      await step.run('update-to-processing', async () => {
        await prisma.video.update({
          where: { id: videoId },
          data: { status: 'PROCESSING' },
        })
      })

      // Step 2: Fetch metadata
      const metadata = await step.run('fetch-metadata', async () => {
        try {
          return await getVideoMetadata(youtubeId)
        } catch (error) {
          await prisma.video.update({
            where: { id: videoId },
            data: {
              status: 'FAILED',
              error: 'Failed to fetch metadata',
            },
          })
          throw error
        }
      })

      // Step 3: Save metadata
      await step.run('save-metadata', async () => {
        await prisma.video.update({
          where: { id: videoId },
          data: {
            title: metadata.title,
            thumbnailUrl: metadata.thumbnail,
            channelName: metadata.channelName,
            duration: metadata.duration,
            status: 'READY',
          },
        })
      })

      return { success: true, videoId }
    },
  )
  ```

- [ ] Créer `lib/inngest/functions/index.ts` pour exporter toutes les functions
- [ ] Tester ingestion avec Inngest Dev Server
  ```bash
  npx inngest-cli dev
  ```

#### 2.6 Retry Mechanism

- [ ] Créer Server Action `retryVideoIngestion`

  ```typescript
  'use server'
  export async function retryVideoIngestion(videoId: string) {
    const video = await prisma.video.findUnique({ where: { id: videoId } })
    if (!video) throw new Error('Video not found')

    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'QUEUED', error: null },
    })

    await inngest.send({
      name: 'video.ingest.requested',
      data: { videoId, youtubeId: video.youtubeId },
    })
  }
  ```

- [ ] Ajouter bouton "Retry" dans UI pour vidéos failed

#### 2.7 Supabase Realtime Setup

- [ ] Activer Realtime dans Supabase Dashboard > Database > Replication
- [ ] Ajouter publication pour table `Video`
- [ ] Créer hook React `hooks/useRealtimeVideos.ts`

  ```typescript
  import { useEffect, useState } from 'react'
  import { createClient } from '@/lib/supabase/client'

  export function useRealtimeVideos(userId: string) {
    const [videos, setVideos] = useState<Video[]>([])
    const supabase = createClient()

    useEffect(() => {
      // Initial fetch
      const fetchVideos = async () => {
        const { data } = await supabase
          .from('Video')
          .select('*')
          .eq('userId', userId)
          .order('createdAt', { ascending: false })
        setVideos(data || [])
      }
      fetchVideos()

      // Subscribe to changes
      const channel = supabase
        .channel('video-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'Video',
            filter: `userId=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setVideos((prev) => [payload.new, ...prev])
            }
            if (payload.eventType === 'UPDATE') {
              setVideos((prev) =>
                prev.map((v) => (v.id === payload.new.id ? payload.new : v)),
              )
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }, [userId])

    return videos
  }
  ```

#### 2.8 Knowledge Base UI

- [ ] Créer composant `components/kb/VideoInput.tsx`

  ```typescript
  'use client'
  import { useState } from 'react'
  import { Input } from '@/components/ui/input'
  import { Button } from '@/components/ui/button'
  import { addYouTubeContent } from '@/app/actions/youtube'

  export function VideoInput() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
      e.preventDefault()
      setLoading(true)
      try {
        await addYouTubeContent(url)
        setUrl('')
        toast.success('Video(s) added to queue')
      } catch (error) {
        toast.error(error.message)
      } finally {
        setLoading(false)
      }
    }

    return (
      <form onSubmit={handleSubmit}>
        <Input
          placeholder="Paste YouTube video or channel URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button type="submit" loading={loading}>Add</Button>
      </form>
    )
  }
  ```

- [ ] Créer composant `components/kb/VideoCard.tsx`

  ```typescript
  interface VideoCardProps {
    video: Video
    onRetry?: (id: string) => void
  }

  export function VideoCard({ video, onRetry }: VideoCardProps) {
    const statusColor = {
      QUEUED: 'yellow',
      PROCESSING: 'blue',
      READY: 'green',
      FAILED: 'red'
    }

    return (
      <Card>
        <img src={video.thumbnailUrl} alt={video.title} />
        <h3>{video.title}</h3>
        <Badge color={statusColor[video.status]}>{video.status}</Badge>
        {video.status === 'FAILED' && (
          <Button onClick={() => onRetry?.(video.id)}>Retry</Button>
        )}
      </Card>
    )
  }
  ```

- [ ] Créer composant `components/kb/VideoList.tsx`

  ```typescript
  'use client'
  import { useRealtimeVideos } from '@/hooks/useRealtimeVideos'
  import { VideoCard } from './VideoCard'

  export function VideoList({ userId }: { userId: string }) {
    const videos = useRealtimeVideos(userId)

    if (videos.length === 0) {
      return <EmptyState message="No videos yet. Add one above!" />
    }

    return (
      <div className="space-y-4">
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    )
  }
  ```

- [ ] Intégrer dans `components/layout/KnowledgeBase.tsx`

#### 2.9 Basic Observability

- [ ] Ajouter mini-metrics en footer de KB column

  ```typescript
  export function KBMetrics({ videos }: { videos: Video[] }) {
    const total = videos.length
    const failed = videos.filter(v => v.status === 'FAILED').length
    const lastIngestion = videos[0]?.createdAt

    return (
      <div className="text-xs text-muted-foreground space-y-1">
        <div>Total videos: {total}</div>
        <div>Failed: {failed}</div>
        <div>Last ingestion: {lastIngestion ? formatDate(lastIngestion) : 'Never'}</div>
      </div>
    )
  }
  ```

- [ ] Logger les événements Inngest dans console avec timestamps

#### 2.10 Testing & Deployment

- [ ] Tester ajout d'une vidéo individuelle
- [ ] Tester ajout d'une chaîne (10 vidéos)
- [ ] Vérifier que les statuts se mettent à jour en temps réel
- [ ] Tester le retry sur une vidéo failed
- [ ] Déployer sur Vercel
- [ ] Configurer Inngest webhook en production
- [ ] Tester flow complet en production

### 🛠️ Tools/Technologies

- Next.js Server Actions
- Inngest (background jobs)
- Supabase Realtime
- Prisma ORM
- YouTube Data API v3
- youtube-transcript (npm package)
- shadcn/ui (VideoCard, Input, Button)

### ✅ Expected Outcome

- ✅ Users peuvent ajouter vidéos/chaînes via input dans KB column
- ✅ Ingestion automatique avec statuts en temps réel (queued → processing → ready/failed)
- ✅ Retry fonctionnel pour vidéos failed
- ✅ Liste des vidéos avec thumbnails et metadata
- ✅ Mini-metrics affichées dans KB footer
- ✅ Foundation prête pour Step 3 (transcription)

---

## 📝 Step 3 – Transcription, Chunking & Embedding

**🎯 Goal:** Ajouter transcription automatique, chunking intelligent, et génération d'embeddings via ZeroEntropy.

**⏱️ Temps estimé:** ~2.5 heures

### ✅ TODO List

#### 3.1 Extend Prisma Schema (Phase 2)

- [ ] Ajouter models pour transcripts et embeddings

  ```prisma
  model TranscriptChunk {
    id        String    @id @default(cuid())
    videoId   String
    text      String    @db.Text
    start     Float?
    end       Float?
    order     Int
    createdAt DateTime  @default(now())
    video     Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)
    embedding Embedding?

    @@index([videoId, order])
  }

  model Embedding {
    id        String   @id @default(cuid())
    chunkId   String   @unique
    vector    Json     // Stocke array de floats
    model     String   @default("text-embedding-3-small")
    createdAt DateTime @default(now())
    chunk     TranscriptChunk @relation(fields: [chunkId], references: [id], onDelete: Cascade)

    @@index([chunkId])
  }
  ```

- [ ] Mettre à jour le model Video
  ```prisma
  model Video {
    // ... existing fields
    chunks TranscriptChunk[]
  }
  ```
- [ ] Créer et appliquer migration
  ```bash
  npx prisma migrate dev --name add_transcripts_embeddings
  ```
- [ ] Générer nouveau Prisma Client
  ```bash
  npx prisma generate
  ```

#### 3.2 Transcript Extraction

- [ ] Installer youtube-transcript package
  ```bash
  npm install youtube-transcript
  ```
- [ ] Créer `lib/youtube/transcript.ts`

  ```typescript
  import { YoutubeTranscript } from 'youtube-transcript'

  export async function getTranscript(youtubeId: string) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(youtubeId)
      return transcript.map((item) => ({
        text: item.text,
        start: item.offset / 1000, // Convert ms to seconds
        duration: item.duration / 1000,
      }))
    } catch (error) {
      throw new Error('Transcript not available for this video')
    }
  }
  ```

- [ ] Gérer les cas où transcript n'est pas disponible

#### 3.3 Server-Side Chunking Logic

- [ ] Créer `lib/chunking/text-splitter.ts`

  ```typescript
  interface TranscriptSegment {
    text: string
    start: number
    duration: number
  }

  interface Chunk {
    text: string
    start: number
    end: number
    order: number
  }

  export function chunkTranscript(
    segments: TranscriptSegment[],
    targetTokens = 600,
    overlapTokens = 100,
  ): Chunk[] {
    // Approximate 1 token ≈ 4 characters
    const targetChars = targetTokens * 4
    const overlapChars = overlapTokens * 4

    const chunks: Chunk[] = []
    let currentChunk = ''
    let chunkStart = segments[0]?.start || 0
    let chunkEnd = chunkStart
    let order = 0

    for (const segment of segments) {
      const proposedChunk = currentChunk + ' ' + segment.text

      if (proposedChunk.length >= targetChars) {
        // Save current chunk
        chunks.push({
          text: currentChunk.trim(),
          start: chunkStart,
          end: chunkEnd,
          order: order++,
        })

        // Start new chunk with overlap
        const overlapText = currentChunk.slice(-overlapChars)
        currentChunk = overlapText + ' ' + segment.text
        chunkStart = segment.start
      } else {
        currentChunk = proposedChunk
      }

      chunkEnd = segment.start + segment.duration
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        start: chunkStart,
        end: chunkEnd,
        order: order++,
      })
    }

    return chunks
  }
  ```

- [ ] Tester chunking avec différentes tailles de transcript

#### 3.4 ZeroEntropy Integration

- [ ] Créer compte sur [zeroentropy.dev](https://zeroentropy.dev)
- [ ] Obtenir API key et l'ajouter à `.env.local`
  ```bash
  ZEROENTROPY_API_KEY=your_key_here
  ```
- [ ] Créer `lib/embeddings/zeroentropy.ts`

  ```typescript
  interface EmbeddingRequest {
    texts: string[]
    model?: string
  }

  export async function generateEmbeddings(
    texts: string[],
    model = 'text-embedding-3-small',
  ) {
    const response = await fetch('https://api.zeroentropy.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ZEROENTROPY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ texts, model }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate embeddings')
    }

    const data = await response.json()
    return data.embeddings // Array of float arrays
  }
  ```

- [ ] Ajouter batching pour gérer > 100 chunks

  ```typescript
  export async function generateEmbeddingsBatch(
    texts: string[],
    batchSize = 50,
  ) {
    const batches = []
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize))
    }

    const results = await Promise.all(
      batches.map((batch) => generateEmbeddings(batch)),
    )

    return results.flat()
  }
  ```

#### 3.5 Enhanced Inngest Workflow

- [ ] Créer nouvelle Inngest function `lib/inngest/functions/transcript-processing.ts`

  ```typescript
  export const processTranscript = inngest.createFunction(
    { id: 'process-transcript', name: 'Process Video Transcript' },
    { event: 'video.metadata.completed' },
    async ({ event, step }) => {
      const { videoId, youtubeId } = event.data

      // Step 1: Fetch transcript
      const segments = await step.run('fetch-transcript', async () => {
        try {
          return await getTranscript(youtubeId)
        } catch (error) {
          await prisma.video.update({
            where: { id: videoId },
            data: {
              status: 'FAILED',
              error: 'No transcript available',
            },
          })
          throw error
        }
      })

      // Step 2: Chunk transcript
      const chunks = await step.run('chunk-transcript', async () => {
        return chunkTranscript(segments)
      })

      // Step 3: Save chunks to DB
      await step.run('save-chunks', async () => {
        await prisma.transcriptChunk.createMany({
          data: chunks.map((chunk) => ({
            videoId,
            text: chunk.text,
            start: chunk.start,
            end: chunk.end,
            order: chunk.order,
          })),
        })
      })

      // Step 4: Generate embeddings
      const embeddings = await step.run('generate-embeddings', async () => {
        const texts = chunks.map((c) => c.text)
        return await generateEmbeddingsBatch(texts)
      })

      // Step 5: Save embeddings
      await step.run('save-embeddings', async () => {
        const savedChunks = await prisma.transcriptChunk.findMany({
          where: { videoId },
          orderBy: { order: 'asc' },
        })

        await Promise.all(
          savedChunks.map((chunk, idx) =>
            prisma.embedding.create({
              data: {
                chunkId: chunk.id,
                vector: embeddings[idx],
                model: 'text-embedding-3-small',
              },
            }),
          ),
        )
      })

      // Step 6: Mark video as READY
      await step.run('mark-ready', async () => {
        await prisma.video.update({
          where: { id: videoId },
          data: { status: 'READY' },
        })
      })

      return { success: true, chunkCount: chunks.length }
    },
  )
  ```

- [ ] Modifier `handleVideoIngestion` pour émettre event après metadata
  ```typescript
  // In handleVideoIngestion, after saving metadata:
  await step.run('emit-transcript-event', async () => {
    await inngest.send({
      name: 'video.metadata.completed',
      data: { videoId, youtubeId },
    })
  })
  ```

#### 3.6 Add Processing Stages to UI

- [ ] Étendre enum VideoStatus dans schema
  ```prisma
  enum VideoStatus {
    QUEUED
    PROCESSING
    TRANSCRIBING
    EMBEDDING
    READY
    FAILED
  }
  ```
- [ ] Créer nouvelle migration
  ```bash
  npx prisma migrate dev --name add_transcript_stages
  ```
- [ ] Mettre à jour status badge colors dans `VideoCard`
- [ ] Ajouter chip affichant nombre de chunks pour videos READY
  ```typescript
  {video.status === 'READY' && video.chunks && (
    <Badge variant="outline">
      {video.chunks.length} chunks
    </Badge>
  )}
  ```

#### 3.7 Retry & Error Handling

- [ ] Ajouter retry logic pour transcript failures
  ```typescript
  // In processTranscript function
  const segments = await step.run('fetch-transcript', async () => {
    return await retry(() => getTranscript(youtubeId), {
      attempts: 3,
      delay: 2000,
    })
  })
  ```
- [ ] Gérer rate limits de ZeroEntropy API
- [ ] Logger les erreurs dans Inngest dashboard
- [ ] Afficher message d'erreur détaillé dans UI

#### 3.8 Observability Enhancements

- [ ] Ajouter métriques de transcription dans KB footer
  ```typescript
  const totalChunks = videos.reduce(
    (sum, v) => sum + (v.chunks?.length || 0),
    0,
  )
  ```
- [ ] Logger average embedding latency dans console
- [ ] Ajouter progress indicator pendant transcription (optionnel)
- [ ] Créer dashboard Inngest pour monitorer jobs

#### 3.9 Testing

- [ ] Tester avec vidéo ayant transcription disponible
- [ ] Tester avec vidéo sans transcription (doit fail gracefully)
- [ ] Vérifier que chunks sont bien ordonnés
- [ ] Vérifier que embeddings sont stockés correctement
- [ ] Tester chunking avec vidéos de différentes longueurs (5min, 30min, 2h)
- [ ] Vérifier que statuses se mettent à jour correctement

#### 3.10 Deployment

- [ ] Pousser les changements sur GitHub
- [ ] Déployer sur Vercel
- [ ] Vérifier que nouvelles variables d'environnement sont configurées
- [ ] Tester flow complet ingestion → transcription → embedding en prod
- [ ] Monitorer Inngest logs pour errors

### 🛠️ Tools/Technologies

- youtube-transcript (npm package)
- ZeroEntropy API (embeddings)
- Inngest (orchestration)
- Prisma (extended schema)
- Supabase Realtime (status updates)

### ✅ Expected Outcome

- ✅ Chaque vidéo ajoutée est automatiquement transcrite
- ✅ Transcripts sont chunked intelligemment (~600 tokens, 100 overlap)
- ✅ Embeddings générés et stockés via ZeroEntropy
- ✅ Statuts progressent: queued → processing → transcribing → embedding → ready
- ✅ Nombre de chunks affiché pour vidéos ready
- ✅ Gestion d'erreurs robuste (retry, fallback)
- ✅ Knowledge Base fully searchable et prêt pour RAG (Step 4)

---

## 💬 Step 4 – Scope-Aware Chat & Retrieval

**🎯 Goal:** Implémenter chat temps réel avec RAG scopé, citations, et streaming via SSE.

**⏱️ Temps estimé:** ~3 heures

### ✅ TODO List

#### 4.1 Prisma Schema Updates

- [ ] Ajouter models pour conversations et messages

  ```prisma
  model Conversation {
    id        String    @id @default(cuid())
    userId    String
    title     String?
    scope     Json?     // Array of videoIds
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    messages  Message[]

    @@index([userId, updatedAt])
  }

  model Message {
    id             String       @id @default(cuid())
    conversationId String
    role           MessageRole
    content        String       @db.Text
    citations      Json?        // Array of {videoId, chunkId, timestamp}
    createdAt      DateTime     @default(now())
    conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

    @@index([conversationId, createdAt])
  }

  enum MessageRole {
    USER
    ASSISTANT
  }
  ```

- [ ] Créer et appliquer migration
  ```bash
  npx prisma migrate dev --name add_conversations_messages
  ```

#### 4.2 Vector Search with ZeroEntropy

- [ ] Créer `lib/retrieval/search.ts`

  ```typescript
  interface SearchResult {
    chunkId: string
    videoId: string
    text: string
    start: number
    end: number
    score: number
    videoTitle: string
  }

  export async function searchVideoChunks(
    query: string,
    videoIds: string[],
    topK = 5,
  ): Promise<SearchResult[]> {
    // Step 1: Generate query embedding
    const [queryEmbedding] = await generateEmbeddings([query])

    // Step 2: Fetch chunks with embeddings for specified videos
    const chunks = await prisma.transcriptChunk.findMany({
      where: { videoId: { in: videoIds } },
      include: {
        embedding: true,
        video: { select: { title: true, youtubeId: true } },
      },
    })

    // Step 3: Calculate cosine similarity
    const results = chunks
      .map((chunk) => ({
        chunkId: chunk.id,
        videoId: chunk.videoId,
        text: chunk.text,
        start: chunk.start!,
        end: chunk.end!,
        videoTitle: chunk.video.title,
        score: cosineSimilarity(queryEmbedding, chunk.embedding!.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)

    return results
  }

  function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
    return dotProduct / (magnitudeA * magnitudeB)
  }
  ```

- [ ] Alternative: Utiliser pgvector si disponible

  ```sql
  -- Enable pgvector extension in Supabase
  CREATE EXTENSION IF NOT EXISTS vector;

  -- Add vector column to Embedding table
  ALTER TABLE "Embedding" ADD COLUMN vector_pgvector vector(1536);
  ```

#### 4.3 Anthropic Claude Setup

- [ ] Créer compte Anthropic et obtenir API key
- [ ] Ajouter à `.env.local`
  ```bash
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- [ ] Installer SDK Anthropic
  ```bash
  npm install @anthropic-ai/sdk
  ```
- [ ] Créer `lib/llm/claude.ts`

  ```typescript
  import Anthropic from '@anthropic-ai/sdk'

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  export async function streamChatCompletion(
    messages: { role: 'user' | 'assistant'; content: string }[],
    context: string,
    onChunk: (text: string) => void,
  ) {
    const systemPrompt = `You are a helpful assistant that answers questions based on YouTube video transcripts.
  
  Context from videos:
  ${context}
  
  Rules:
  - Only answer based on the provided context
  - Always cite your sources with [Video: title, timestamp]
  - If you don't know, say so
  - Be concise and accurate`

    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages,
      system: systemPrompt,
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        onChunk(chunk.delta.text)
      }
    }
  }
  ```

#### 4.4 SSE Chat Endpoint

- [ ] Créer `app/api/chat/route.ts`

  ```typescript
  import { NextRequest } from 'next/server'
  import { searchVideoChunks } from '@/lib/retrieval/search'
  import { streamChatCompletion } from '@/lib/llm/claude'

  export async function POST(req: NextRequest) {
    const encoder = new TextEncoder()
    const { messages, videoIds } = await req.json()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Step 1: Retrieve context
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'status', message: 'Retrieving context...' })}\n\n`,
            ),
          )

          const lastUserMessage = messages[messages.length - 1].content
          const searchResults = await searchVideoChunks(
            lastUserMessage,
            videoIds,
          )

          const context = searchResults
            .map(
              (r) =>
                `[${r.videoTitle} @ ${formatTimestamp(r.start)}]\n${r.text}`,
            )
            .join('\n\n')

          // Step 2: Stream LLM response
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'context', results: searchResults })}\n\n`,
            ),
          )

          let fullResponse = ''
          await streamChatCompletion(messages, context, (chunk) => {
            fullResponse += chunk
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'token', text: chunk })}\n\n`,
              ),
            )
          })

          // Step 3: Send citations
          const citations = extractCitations(fullResponse, searchResults)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'citations', citations })}\n\n`,
            ),
          )

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  function formatTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  function extractCitations(response: string, results: SearchResult[]) {
    // Parse citations from response (e.g., [Video: title, 2:34])
    // Return array of { videoId, timestamp, text }
  }
  ```

#### 4.5 Chat UI Component

- [ ] Créer `components/chat/ChatArea.tsx`

  ```typescript
  'use client'
  import { useState, useRef, useEffect } from 'react'
  import { Message } from './Message'
  import { ChatInput } from './ChatInput'
  import { ScopeBar } from './ScopeBar'

  export function ChatArea({ conversationId, scope }: Props) {
    const [messages, setMessages] = useState<Message[]>([])
    const [streaming, setStreaming] = useState(false)
    const [currentScope, setCurrentScope] = useState(scope || [])

    const sendMessage = async (content: string) => {
      const userMessage = { role: 'user', content }
      setMessages(prev => [...prev, userMessage])
      setStreaming(true)

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          videoIds: currentScope
        })
      })

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = { role: 'assistant', content: '', citations: [] }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'status') {
              // Show status indicator
            }
            if (data.type === 'token') {
              assistantMessage.content += data.text
              setMessages(prev => [...prev.slice(0, -1), assistantMessage])
            }
            if (data.type === 'citations') {
              assistantMessage.citations = data.citations
              setMessages(prev => [...prev.slice(0, -1), assistantMessage])
            }
          }
        }
      }

      setStreaming(false)

      // Save to DB
      await saveChatTurn(conversationId, userMessage, assistantMessage)
    }

    return (
      <div className="flex flex-col h-full">
        <ScopeBar
          scope={currentScope}
          onScopeChange={setCurrentScope}
        />
        <div className="flex-1 overflow-y-auto">
          {messages.map((msg, idx) => (
            <Message key={idx} message={msg} />
          ))}
        </div>
        <ChatInput
          onSend={sendMessage}
          disabled={streaming}
        />
      </div>
    )
  }
  ```

#### 4.6 Message Component with Citations

- [ ] Créer `components/chat/Message.tsx`

  ```typescript
  export function Message({ message }: { message: Message }) {
    const isUser = message.role === 'user'

    return (
      <div className={cn('flex gap-3 p-4', isUser && 'bg-muted/50')}>
        <Avatar>
          {isUser ? <User /> : <Bot />}
        </Avatar>
        <div className="flex-1">
          <div className="prose dark:prose-invert">
            {message.content}
          </div>
          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-muted-foreground">Sources:</p>
              {message.citations.map((citation, idx) => (
                <CitationChip key={idx} citation={citation} />
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] Créer `components/chat/CitationChip.tsx`

  ```typescript
  export function CitationChip({ citation }) {
    const handleClick = () => {
      // Open YouTube video at timestamp
      const url = `https://youtube.com/watch?v=${citation.youtubeId}&t=${Math.floor(citation.timestamp)}s`
      window.open(url, '_blank')
    }

    return (
      <Badge
        variant="outline"
        className="cursor-pointer hover:bg-accent"
        onClick={handleClick}
      >
        <PlayCircle className="w-3 h-3 mr-1" />
        {citation.videoTitle} • {formatTimestamp(citation.timestamp)}
      </Badge>
    )
  }
  ```

#### 4.7 Scope Management

- [ ] Créer `components/chat/ScopeBar.tsx`

  ```typescript
  export function ScopeBar({ scope, onScopeChange }) {
    const videos = useVideos(scope) // Fetch video details

    return (
      <div className="border-b p-3 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Context:</span>
        {scope.length === 0 ? (
          <Badge variant="secondary">All videos</Badge>
        ) : (
          <>
            {videos.map(video => (
              <Badge key={video.id} variant="secondary">
                {video.title}
                <X
                  className="w-3 h-3 ml-1 cursor-pointer"
                  onClick={() => onScopeChange(scope.filter(id => id !== video.id))}
                />
              </Badge>
            ))}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onScopeChange([])}
            >
              Reset to All
            </Button>
          </>
        )}
      </div>
    )
  }
  ```

- [ ] Intégrer sélection multi-vidéos dans KB Explorer

  ```typescript
  // In VideoList component
  const [selectedVideos, setSelectedVideos] = useState<string[]>([])

  const handleToggle = (videoId: string) => {
    setSelectedVideos(prev =>
      prev.includes(videoId)
        ? prev.filter(id => id !== videoId)
        : [...prev, videoId]
    )
  }

  return (
    <>
      {selectedVideos.length > 0 && (
        <div className="sticky top-0 bg-background border-b p-3">
          <Button onClick={() => applyScope(selectedVideos)}>
            Use {selectedVideos.length} videos as context
          </Button>
        </div>
      )}
      {/* VideoCards with checkboxes */}
    </>
  )
  ```

#### 4.8 Conversation History

- [ ] Créer `components/sidebar/ConversationList.tsx`

  ```typescript
  export function ConversationList({ userId }: { userId: string }) {
    const [conversations, setConversations] = useState([])

    useEffect(() => {
      fetchConversations(userId).then(setConversations)
    }, [userId])

    return (
      <div className="space-y-2 p-3">
        <Button variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
        {conversations.map(conv => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            onClick={() => loadConversation(conv.id)}
          />
        ))}
      </div>
    )
  }
  ```

- [ ] Créer `components/sidebar/ConversationItem.tsx`
  ```typescript
  export function ConversationItem({ conversation, onClick }) {
    return (
      <div
        className="p-2 rounded hover:bg-accent cursor-pointer"
        onClick={onClick}
      >
        <p className="text-sm font-medium truncate">
          {conversation.title || 'Untitled'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(conversation.updatedAt)} ago
        </p>
      </div>
    )
  }
  ```
- [ ] Implémenter auto-génération de titre
  ```typescript
  async function generateConversationTitle(firstMessage: string) {
    // Use Claude to generate short title (5-8 words) from first message
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Generate a short title (5-8 words) for a conversation starting with: "${firstMessage}"`,
        },
      ],
    })
    return response.content[0].text
  }
  ```

#### 4.9 Persistence & State Management

- [ ] Créer Server Actions pour conversations

  ```typescript
  'use server'
  export async function createConversation(userId: string, scope: string[]) {
    return await prisma.conversation.create({
      data: { userId, scope },
    })
  }

  export async function saveMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    citations?: any[],
  ) {
    return await prisma.message.create({
      data: { conversationId, role, content, citations },
    })
  }

  export async function loadConversation(conversationId: string) {
    return await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })
  }
  ```

- [ ] Implémenter restauration de scope lors du chargement d'un chat

#### 4.10 Compose Mode (Bonus)

- [ ] Ajouter toggle entre Chat et Compose mode
- [ ] Créer templates de prompts
  ```typescript
  const templates = {
    linkedinPost: 'Create a LinkedIn post from these video insights...',
    summary: 'Summarize the key points from these videos...',
    outline: 'Create a detailed outline from these videos...',
  }
  ```
- [ ] Ajouter bouton "Copy to Clipboard" pour outputs
- [ ] Optionnel: Export as Markdown

#### 4.11 Testing

- [ ] Tester chat avec 1 vidéo scopée
- [ ] Tester chat avec plusieurs vidéos scopées
- [ ] Tester "Reset to All"
- [ ] Vérifier que citations sont cliquables et ouvrent YouTube au bon timestamp
- [ ] Tester streaming (tokens apparaissent progressivement)
- [ ] Vérifier que conversations sont sauvegardées
- [ ] Tester restauration de conversation + scope
- [ ] Vérifier que titre est auto-généré

#### 4.12 Deployment

- [ ] Pousser sur GitHub
- [ ] Déployer sur Vercel
- [ ] Configurer ANTHROPIC_API_KEY en production
- [ ] Tester flow complet en prod
- [ ] Monitorer latence de retrieval et streaming

### 🛠️ Tools/Technologies

- Anthropic Claude API (LLM)
- ZeroEntropy (vector search)
- Server-Sent Events (SSE)
- Next.js Route Handlers
- Prisma (conversations & messages)
- shadcn/ui (Chat components)

### ✅ Expected Outcome

- ✅ Chat temps réel avec streaming token-by-token
- ✅ RAG scopé à un subset de vidéos sélectionnées
- ✅ Citations cliquables avec timestamps
- ✅ Indicateur "Retrieving context..." pendant recherche
- ✅ Scope bar avec chips de vidéos
- ✅ Historique des conversations (sidebar gauche)
- ✅ Restauration de conversations avec leur scope
- ✅ Auto-génération de titres
- ✅ Mode Compose pour contenu structuré (optionnel)

---

## ✨ Step 5 – Design Polish & Deliverables

**🎯 Goal:** Finaliser l'UX, polish visuel, et préparer tous les livrables.

**⏱️ Temps estimé:** ~2-2.5 heures

### ✅ TODO List

#### 5.1 Visual Hierarchy & Spacing

- [ ] Audit de tous les paddings/margins avec Tailwind
- [ ] Vérifier consistance des espacements:
  - Entre colonnes: `gap-4` ou `gap-6`
  - Cards internes: `p-4`
  - Sections: `space-y-6`
- [ ] Ajouter subtle borders entre colonnes
  ```typescript
  <aside className="border-r border-border">
  ```
- [ ] Ajouter shadows pour depth
  ```typescript
  <Card className="shadow-sm hover:shadow-md transition-shadow">
  ```
- [ ] Vérifier hierarchy des headings (h1, h2, h3)

#### 5.2 Dark/Light Mode Refinement

- [ ] Tester tous les composants en dark mode
- [ ] Ajuster contrasts pour accessibilité (WCAG AA)
- [ ] Vérifier que borders sont visibles dans les deux modes
  ```css
  .border-border {
    border-color: hsl(var(--border));
  }
  ```
- [ ] Tester theme toggle dans tous les états de l'app

#### 5.3 Interactive States

- [ ] Ajouter hover states sur tous les boutons
- [ ] Ajouter focus states pour keyboard navigation
  ```typescript
  <Button className="focus:ring-2 focus:ring-primary">
  ```
- [ ] Ajouter active states pour selections
- [ ] Ajouter loading states (spinners, skeletons)
  ```typescript
  {loading ? <Skeleton className="h-20" /> : <VideoCard />}
  ```
- [ ] Ajouter disabled states avec cursor-not-allowed

#### 5.4 Empty & Error States

- [ ] Knowledge Base empty state
  ```typescript
  <div className="flex flex-col items-center justify-center h-full p-8">
    <Video className="w-16 h-16 text-muted-foreground mb-4" />
    <h3 className="font-semibold mb-2">No videos yet</h3>
    <p className="text-sm text-muted-foreground text-center mb-4">
      Paste a YouTube link above to get started
    </p>
  </div>
  ```
- [ ] Chat empty state
  ```typescript
  <div className="flex flex-col items-center justify-center h-full p-8">
    <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
    <h3 className="font-semibold mb-2">Start a conversation</h3>
    <p className="text-sm text-muted-foreground text-center">
      Select videos from the Knowledge Base and ask a question
    </p>
  </div>
  ```
- [ ] Conversation history empty state
- [ ] Error states pour failed ingestions
  ```typescript
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Ingestion Failed</AlertTitle>
    <AlertDescription>
      {video.error || 'Failed to process video'}
      <Button variant="outline" size="sm" onClick={() => retry(video.id)}>
        Retry
      </Button>
    </AlertDescription>
  </Alert>
  ```
- [ ] Network error toast
  ```typescript
  toast.error('Failed to send message. Please try again.')
  ```

#### 5.5 Loading States & Skeletons

- [ ] VideoCard skeleton pendant fetch
  ```typescript
  <Card className="p-4">
    <Skeleton className="h-32 w-full mb-3" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2" />
  </Card>
  ```
- [ ] Message skeleton pendant streaming
- [ ] Spinner pour ingestion status
  ```typescript
  {video.status === 'PROCESSING' && (
    <Loader2 className="w-4 h-4 animate-spin" />
  )}
  ```

#### 5.6 Accessibility

- [ ] Ajouter aria-labels pour icons
  ```typescript
  <Button aria-label="Send message">
    <Send className="w-4 h-4" />
  </Button>
  ```
- [ ] Keyboard navigation dans chat (Tab, Enter)
- [ ] Focus trap dans modals
- [ ] Semantic HTML (`<nav>`, `<main>`, `<aside>`)
- [ ] Alt text pour toutes les images
- [ ] Color contrast check avec DevTools
- [ ] Screen reader testing (optionnel)

#### 5.7 Responsive Design

- [ ] Tester sur mobile (< 768px)
  ```typescript
  <div className="hidden md:block"> {/* Desktop only */}
  <div className="md:hidden"> {/* Mobile only */}
  ```
- [ ] Collapse sidebar sur mobile avec hamburger menu
- [ ] Stack colonnes verticalement sur small screens
- [ ] Responsive font sizes
  ```typescript
  <h1 className="text-2xl md:text-3xl lg:text-4xl">
  ```
- [ ] Touch-friendly buttons (min 44x44px)

#### 5.8 Performance Optimizations

- [ ] Lazy load VideoCards avec pagination
  ```typescript
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['videos'],
    queryFn: ({ pageParam = 0 }) => fetchVideos(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
  ```
- [ ] Debounce search input
  ```typescript
  const debouncedSearch = useDebouncedCallback((value) => {
    setSearchQuery(value)
  }, 300)
  ```
- [ ] Cache video metadata client-side
- [ ] Optimize images (Next.js Image component)
  ```typescript
  <Image src={video.thumbnailUrl} width={320} height={180} alt={video.title} />
  ```
- [ ] Bundle size check
  ```bash
  npm run build
  npx @next/bundle-analyzer
  ```

#### 5.9 Mini-Metrics Dashboard

- [ ] Créer `components/kb/MetricsFooter.tsx`

  ```typescript
  export function MetricsFooter({ videos }) {
    const stats = {
      total: videos.length,
      ready: videos.filter(v => v.status === 'READY').length,
      failed: videos.filter(v => v.status === 'FAILED').length,
      totalChunks: videos.reduce((sum, v) => sum + (v._count?.chunks || 0), 0),
      lastIngestion: videos[0]?.createdAt
    }

    return (
      <div className="border-t p-3 space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Total videos</span>
          <span className="font-medium">{stats.total}</span>
        </div>
        <div className="flex justify-between">
          <span>Ready</span>
          <span className="font-medium text-green-600">{stats.ready}</span>
        </div>
        {stats.failed > 0 && (
          <div className="flex justify-between">
            <span>Failed</span>
            <span className="font-medium text-red-600">{stats.failed}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Total chunks</span>
          <span className="font-medium">{stats.totalChunks}</span>
        </div>
        {stats.lastIngestion && (
          <div className="flex justify-between">
            <span>Last ingestion</span>
            <span className="font-medium">
              {formatDistanceToNow(stats.lastIngestion, { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    )
  }
  ```

#### 5.10 Toasts & Feedback

- [ ] Installer sonner pour toasts
  ```bash
  npx shadcn-ui@latest add sonner
  ```
- [ ] Success toast après ajout de vidéo
  ```typescript
  toast.success('Video added to queue')
  ```
- [ ] Error toasts avec retry button
  ```typescript
  toast.error('Failed to add video', {
    action: {
      label: 'Retry',
      onClick: () => retry(),
    },
  })
  ```
- [ ] Info toast pour statuts importants
  ```typescript
  toast.info('Transcription completed for 10 videos')
  ```

#### 5.11 GitHub Repo Cleanup

- [ ] Clean commit history (squash WIP commits)
  ```bash
  git rebase -i HEAD~10
  ```
- [ ] Remove debug console.logs
- [ ] Remove commented code
- [ ] Fix ESLint warnings
  ```bash
  npm run lint -- --fix
  ```
- [ ] Format all files
  ```bash
  npm run format
  ```
- [ ] Remove unused dependencies
  ```bash
  npx depcheck
  ```

#### 5.12 Documentation: README.md

- [ ] **Header section**
  - Project title + tagline
  - Deployed app link
  - Demo video (Loom) link
- [ ] **Overview**
  - Brief description (2-3 sentences)
  - Key features bullet list
- [ ] **Tech Stack**
  - Table with categories (Frontend, Backend, AI, Infrastructure)
  - Version numbers
- [ ] **Architecture Diagram**
  - Create with Excalidraw or similar
  - Show: User → Next.js → Supabase/Inngest → YouTube/ZeroEntropy/Claude
  - Include data flow for ingestion and chat
- [ ] **Setup Instructions**

  ```markdown
  ## Local Development

  1. Clone repo
     git clone https://github.com/yourusername/bravi-youtube-ai
     cd bravi-youtube-ai

  2. Install dependencies
     npm install

  3. Setup environment variables (see .env.example)
     cp .env.example .env.local

  # Fill in your API keys

  4. Setup database
     npx prisma migrate dev
     npx prisma generate

  5. Run dev server
     npm run dev

  6. Run Inngest dev server (separate terminal)
     npx inngest-cli dev
  ```

- [ ] **Design Decisions & Trade-offs**

  ```markdown
  ## Key Design Decisions

  ### Why SSE over WebSockets?

  - Simpler to implement with Next.js Route Handlers
  - One-way streaming sufficient for chat
  - Better compatibility with serverless

  ### Why server-side chunking?

  - More control over chunk size/overlap
  - Consistent chunking logic
  - Easier to optimize for embedding costs

  ### Why minimal schema first?

  - Iterate faster without complex migrations
  - Add fields as needed based on requirements
  - Easier to pivot if needed

  ### Why ZeroEntropy over pgvector?

  - Simpler setup (no DB extension)
  - Better for prototyping
  - Can migrate to pgvector later for scale
  ```

- [ ] **Known Limitations & Future Improvements**

  ```markdown
  ## Current Limitations

  - No pagination in video list (loads all)
  - No video search/filtering yet
  - Basic citation parsing (could be improved)
  - No user quotas or rate limiting
  - Single user support (no team features)

  ## Future Enhancements

  - [ ] Video preview in chat (iframe or thumbnail)
  - [ ] Advanced filtering (by channel, date, duration)
  - [ ] Export chat history as PDF/Markdown
  - [ ] Team workspaces with sharing
  - [ ] Mobile app (React Native)
  - [ ] Browser extension (Step 6)
  - [ ] Langfuse integration for LLM observability
  ```

- [ ] **Screenshots**
  - Login page
  - Main app (3-column layout)
  - Chat with citations
  - Video ingestion status
  - Dark mode

#### 5.13 Environment Variables Documentation

- [ ] Create comprehensive `.env.example`

  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

  # Database
  DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

  # YouTube
  YOUTUBE_API_KEY=AIzaSyC...

  # Inngest
  INNGEST_EVENT_KEY=...
  INNGEST_SIGNING_KEY=...

  # AI Services
  ANTHROPIC_API_KEY=sk-ant-...
  ZEROENTROPY_API_KEY=ze_...

  # Optional: Langfuse (for observability)
  LANGFUSE_PUBLIC_KEY=pk-lf-...
  LANGFUSE_SECRET_KEY=sk-lf-...
  LANGFUSE_HOST=https://cloud.langfuse.com
  ```

#### 5.14 Loom Demo Recording

- [ ] **Script outline** (~5 min total):
  - 0:00-0:30 - Intro: Show deployed app, explain what it does
  - 0:30-1:30 - Login flow: Magic link demo
  - 1:30-2:30 - Add content:
    - Add 1 single video
    - Add 1 channel (show auto-ingestion of 10)
  - 2:30-3:30 - Ingestion: Show real-time status updates (queued → processing → ready)
  - 3:30-4:30 - Chat:
    - Multi-select 2-3 videos
    - Ask scoped question
    - Show citations with clickable timestamps
  - 4:30-5:00 - History & Profile:
    - Restore past conversation + scope
    - Show theme toggle
    - Logout
- [ ] Record with Loom (use HD quality)
- [ ] Add captions if possible
- [ ] Upload and add link to README

#### 5.15 Final Testing Checklist

- [ ] **Authentication**
  - [ ] Magic link login works
  - [ ] Session persists across refreshes
  - [ ] Logout clears session
  - [ ] Protected routes redirect to login
- [ ] **Ingestion**
  - [ ] Single video ingestion works
  - [ ] Channel ingestion (10 videos) works
  - [ ] Status updates in real-time
  - [ ] Retry works for failed videos
  - [ ] Error messages are clear
- [ ] **Chat**
  - [ ] Can scope to specific videos
  - [ ] "Reset to All" works
  - [ ] Messages stream correctly
  - [ ] Citations are clickable and open correct timestamps
  - [ ] Conversations save and restore
  - [ ] Title auto-generates
- [ ] **UI/UX**
  - [ ] Dark/light mode works everywhere
  - [ ] Responsive on mobile
  - [ ] All buttons have hover states
  - [ ] Loading states show appropriately
  - [ ] Empty states are helpful
- [ ] **Performance**
  - [ ] Initial load < 3s
  - [ ] Chat response starts < 2s
  - [ ] No console errors
  - [ ] No memory leaks

#### 5.16 Deployment Verification

- [ ] Push final code to GitHub
- [ ] Deploy to Vercel
- [ ] Verify all environment variables in Vercel Dashboard
- [ ] Test production URLs:
  - [ ] Main app
  - [ ] `/api/health`
  - [ ] `/api/inngest` (Inngest webhook)
- [ ] Monitor Vercel logs for errors
- [ ] Monitor Inngest dashboard for job failures
- [ ] Check Supabase logs for DB errors

#### 5.17 Bonus Features (Optional)

- [ ] **Langfuse Integration**

  ```bash
  npm install langfuse
  ```

  ```typescript
  import { Langfuse } from 'langfuse'
  const langfuse = new Langfuse()

  // Wrap LLM calls
  const trace = langfuse.trace({ name: 'chat-completion' })
  const generation = trace.generation({
    name: 'claude-response',
    model: 'claude-3-5-sonnet',
    input: messages,
    metadata: { videoIds },
  })
  // ... call Claude
  generation.end({ output: response })
  ```

- [ ] **Video Preview in Chat**
  ```typescript
  // Show thumbnail or short GIF next to citations
  <div className="flex items-center gap-2">
    <img src={citation.thumbnail} className="w-16 h-9 rounded" />
    <span>{citation.videoTitle}</span>
  </div>
  ```
- [ ] **Export Chat as Markdown**
  ```typescript
  function exportChat(messages: Message[]) {
    const markdown = messages
      .map((m) => `**${m.role}**: ${m.content}`)
      .join('\n\n')
    downloadFile(markdown, 'chat-export.md')
  }
  ```

### 🛠️ Tools/Technologies

- shadcn/ui (polish & components)
- Tailwind CSS (styling refinement)
- Loom (demo recording)
- Vercel (final deployment)
- ESLint + Prettier (code quality)

### ✅ Expected Outcome

- ✅ Production-quality UI avec polish visuel
- ✅ Tous les états (empty, loading, error) sont clairs
- ✅ Responsive et accessible
- ✅ README complet avec architecture, setup, screenshots
- ✅ `.env.example` documenté
- ✅ Loom demo professionnel (≤5 min)
- ✅ Deployed app stable et rapide
- ✅ Prêt pour présentation à Pierre-Habté

---

## 🔌 Step 6 – Browser Extension (Optional)

**🎯 Goal:** Construire une extension Chrome permettant d'ajouter des vidéos YouTube directement depuis le navigateur.

**⏱️ Temps estimé:** ~2-3 heures

### ✅ TODO List

#### 6.1 Extension Setup

- [ ] Créer dossier `extension/` à la racine
- [ ] Créer `manifest.json` (Manifest v3)
  ```json
  {
    "manifest_version": 3,
    "name": "Bravi YouTube AI Connector",
    "version": "1.0.0",
    "description": "Add YouTube videos to your Bravi AI knowledge base",
    "permissions": ["storage", "activeTab", "scripting"],
    "host_permissions": ["https://www.youtube.com/*"],
    "action": {
      "default_popup": "popup.html",
      "default_icon": {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    "content_scripts": [
      {
        "matches": ["https://www.youtube.com/*"],
        "js": ["content.js"],
        "css": ["content.css"]
      }
    ],
    "background": {
      "service_worker": "background.js"
    }
  }
  ```

#### 6.2 Content Script: Video Detection

- [ ] Créer `extension/content.js`

  ```javascript
  // Detect if on video page or channel page
  function detectPageType() {
    const url = window.location.href
    if (url.includes('/watch?v=')) {
      return {
        type: 'video',
        id: new URLSearchParams(window.location.search).get('v'),
      }
    }
    if (url.includes('/@') || url.includes('/channel/')) {
      const channelId = url.split('/')[4]
      return { type: 'channel', id: channelId }
    }
    return { type: 'unknown', id: null }
  }

  // Inject checkbox near video title
  function injectCheckbox() {
    const { type, id } = detectPageType()
    if (type === 'unknown') return

    const targetElement = document.querySelector('#title h1') // Video title
    if (!targetElement || document.getElementById('bravi-checkbox')) return

    const container = document.createElement('div')
    container.id = 'bravi-checkbox-container'
    container.innerHTML = `
      <label style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
        <input type="checkbox" id="bravi-checkbox" />
        <span id="bravi-status">Add to Bravi KB</span>
      </label>
    `
    targetElement.parentElement.appendChild(container)

    checkVideoStatus(id)
  }

  async function checkVideoStatus(youtubeId) {
    const userId = await getUserId() // From chrome.storage
    const response = await fetch(
      `${API_URL}/api/videos/status?youtubeId=${youtubeId}&userId=${userId}`,
    )
    const { exists } = await response.json()

    const checkbox = document.getElementById('bravi-checkbox')
    const status = document.getElementById('bravi-status')

    if (exists) {
      checkbox.checked = true
      checkbox.disabled = true
      status.textContent = '✓ In your KB'
    }
  }

  // Listen for checkbox change
  document.addEventListener('change', async (e) => {
    if (e.target.id === 'bravi-checkbox' && e.target.checked) {
      const { type, id } = detectPageType()
      await addToKnowledgeBase(window.location.href, type, id)

      document.getElementById('bravi-status').textContent = '⏳ Queued'
    }
  })

  // Inject on page load and URL changes
  injectCheckbox()

  // Listen for YouTube SPA navigation
  let lastUrl = location.href
  new MutationObserver(() => {
    const url = location.href
    if (url !== lastUrl) {
      lastUrl = url
      setTimeout(injectCheckbox, 1000) // Delay for YouTube to load
    }
  }).observe(document.body, { subtree: true, childList: true })
  ```

#### 6.3 Background Script: API Calls

- [ ] Créer `extension/background.js`

  ```javascript
  const API_URL = 'https://your-app.vercel.app'

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADD_VIDEO') {
      addVideoToKB(message.url, message.userId)
        .then((result) => sendResponse({ success: true, result }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        )
      return true // Keep channel open for async response
    }
  })

  async function addVideoToKB(url, userId) {
    const response = await fetch(`${API_URL}/api/videos/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await getAccessToken()}`,
      },
      body: JSON.stringify({ url, userId }),
    })

    if (!response.ok) throw new Error('Failed to add video')
    return await response.json()
  }

  async function getAccessToken() {
    const { accessToken } = await chrome.storage.local.get('accessToken')
    return accessToken
  }
  ```

#### 6.4 Popup UI: Auth & Status

- [ ] Créer `extension/popup.html`

  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <style>
        body {
          width: 300px;
          padding: 16px;
          font-family: system-ui;
        }
        .auth-section {
          text-align: center;
        }
        .status {
          margin-top: 16px;
        }
        button {
          width: 100%;
          padding: 8px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div id="auth-section" class="auth-section">
        <h3>Bravi YouTube AI</h3>
        <p>Login to add videos to your KB</p>
        <button id="login-btn">Login with Bravi</button>
      </div>

      <div id="status-section" style="display: none;">
        <h4>Recent Activity</h4>
        <div id="recent-videos"></div>
        <button id="logout-btn">Logout</button>
      </div>

      <script src="popup.js"></script>
    </body>
  </html>
  ```

- [ ] Créer `extension/popup.js`

  ```javascript
  document.addEventListener('DOMContentLoaded', async () => {
    const { accessToken, userId } = await chrome.storage.local.get([
      'accessToken',
      'userId',
    ])

    if (accessToken) {
      showStatusSection(userId)
    } else {
      showAuthSection()
    }
  })

  document.getElementById('login-btn')?.addEventListener('click', () => {
    // Open OAuth flow or magic link
    chrome.tabs.create({ url: `${API_URL}/login?extension=true` })
  })

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await chrome.storage.local.clear()
    location.reload()
  })

  async function showStatusSection(userId) {
    document.getElementById('auth-section').style.display = 'none'
    document.getElementById('status-section').style.display = 'block'

    // Fetch recent videos
    const videos = await fetchRecentVideos(userId)
    const container = document.getElementById('recent-videos')
    container.innerHTML = videos
      .map(
        (v) => `
      <div style="margin: 8px 0;">
        <strong>${v.title}</strong><br>
        <small>${v.status}</small>
      </div>
    `,
      )
      .join('')
  }
  ```

#### 6.5 API Endpoints for Extension

- [ ] Créer `app/api/videos/status/route.ts`

  ```typescript
  export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const youtubeId = searchParams.get('youtubeId')
    const userId = searchParams.get('userId')

    const video = await prisma.video.findFirst({
      where: { youtubeId, userId },
    })

    return Response.json({ exists: !!video, status: video?.status })
  }
  ```

- [ ] Créer `app/api/videos/add/route.ts` (si pas déjà fait)

  ```typescript
  export async function POST(req: NextRequest) {
    const { url, userId } = await req.json()

    // Verify auth token
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token || !verifyToken(token)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reuse existing addYouTubeContent logic
    const result = await addYouTubeContent(url, userId)
    return Response.json(result)
  }
  ```

#### 6.6 Authentication Flow

- [ ] Option 1: OAuth-like flow

  ```typescript
  // app/login/page.tsx
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('extension') === 'true') {
      // After successful login, send token to extension
      const token = getAccessToken()
      const userId = getCurrentUserId()

      // Use chrome.runtime.sendMessage if in extension context
      if (window.chrome?.runtime?.id) {
        chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', token, userId })
      }
    }
  }, [])
  ```

- [ ] Option 2: Manual token copy-paste
  ```html
  <!-- In popup.html -->
  <input type="text" id="token-input" placeholder="Paste your access token" />
  <button id="save-token-btn">Save Token</button>
  ```

#### 6.7 Extension Icons

- [ ] Créer icons dans `extension/icons/`
  - `icon16.png` (16x16)
  - `icon48.png` (48x48)
  - `icon128.png` (128x128)
- [ ] Use Figma or Canva pour design simple
- [ ] Couleurs de brand Bravi

#### 6.8 Styling & Polish

- [ ] Créer `extension/content.css`

  ```css
  #bravi-checkbox-container {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px;
    border-radius: 4px;
    backdrop-filter: blur(10px);
  }

  #bravi-checkbox {
    cursor: pointer;
  }

  #bravi-checkbox:disabled {
    cursor: not-allowed;
  }
  ```

- [ ] Dark mode compatible
- [ ] Match YouTube's design language

#### 6.9 Testing

- [ ] Load unpacked extension in Chrome
  1. Go to `chrome://extensions/`
  2. Enable "Developer mode"
  3. Click "Load unpacked"
  4. Select `extension/` folder
- [ ] Test on video page:
  - [ ] Checkbox appears
  - [ ] Status checked correctly
  - [ ] Adding video works
- [ ] Test on channel page:
  - [ ] Detection works
  - [ ] Can add channel
- [ ] Test popup:
  - [ ] Login flow
  - [ ] Recent videos display
  - [ ] Logout

#### 6.10 Distribution (Optional)

- [ ] Zip extension folder
- [ ] Create Chrome Web Store developer account
- [ ] Submit for review
- [ ] Add extension link to README

### 🛠️ Tools/Technologies

- Chrome Extensions API (Manifest v3)
- Vanilla JavaScript (content scripts)
- Next.js API routes (backend)
- Chrome storage API

### ✅ Expected Outcome

- ✅ Extension installable dans Chrome/Edge/Brave
- ✅ Checkbox apparaît sur pages YouTube (vidéo + chaîne)
- ✅ Indique si vidéo déjà dans KB
- ✅ One-click pour ajouter à la knowledge base
- ✅ Popup affiche activité récente
- ✅ Sync automatique avec app principale

---

## 🎯 Summary & Next Steps

### Total Time Estimate

- Step 1: 2h (Bootstrap)
- Step 2: 2h (Ingestion)
- Step 3: 2.5h (Transcripts & Embeddings)
- Step 4: 3h (Chat & RAG)
- Step 5: 2.5h (Polish & Deliverables)
- Step 6: 2-3h (Extension - Optional)

**Total: 12-14 hours** (sans l'extension)

### Success Criteria Checklist

- [ ] ✅ Deployed Vercel app (live URL)
- [ ] ✅ Full authentication flow (magic link)
- [ ] ✅ Video/channel ingestion working
- [ ] ✅ Real-time status updates
- [ ] ✅ Scoped chat with citations
-
