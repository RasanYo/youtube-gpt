/**
 * Langfuse Client Singleton
 * 
 * This module provides a singleton instance of the Langfuse client for observability
 * and tracing across the YouTube-GPT application.
 * 
 * Configuration:
 * - Server-side tracing for AI calls and background jobs
 * - Automatic error handling with graceful degradation
 * - Optional environment variables (app works without Langfuse)
 * 
 * Usage:
 * ```typescript
 * import { langfuse } from '@/lib/langfuse/client'
 * 
 * // Create a trace
 * const trace = langfuse.trace({
 *   name: 'video-processing',
 *   userId: 'user-123'
 * })
 * 
 * // Log metadata
 * trace.event({ name: 'transcript-extracted', metadata: { segments: 150 } })
 * 
 * // Flush when done
 * await trace.flush()
 * ```
 */

import { Langfuse } from 'langfuse'

const secretKey = process.env.LANGFUSE_SECRET_KEY
const publicKey = process.env.LANGFUSE_PUBLIC_KEY
const host = process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com'

/**
 * Singleton Langfuse client instance
 * 
 * This client is configured with:
 * - secretKey: For server-side tracing (required for creating traces)
 * - publicKey: For client-side access (optional)
 * - baseUrl: Defaults to cloud.langfuse.com
 * 
 * Note: The app will work even if Langfuse credentials are missing.
 * Tracing errors are handled gracefully without breaking functionality.
 */
export const langfuse = new Langfuse({
  secretKey: secretKey || undefined,
  publicKey: publicKey || undefined,
  baseUrl: host,
})

/**
 * Check if Langfuse is properly configured
 * Returns true if both secretKey and publicKey are set
 */
export function isLangfuseConfigured(): boolean {
  return !!(secretKey && publicKey)
}

/**
 * Type helper for the Langfuse client instance
 * Use this when you need to type-hint the client in function parameters
 */
export type LangfuseClient = typeof langfuse

