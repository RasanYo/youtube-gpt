# Scripts Directory

This directory contains utility scripts for the YouTube GPT project.

## Available Scripts

### `verify-prisma-setup.ts`

**Purpose:** Comprehensive verification of Prisma database setup including CRUD operations and relationships.

**Prerequisites:**

- Database must be accessible
- Migrations must be applied (`npm run db:migrate`)

**Usage:**

```bash
npx tsx scripts/verify-prisma-setup.ts
```

**What it tests:**

1. Database connection
2. Table existence
3. User model CRUD operations
4. Video model CRUD operations
5. Conversation model CRUD operations
6. Model relationships
7. VideoStatus enum
8. Automatic cleanup of test data

**Expected output:**

```
🔍 Verifying Prisma setup...
✅ Database connected successfully
✅ Found X tables: users, videos, conversations, ...
✅ User created: { id: '...', email: '...' }
✅ Video created: { id: '...', title: '...', status: 'QUEUED' }
✅ Conversation created: { id: '...', title: '...' }
✅ User with relations: { email: '...', videosCount: 1, conversationsCount: 1 }
✅ VideoStatus enum values: ['QUEUED', 'PROCESSING', 'READY', 'FAILED']
🧹 Cleaning up test data...
✅ Test data cleaned up
🎉 All tests passed! Prisma is configured correctly.
```

---

### `apply-initial-migration.sh`

**Purpose:** Apply the initial Prisma migration to create database tables.

**Prerequisites:**

- DATABASE_URL must be set in `.env` or `.env.local`
- Supabase database must be accessible

**Usage:**

```bash
./scripts/apply-initial-migration.sh
```

**What it does:**

1. Checks if DATABASE_URL is set
2. Tests database connectivity
3. Creates and applies the initial migration
4. Creates User, Video, Conversation tables with indexes and relationships

**Use this script if:**

- You're setting up the database for the first time
- The `npm run db:migrate` command failed due to connectivity issues
- You need to retry migration after resolving database access

---

## Troubleshooting

### Database Connection Issues

If scripts fail with connection errors:

1. **Check DATABASE_URL:**

   ```bash
   echo $DATABASE_URL
   ```

   Should output: `postgresql://postgres:...@db...supabase.co:5432/postgres?pgbouncer=true`

2. **Verify Supabase project is active:**
   - Visit [Supabase Dashboard](https://app.supabase.com)
   - Check if project is paused (free tier projects pause after inactivity)
   - Wake it up by running any query in the SQL Editor

3. **Test connectivity:**
   ```bash
   npx prisma db pull
   ```

### TypeScript Errors

If you get TypeScript errors when running scripts:

1. **Ensure tsx is installed:**

   ```bash
   npm install -D tsx
   ```

2. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

### Permission Errors (Linux/Mac)

If you get "permission denied" errors:

```bash
chmod +x scripts/*.sh
```

---

## Adding New Scripts

When adding new scripts to this directory:

1. **Use descriptive names:** `verify-[feature].ts` or `setup-[service].sh`
2. **Add shebang for shell scripts:** `#!/bin/bash`
3. **Make executable:** `chmod +x scripts/new-script.sh`
4. **Document in this README:** Add a section describing purpose, prerequisites, and usage
5. **Add error handling:** Check prerequisites before running main logic
6. **Provide clear output:** Use emojis and formatting for success/error messages

---

## Notes

- TypeScript scripts use `tsx` to run directly without compilation
- Shell scripts should be POSIX-compliant when possible
- All scripts should handle errors gracefully and provide helpful messages
- Clean up any test data created during verification
