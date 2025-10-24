import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { processVideo } from "@/lib/inngest/functions";

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
 * @see https://www.inngest.com/docs/sdk/serve
 */

// Register all Inngest functions
const functions = [
  processVideo,
];

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
