import { Inngest } from "inngest";

/**
 * Inngest Client
 *
 * Initializes the Inngest client for event-driven background job processing.
 * This client is used to send events and register functions for the video
 * ingestion pipeline.
 *
 * Configuration:
 * - id: Unique identifier for this application
 * - eventKey: Authentication key for sending events to Inngest
 *
 * @see https://www.inngest.com/docs
 */
export const inngest = new Inngest({
  id: "youtube-gpt",
  eventKey: import.meta.env.INNGEST_EVENT_KEY,
});
