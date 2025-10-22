/**
 * Prisma Client Singleton Instance
 *
 * This file exports a single PrismaClient instance to be used throughout the application.
 * The singleton pattern prevents multiple instances from being created during development
 * hot module reloading, which would exhaust the database connection pool.
 *
 * @example
 * ```typescript
 * import { prisma } from '@/lib/prisma';
 *
 * // Create a user
 * const user = await prisma.user.create({
 *   data: {
 *     email: 'user@example.com',
 *     name: 'John Doe'
 *   }
 * });
 *
 * // Query videos for a user
 * const videos = await prisma.video.findMany({
 *   where: { userId: user.id },
 *   include: { user: true }
 * });
 *
 * // Create a conversation
 * const conversation = await prisma.conversation.create({
 *   data: {
 *     userId: user.id,
 *     title: 'My first chat'
 *   }
 * });
 * ```
 */

import { PrismaClient } from '@prisma/client'

// Extend the global namespace to include prisma
declare global {
  var prisma: PrismaClient | undefined
}

/**
 * PrismaClient instance with optional logging configuration.
 * In development, logs all queries, errors, and warnings.
 * In production, only logs errors.
 */
const prismaClientSingleton = () => {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

/**
 * Global singleton instance of PrismaClient.
 * Reuses the same instance across hot module reloads in development.
 */
export const prisma = globalThis.prisma ?? prismaClientSingleton()

// Store the instance globally in development to persist across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

/**
 * Helper function to disconnect Prisma Client.
 * Useful for cleanup in tests or graceful shutdown.
 */
export const disconnectPrisma = async () => {
  await prisma.$disconnect()
}
