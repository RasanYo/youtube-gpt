import { serve } from "inngest/next";
import { inngest } from "../src/lib/inngest/client";
import { processYouTubeVideo } from "../src/lib/inngest/functions/video-processing";

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
  processYouTubeVideo,
];

export default serve({
  client: inngest,
  functions,
});
