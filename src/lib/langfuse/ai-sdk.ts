/**
 * Langfuse Integration Helpers for Vercel AI SDK
 * 
 * This module provides helpers to manually trace AI SDK calls with Langfuse.
 * 
 * Vercel AI SDK has experimental_telemetry that expects OpenTelemetry tracers,
 * but Langfuse uses its own native API. We manually wrap calls to capture:
 * - LLM generations with model, tokens, latency
 * - Trace metadata (userId, conversationId, scope)
 * 
 * The actual tracing happens in the API routes where we have access to
 * the StreamTextResult and can properly capture all data.
 */

import type { StreamTextResult, GenerateTextResult } from 'ai'
import { isLangfuseConfigured } from './client'

/**
 * Check if Langfuse is available for tracing
 */
export function shouldTrace(): boolean {
  return isLangfuseConfigured()
}

