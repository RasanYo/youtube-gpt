import { serve } from "inngest/next";
import { inngest } from "../src/lib/inngest/client";

/**
 * Inngest Webhook Handler
 *
 * This Vercel Serverless Function serves as the webhook endpoint for Inngest.
 * It receives events from Inngest's cloud infrastructure and executes
 * registered functions for the video ingestion pipeline.
 *
 * The `serve` function handles GET, POST, and PUT requests from Inngest,
 * providing automatic function registration and event routing.
 *
 * Functions will be added in Issue #16 (Video Ingestion Function).
 *
 * @see https://www.inngest.com/docs/sdk/serve
 */

// Placeholder - will add actual functions in Issue #16
const functions: any[] = [];

export default serve({
  client: inngest,
  functions,
});
