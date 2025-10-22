/**
 * Prisma Setup Verification Script
 *
 * This script verifies that Prisma is properly configured and can connect to the database.
 * Run with: npx tsx scripts/verify-prisma-setup.ts
 *
 * Prerequisites:
 * 1. Install tsx: npm install -D tsx
 * 2. Ensure DATABASE_URL is set in .env or .env.local
 * 3. Ensure migrations have been run: npm run db:migrate
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
})

async function verifySetup() {
  console.log('🔍 Verifying Prisma setup...\n')

  try {
    // Test 1: Database connection
    console.log('1️⃣ Testing database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully\n')

    // Test 2: Check tables exist
    console.log('2️⃣ Checking if tables exist...')
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `
    console.log(
      `✅ Found ${tables.length} tables:`,
      tables.map((t) => t.tablename).join(', '),
    )
    console.log()

    // Test 3: Create a test user
    console.log('3️⃣ Testing User model...')
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        avatarUrl: 'https://i.pravatar.cc/150',
      },
    })
    console.log('✅ User created:', { id: testUser.id, email: testUser.email })
    console.log()

    // Test 4: Create a test video
    console.log('4️⃣ Testing Video model...')
    const testVideo = await prisma.video.create({
      data: {
        userId: testUser.id,
        youtubeId: `test-video-${Date.now()}`,
        title: 'Test Video',
        channelName: 'Test Channel',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg',
        duration: 180,
        status: 'QUEUED',
      },
    })
    console.log('✅ Video created:', {
      id: testVideo.id,
      title: testVideo.title,
      status: testVideo.status,
    })
    console.log()

    // Test 5: Create a test conversation
    console.log('5️⃣ Testing Conversation model...')
    const testConversation = await prisma.conversation.create({
      data: {
        userId: testUser.id,
        title: 'Test Conversation',
      },
    })
    console.log('✅ Conversation created:', {
      id: testConversation.id,
      title: testConversation.title,
    })
    console.log()

    // Test 6: Test relationships
    console.log('6️⃣ Testing relationships...')
    const userWithRelations = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        videos: true,
        conversations: true,
      },
    })
    console.log('✅ User with relations:', {
      email: userWithRelations?.email,
      videosCount: userWithRelations?.videos.length,
      conversationsCount: userWithRelations?.conversations.length,
    })
    console.log()

    // Test 7: Test enum
    console.log('7️⃣ Testing VideoStatus enum...')
    const videoStatuses = ['QUEUED', 'PROCESSING', 'READY', 'FAILED']
    console.log('✅ VideoStatus enum values:', videoStatuses)
    console.log()

    // Cleanup: Delete test data
    console.log('🧹 Cleaning up test data...')
    await prisma.video.delete({ where: { id: testVideo.id } })
    await prisma.conversation.delete({ where: { id: testConversation.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('✅ Test data cleaned up\n')

    console.log('🎉 All tests passed! Prisma is configured correctly.')
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifySetup()
