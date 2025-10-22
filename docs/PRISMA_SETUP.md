# Prisma Database Setup - Complete Guide

## Overview

This document provides a comprehensive guide to the Prisma setup for YouTube GPT, including the database schema, configuration, usage patterns, and troubleshooting tips.

## Database Schema

### Models

#### User
Represents authenticated users synced with Supabase Auth.

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  videos        Video[]
  conversations Conversation[]
}
```

**Fields:**
- `id`: UUID matching Supabase Auth user ID
- `email`: Unique email address (indexed)
- `name`: Optional display name
- `avatarUrl`: Optional profile picture URL
- `createdAt`/`updatedAt`: Automatic timestamp management

#### Video
Tracks ingested YouTube videos with processing status.

```prisma
model Video {
  id           String      @id @default(uuid())
  userId       String
  youtubeId    String      @unique
  title        String
  thumbnailUrl String?
  channelName  String
  duration     Int         // seconds
  status       VideoStatus @default(QUEUED)
  error        String?     // error message if status is FAILED
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([status])
}
```

**Fields:**
- `youtubeId`: Unique YouTube video ID (prevents duplicates)
- `duration`: Video length in seconds
- `status`: Processing status (enum)
- `error`: Populated when status is FAILED

**Indexes:**
- `userId`: Optimizes queries like "get all videos for user"
- `status`: Optimizes queries like "get all QUEUED videos"

#### Conversation
Represents chat sessions between users and the AI.

```prisma
model Conversation {
  id        String   @id @default(uuid())
  userId    String
  title     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

**Note:** Message model will be added in Phase 2.

### Enums

#### VideoStatus
Represents the state of video processing.

```prisma
enum VideoStatus {
  QUEUED      // Video queued for ingestion
  PROCESSING  // Transcript extraction and embedding generation in progress
  READY       // Video ready for search and AI queries
  FAILED      // Processing failed (see error field)
}
```

## Configuration

### Connection String Format

Prisma requires a PostgreSQL connection string in Transaction mode for Supabase compatibility:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true
```

**Important:**
- Use **Transaction mode** (not Session mode)
- Include `?pgbouncer=true` parameter
- Replace `[PASSWORD]` and `[PROJECT-ID]` with your Supabase credentials

### Getting Your Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** > **Database**
4. Scroll to **Connection String** section
5. Select **Transaction** mode (not URI or Session)
6. Copy the connection string
7. Add to `.env.local` as `DATABASE_URL`

### Environment Files

- `.env` - Loaded by Prisma CLI (can contain DATABASE_URL)
- `.env.local` - Loaded by Vite (preferred for all env vars)
- `.env.example` - Template file (committed to git)

**Both `.env` and `.env.local` are gitignored for security.**

## Usage Patterns

### Importing the Prisma Client

```typescript
import { prisma } from '@/lib/prisma';
```

The singleton instance prevents connection pool exhaustion during development hot reloading.

### Common Operations

#### Create a User
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'Jane Doe',
    avatarUrl: 'https://example.com/avatar.jpg',
  },
});
```

#### Query Videos for a User
```typescript
const videos = await prisma.video.findMany({
  where: { 
    userId: user.id,
    status: 'READY' 
  },
  orderBy: { createdAt: 'desc' },
  include: { user: true }, // Include user relation
});
```

#### Update Video Status
```typescript
await prisma.video.update({
  where: { id: videoId },
  data: { 
    status: 'PROCESSING',
    updatedAt: new Date() // updatedAt auto-updates, but can be explicit
  },
});
```

#### Handle Failed Videos
```typescript
await prisma.video.update({
  where: { id: videoId },
  data: { 
    status: 'FAILED',
    error: 'Failed to extract transcript: Video not available'
  },
});
```

#### Create Conversation with User
```typescript
const conversation = await prisma.conversation.create({
  data: {
    userId: user.id,
    title: 'Chat about AI trends',
  },
});
```

#### Cascade Delete (Automatic)
```typescript
// Deleting a user automatically deletes their videos and conversations
await prisma.user.delete({
  where: { id: user.id },
});
// All related videos and conversations are deleted via onDelete: Cascade
```

## Prisma Commands

### Development Workflow

```bash
# 1. Make changes to prisma/schema.prisma
# 2. Create and apply migration
npm run db:migrate
# This prompts for a migration name and applies it

# 3. Prisma Client is auto-generated
# If needed, regenerate manually:
npx prisma generate
```

### Useful Commands

```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Push schema changes without creating migration (prototyping)
npm run db:push

# Pull schema from database (reverse engineer)
npx prisma db pull

# Reset database (⚠️ deletes all data)
npm run db:reset

# Validate schema without connecting to database
npx prisma validate

# Format schema file
npx prisma format
```

## Migration Workflow

### Creating a Migration

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Enter migration name (e.g., "add_video_duration_field")
4. Migration is created in `prisma/migrations/` and applied to database
5. Prisma Client is regenerated automatically

### Migration Files

Migrations are stored in version-controlled SQL files:

```
prisma/
└── migrations/
    ├── 20250122120000_init/
    │   └── migration.sql
    └── migration_lock.toml
```

### Applying Migrations in Production

```bash
# In production, use migrate deploy (doesn't prompt)
npx prisma migrate deploy
```

## Troubleshooting

### Connection Issues

**Error: P1001 - Can't reach database server**

Possible causes:
1. **Incorrect DATABASE_URL**: Verify connection string format
2. **Supabase project paused**: Free tier projects pause after inactivity
3. **Network/firewall**: Check if port 5432 is accessible
4. **Wrong connection mode**: Ensure using Transaction mode (`?pgbouncer=true`)

**Solutions:**
```bash
# Test connection
npx prisma db pull

# Check if Supabase is reachable
curl -I https://db.[PROJECT-ID].supabase.co

# Wake up paused project by visiting Supabase Dashboard
```

### Migration Issues

**Error: Migration failed to apply**

If a migration fails halfway:

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back [migration_name]

# Or mark as applied if it actually succeeded
npx prisma migrate resolve --applied [migration_name]
```

### Type Generation Issues

**Error: Cannot find module '@prisma/client'**

```bash
# Regenerate Prisma Client
npx prisma generate

# If still failing, delete node_modules and reinstall
rm -rf node_modules generated
npm install
```

### Schema Validation Errors

Common issues:
- **Duplicate field names**: Each field must be unique within a model
- **Invalid relation**: Foreign keys must reference valid fields
- **Enum value conflicts**: Enum values must be uppercase and alphanumeric

```bash
# Validate schema
npx prisma validate
```

## Performance Optimization

### Indexes

The schema includes indexes on commonly queried fields:

- `Video.userId` - Speeds up queries filtering by user
- `Video.status` - Speeds up queries filtering by processing status
- `Conversation.userId` - Speeds up queries filtering by user
- `User.email` - Implicit unique index

### Query Optimization Tips

```typescript
// ✅ Good: Only select needed fields
const videos = await prisma.video.findMany({
  select: { id: true, title: true, status: true },
  where: { userId: user.id },
});

// ❌ Bad: Loading all fields when only few are needed
const videos = await prisma.video.findMany({
  where: { userId: user.id },
});

// ✅ Good: Use pagination for large result sets
const videos = await prisma.video.findMany({
  take: 20,
  skip: page * 20,
  where: { userId: user.id },
});
```

### Connection Pooling

The singleton pattern in `src/lib/prisma.ts` ensures a single PrismaClient instance is reused across hot reloads in development, preventing connection pool exhaustion.

## Future Enhancements (Phase 2+)

Models to be added:

- **Message**: Chat messages with role (user/assistant), content, and conversation relation
- **VideoChunk**: Text chunks from video transcripts with timestamps
- **Embedding**: Vector embeddings for semantic search (may use ZeroEntropy instead)

Enhancements to existing models:
- Add `scopedVideoIds` JSON field to Conversation for tracking context
- Add `publishedAt` and `viewCount` to Video
- Add `preferences` JSON field to User

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)

