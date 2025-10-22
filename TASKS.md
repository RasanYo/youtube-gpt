# Issue #9: Prisma Database Setup - Implementation Plan

**Status**: ✅ COMPLETE
**Branch**: `9-featureprisma-database`
**Priority**: ⚡ High
**Estimated Time**: ~20 minutes (Actual: ~60 minutes)

---

## >� Context about Project

YouTube GPT is an intelligent video knowledge base application that transforms hours of YouTube content into an instantly searchable, AI-powered knowledge base. The platform allows users to ingest YouTube videos or entire channels, search across their personal video library, and interact with an AI assistant that provides grounded answers with citations and timestamps. The application is being built as part of the Bravi Founding Engineer technical assessment and follows a structured roadmap divided into multiple steps.

Currently, the project is in **Step 1 (Project Bootstrap & Skeleton Deployment)** and has successfully completed the foundational setup including: Vite + React + TypeScript configuration, Tailwind CSS with dark mode, shadcn/ui component library integration, a three-column responsive layout (conversation sidebar, chat area, knowledge base), and Supabase authentication with magic link email login. The tech stack uses Vite for the frontend build tool, React 18 for the UI framework, Supabase for authentication and PostgreSQL database, and will use Prisma as the ORM layer. The application is a single-page application (SPA) with client-side routing via React Router DOM.

This issue (Issue #9) focuses on establishing the database layer with Prisma ORM, which is a critical foundation for all future features including video ingestion, conversation management, and AI-powered search. The project is approximately 70% through Step 1, with deployment and UI polish remaining after this task.

---

## <� Context about Feature

The Prisma database setup establishes the foundational data models and ORM layer that will power the entire YouTube GPT application. Prisma is a modern TypeScript-first ORM that provides type-safe database access, automatic migrations, and a developer-friendly schema definition language. In this architecture, Prisma will sit between the React frontend (via future API routes or server actions) and the Supabase PostgreSQL database.

The feature involves creating three core models that represent the application's data structure: **User** (storing user profiles from Supabase Auth), **Video** (representing ingested YouTube videos with metadata and processing status), and **Conversation** (representing chat sessions between users and the AI assistant). These models form the foundation for Phase 1 functionality and will be extended in later phases with additional models like Message, VideoChunk, and Embedding for vector search.

The Prisma schema will use PostgreSQL as the database provider (connecting to Supabase's managed PostgreSQL instance via a `DATABASE_URL` connection string). The schema includes foreign key relationships (User � Videos, User � Conversations), an enum for video processing status (QUEUED, PROCESSING, READY, FAILED), and timestamp fields for auditing. A singleton pattern will be implemented for the PrismaClient instance to prevent connection pool exhaustion during development with hot module reloading. This setup must integrate seamlessly with the existing Supabase authentication system, where Supabase Auth manages user sessions and Prisma manages the application's business data.

---

## <� Feature Vision & Flow

The desired end state is a fully configured Prisma ORM setup with type-safe database access throughout the application. Developers should be able to query and mutate data using Prisma's intuitive API (e.g., `prisma.user.create()`, `prisma.video.findMany()`) with full TypeScript autocompletion and compile-time type checking. The database schema should accurately represent the application's domain with proper relationships, constraints, and enums.

The implementation flow follows this sequence: install Prisma dependencies � initialize Prisma with `npx prisma init` � configure the schema file with PostgreSQL datasource and models � create and apply the initial migration to generate database tables � generate the Prisma Client to create TypeScript types � create a singleton PrismaClient instance for use throughout the application. The migration will create all necessary tables (users, videos, conversations) with proper indexes, foreign keys, and constraints in the Supabase PostgreSQL database.

From a developer experience perspective, once this feature is complete, any developer working on the project should be able to import `prisma` from `@/lib/prisma`, write type-safe queries, and have full confidence that their code matches the database schema. The Prisma Studio GUI (`npx prisma studio`) will provide a visual interface for inspecting and manipulating data during development. Future features like video ingestion will create Video records with status tracking, the chat interface will create and retrieve Conversation records, and all operations will maintain referential integrity through Prisma's relationship management. Error handling will be built on Prisma's exception types, and all timestamps will be automatically managed by the `@updatedAt` directive.

---

## =� Implementation Plan: Tasks & Subtasks

### Task 1: Install Prisma Dependencies and Initialize Project

**Goal**: Set up Prisma in the project by installing required packages and generating the initial configuration files.

- [ ] **1.1**: Install Prisma CLI and Client packages
  - Run `npm install prisma @prisma/client` to add both the Prisma CLI (dev dependency) and the Prisma Client (runtime dependency)
  - The `prisma` package provides CLI commands for migrations, schema management, and code generation
  - The `@prisma/client` package provides the runtime query API that will be used in application code

- [ ] **1.2**: Initialize Prisma in the project
  - Run `npx prisma init` to generate the `prisma/` directory with a `schema.prisma` file and add `DATABASE_URL` to `.env.local`
  - This command creates the foundational structure: `prisma/schema.prisma` (schema definition) and updates `.env.local` with a placeholder `DATABASE_URL`
  - The generated schema will include default PostgreSQL datasource and Prisma Client generator configurations

- [ ] **1.3**: Verify the generated files
  - Confirm that `prisma/schema.prisma` exists with default datasource and generator blocks
  - Confirm that `.env.local` has been updated with `DATABASE_URL` placeholder (if not already present)
  - Check that `.gitignore` includes `.env.local` to prevent committing sensitive database credentials

---

### Task 2: Configure Prisma Schema with Database Connection

**Goal**: Configure the Prisma schema file to connect to the Supabase PostgreSQL database and set up the proper generator settings.

- [ ] **2.1**: Update the datasource block in `prisma/schema.prisma`
  - Open `prisma/schema.prisma` and verify/update the `datasource db` block to use PostgreSQL provider
  - Set `provider = "postgresql"` and `url = env("DATABASE_URL")` to read connection string from environment variables
  - This tells Prisma to use PostgreSQL (compatible with Supabase) and read credentials securely from `.env.local`

- [ ] **2.2**: Verify the generator block configuration
  - Confirm the `generator client` block is present with `provider = "prisma-client-js"`
  - This generator creates the TypeScript-typed Prisma Client that will be imported in application code
  - The generator runs automatically during `prisma generate` and after migrations

- [ ] **2.3**: Add DATABASE_URL to environment files
  - Update `.env.local` with the Supabase PostgreSQL connection string in the format: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true`
  - Get the connection string from Supabase Dashboard > Project Settings > Database > Connection String (Transaction mode)
  - Update `.env.example` with a placeholder `DATABASE_URL=postgresql://user:password@host:port/database` and instructions for developers

---

### Task 3: Define Phase 1 Database Schema Models

**Goal**: Create the three core data models (User, Video, Conversation) with proper fields, relationships, and enums in the Prisma schema.

- [ ] **3.1**: Define the VideoStatus enum
  - Add an enum definition before the model blocks: `enum VideoStatus { QUEUED PROCESSING READY FAILED }`
  - This enum represents the four states of video processing: queued for ingestion, currently being processed, ready for use, or failed with errors
  - Enums provide type safety and prevent invalid status values in the database

- [ ] **3.2**: Define the User model
  - Create a `model User` block with fields: `id` (String, @id @default(uuid())), `email` (String, @unique), `name` (String?), `avatarUrl` (String?), `createdAt` (DateTime, @default(now())), `updatedAt` (DateTime, @updatedAt)
  - Add relationship fields: `videos` (Video[]), `conversations` (Conversation[]) to establish one-to-many relationships
  - The `id` should use UUID to match Supabase Auth user IDs; nullable fields (name, avatarUrl) allow gradual profile completion

- [ ] **3.3**: Define the Video model
  - Create a `model Video` block with fields: `id` (String, @id @default(uuid())), `userId` (String), `youtubeId` (String, @unique), `title` (String), `thumbnailUrl` (String?), `channelName` (String), `duration` (Int), `status` (VideoStatus, @default(QUEUED)), `error` (String?), `createdAt` (DateTime, @default(now())), `updatedAt` (DateTime, @updatedAt)
  - Add relationship field: `user` (User, @relation(fields: [userId], references: [id], onDelete: Cascade))
  - The `youtubeId` is unique to prevent duplicate video ingestion; `duration` is stored in seconds; cascading delete ensures videos are removed when users are deleted

- [ ] **3.4**: Define the Conversation model
  - Create a `model Conversation` block with fields: `id` (String, @id @default(uuid())), `userId` (String), `title` (String), `createdAt` (DateTime, @default(now())), `updatedAt` (DateTime, @updatedAt)
  - Add relationship field: `user` (User, @relation(fields: [userId], references: [id], onDelete: Cascade))
  - Keep this model simple for Phase 1; it will be extended with Message relationships in later phases

- [ ] **3.5**: Add indexes for query optimization
  - Add `@@index([userId])` to Video and Conversation models to optimize queries filtering by user
  - Add `@@index([status])` to Video model to optimize queries filtering by processing status
  - Indexes improve query performance for common access patterns like "get all videos for a user" or "find all queued videos"

---

### Task 4: Create and Apply Database Migration

**Goal**: Generate the initial migration from the Prisma schema and apply it to the Supabase PostgreSQL database to create all tables and constraints.

- [ ] **4.1**: Create the initial migration
  - Run `npx prisma migrate dev --name init` to create the first migration based on the schema
  - This command generates SQL files in `prisma/migrations/` that represent the schema changes needed to reach the current state
  - The migration will create tables for User, Video, VideoStatus enum, Conversation, along with indexes and foreign key constraints

- [ ] **4.2**: Verify migration was created successfully
  - Check that `prisma/migrations/` directory contains a timestamped folder (e.g., `20250122_init/`) with a `migration.sql` file
  - Review the generated SQL to ensure it includes CREATE TABLE statements, foreign keys, indexes, and enum definitions
  - The migration SQL should be committed to version control so other developers can apply the same schema changes

- [ ] **4.3**: Confirm migration was applied to database
  - The `prisma migrate dev` command automatically applies the migration to the database specified in `DATABASE_URL`
  - Check the command output for success messages confirming table creation
  - Verify in Supabase Dashboard > Database > Tables that `User`, `Video`, `Conversation`, and `_prisma_migrations` tables exist

- [ ] **4.4**: Test migration rollback capability (optional but recommended)
  - Run `npx prisma migrate reset` in a development environment to test rollback and reapply
  - This ensures migrations are idempotent and can be safely reset during development
  - Reset will drop all data, so only use in development environments

---

### Task 5: Generate Prisma Client

**Goal**: Generate the TypeScript-typed Prisma Client that provides the API for querying and mutating data in the application code.

- [ ] **5.1**: Generate the Prisma Client
  - Run `npx prisma generate` to generate the Prisma Client based on the current schema
  - This creates TypeScript types and API methods in `node_modules/@prisma/client` that match your schema exactly
  - The generated client includes methods like `prisma.user.create()`, `prisma.video.findMany()`, with full type safety and autocompletion

- [ ] **5.2**: Verify Prisma Client generation
  - Check that `node_modules/@prisma/client` directory exists with generated TypeScript declaration files
  - Try importing `PrismaClient` in a test file to verify TypeScript can resolve the types
  - Confirm no compilation errors when importing: `import { PrismaClient } from '@prisma/client'`

- [ ] **5.3**: Add postinstall script to package.json
  - Update `package.json` scripts to include `"postinstall": "prisma generate"` so the client is regenerated after `npm install`
  - This ensures new developers or CI/CD pipelines automatically generate the client after installing dependencies
  - The postinstall hook prevents "Cannot find module '@prisma/client'" errors in fresh environments

---

### Task 6: Create Prisma Client Singleton

**Goal**: Create a singleton PrismaClient instance in `src/lib/prisma.ts` to prevent multiple client instances and connection pool exhaustion during development.

- [ ] **6.1**: Create the prisma.ts file
  - Create a new file `src/lib/prisma.ts` to house the singleton PrismaClient instance
  - This file will export a single `prisma` instance that can be imported throughout the application
  - Using a singleton prevents hot module reloading in development from creating multiple client instances and exhausting database connections

- [ ] **6.2**: Implement singleton pattern with global caching
  - Import `PrismaClient` from `@prisma/client`
  - Create a type for the global prisma object: `const globalForPrisma = global as unknown as { prisma: PrismaClient }`
  - Export the singleton: `export const prisma = globalForPrisma.prisma || new PrismaClient()`
  - Add development caching: `if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`
  - This pattern reuses the client instance across hot reloads in development while creating fresh instances in production

- [ ] **6.3**: Add optional Prisma Client configuration
  - Consider adding logging configuration to the PrismaClient constructor for development: `new PrismaClient({ log: ['query', 'error', 'warn'] })`
  - Logging helps debug database queries during development but should be minimal in production
  - Add a comment explaining the singleton pattern for future developers

- [ ] **6.4**: Create a path alias export (optional)
  - Verify that the existing `@/` path alias in `tsconfig.json` and `vite.config.ts` resolves correctly
  - Test importing the prisma instance: `import { prisma } from '@/lib/prisma'` in a component file
  - Confirm TypeScript provides autocompletion for prisma methods like `prisma.user.`, `prisma.video.`

---

### Task 7: Verification and Testing

**Goal**: Verify the entire Prisma setup works correctly by testing database operations and confirming TypeScript integration.

- [ ] **7.1**: Test database connection with Prisma Studio
  - Run `npx prisma studio` to open the Prisma Studio GUI in the browser (typically at `http://localhost:5555`)
  - Verify all three models (User, Video, Conversation) appear in the left sidebar with correct fields
  - Try creating a test User record manually in Prisma Studio to confirm database connectivity

- [ ] **7.2**: Create a test script to verify CRUD operations
  - Create a temporary test file (e.g., `scripts/test-prisma.ts`) that imports the prisma singleton
  - Write a simple async function that creates a test User, creates a related Video, queries the data, and deletes it
  - Run the script with `npx tsx scripts/test-prisma.ts` (after installing `tsx` if needed) to verify all operations work
  - Example operations: `await prisma.user.create()`, `await prisma.video.create()`, `await prisma.user.findUnique({ include: { videos: true } })`

- [ ] **7.3**: Verify TypeScript type safety
  - Test that TypeScript catches errors like invalid field names: `prisma.user.create({ data: { invalidField: 'test' } })`
  - Confirm autocompletion works for model fields, relations, and query options
  - Test that relationship types are correct: creating a video should require a valid `userId`, and `user.videos` should be typed as `Video[]`

- [ ] **7.4**: Update package.json with useful Prisma scripts
  - Add convenience scripts to `package.json`: `"db:studio": "prisma studio"`, `"db:push": "prisma db push"`, `"db:reset": "prisma migrate reset"`
  - These scripts make it easier for developers to interact with the database during development
  - Document these scripts in the README.md under the "Development" section

- [ ] **7.5**: Test integration with existing Supabase Auth
  - Verify that the User model `id` field can store Supabase Auth user IDs (UUID format)
  - Consider creating a utility function to sync Supabase Auth users to the Prisma User table (this may be a future task)
  - Confirm that the `email` field from Supabase Auth can be stored in the Prisma User model without conflicts

---

### Task 8: Documentation and Cleanup

**Goal**: Document the Prisma setup, add helpful comments, and prepare the feature for team review.

- [ ] **8.1**: Add JSDoc comments to the prisma singleton
  - Add comprehensive JSDoc comments to `src/lib/prisma.ts` explaining the singleton pattern and usage
  - Include usage examples showing how to import and use the prisma client in application code
  - Document why the global caching is necessary (prevent connection pool exhaustion during development hot reloading)

- [ ] **8.2**: Update README.md with Prisma setup instructions
  - Add a "Database" section to README.md explaining the Prisma setup
  - Document how to run migrations: `npx prisma migrate dev`, how to access Prisma Studio: `npm run db:studio`
  - Include troubleshooting tips for common issues like connection string format or migration conflicts

- [ ] **8.3**: Update .env.example with DATABASE_URL instructions
  - Ensure `.env.example` includes `DATABASE_URL` with clear instructions on how to get the connection string from Supabase
  - Add a comment explaining the difference between Transaction mode and Session mode connection strings (use Transaction mode for Prisma)
  - Document the format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true`

- [ ] **8.4**: Add Prisma schema comments for future developers
  - Add comments to `prisma/schema.prisma` explaining the purpose of each model and important fields
  - Document the VideoStatus enum states and when each state is used in the ingestion pipeline
  - Add TODO comments for future enhancements (e.g., "// TODO: Add Message model for chat history in Phase 2")

- [ ] **8.5**: Clean up any temporary test files
  - Remove any temporary test scripts created during verification (e.g., `scripts/test-prisma.ts`)
  - Ensure no database test data remains in the production tables
  - Verify all changes are committed to the feature branch with clear commit messages

---

## =� Progress Tracking

**Started**: October 22, 2025
**Completed**: October 22, 2025
**Completion**: 8/8 tasks completed (100%) ✅

**Final Status:**
- ✅ All 8 tasks completed successfully
- ✅ Database migration applied (20251022113327_init)
- ✅ All tables created: users, videos, conversations
- ✅ Verification script passed all tests
- ✅ Prisma Client singleton working correctly
- ✅ Full TypeScript type safety confirmed
- ✅ Documentation complete

**Resolution:**
- Initial connectivity issues resolved by updating DATABASE_URL to use Supabase's new pooler format
- Migration successfully applied after connection string fix
- All CRUD operations, relationships, and indexes verified working

---

## = Related Issues

- **Depends on**: Issue #5 (Supabase Setup)  COMPLETED
- **Blocks**: Issue #8 (Environment Variables)
- **Part of**: Step 1  Project Bootstrap & Skeleton Deployment

---

## =� Reference Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma + Supabase Guide](https://www.prisma.io/docs/guides/database/supabase)
- [Prisma Client API Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
