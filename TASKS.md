# Hierarchical Chunking with Multi-Level Search Implementation Plan

## 🧠 Context about Project

YouTube-GPT is a full-stack AI-powered YouTube search application built with Next.js 14, Supabase, and ZeroEntropy. The platform helps users search across hours of video content by creating a searchable knowledge base from YouTube transcripts. Users can add individual videos or entire channels, and the system extracts transcripts, chunks them intelligently, and indexes them in ZeroEntropy for semantic search. The application features a ChatGPT-style interface with conversation history and a knowledge base explorer.

The current system processes videos by extracting transcripts from YouTube, chunking them into smaller segments, and indexing them in ZeroEntropy collections. Users can then ask questions via a chat interface where Claude (via Vercel AI SDK) searches the indexed content to provide grounded answers with citations and timestamps.

## 🏗️ Context about Feature

The current chunking strategy creates a single level of chunks (30-90 seconds) optimized for precise retrieval. However, for broad queries like "what do they discuss?" across multiple long videos, retrieving many small chunks is inefficient and may miss broader themes. The hierarchical chunking feature will:

1. **Level 1 (Detailed)**: Create 30-90 second chunks (already implemented with current token-based config of 250-500 tokens)
2. **Level 2 (Thematic)**: Create larger concatenated chunks (5-20 minutes) adaptive to video length, stored as separate entries in ZeroEntropy with level metadata

The system already has a chunking pipeline in `src/lib/zeroentropy/chunking.ts` that handles token-based chunking. We need to extend this to support hierarchical chunking with duration-based adaptive sizing for Level 2. The Video model (in Supabase) has a `duration` field that we'll use to determine chunking strategy.

## 🎯 Feature Vision & Flow

**End-to-End Behavior:**
1. When a video is ingested, the system determines if Level 2 chunks are needed based on video duration
2. For videos > 15 minutes: Create both Level 1 (detailed) and Level 2 (thematic) chunks
3. For videos < 15 minutes: Only create Level 1 chunks
4. Each chunk level has distinct metadata: `chunkLevel: "1" | "2"`
5. Claude has access to two search tools:
   - `searchDetailedChunks`: Searches Level 1 chunks for specific facts/timestamps
   - `searchThematicChunks`: Searches Level 2 chunks for broad overviews/themes
6. Claude intelligently chooses which tool to use based on query intent, and can call both sequentially for comprehensive answers
7. Users get both precise citations (Level 1) and thematic understanding (Level 2)

## 📋 Implementation Plan: Tasks & Subtasks

### Phase 1: Extend Chunking System for Hierarchical Strategy

#### Task 1.1: Update Type Definitions
- [x] Add `ChunkLevel` type and extend `ProcessedTranscriptSegment` interface in `src/lib/zeroentropy/types.ts`
  - Add `chunkLevel?: "1" | "2"` field to `ProcessedTranscriptSegment`
  - This will be used to distinguish detailed vs thematic chunks in metadata
- [x] Validation: Types export correctly and `chunkLevel` is optional for backward compatibility

#### Task 1.2: Create Adaptive Level 2 Chunking Function
- [x] Create new function `getLevel2ChunkConfig(durationSeconds: number)` in `src/lib/zeroentropy/chunking.ts`
  - Input: Video duration in seconds
  - Returns: `{ minChunkDuration, maxChunkDuration, targetChunkDuration } | null`
  - Logic: Skip for videos < 15 min, return adaptive configs for longer videos
- [x] Implement duration-based configuration:
  - 15-30 min: 120-240 sec chunks (target 180s)
  - 30-60 min: 180-360 sec chunks (target 270s)
  - 60-120 min: 300-600 sec chunks (target 450s)
  - 120+ min: 600-1200 sec chunks (target 900s)
- [x] Add unit tests for adaptive chunking logic
- [x] Validation: Function returns correct config ranges for various video lengths

#### Task 1.3: Create Hierarchical Chunking Function
- [x] Create new function `chunkHierarchically()` in `src/lib/zeroentropy/chunking.ts`
  - Takes: `transcriptData`, `userId`, `videoId`, `videoTitle`, `videoDuration`
  - Returns: `{ level1Chunks: ProcessedTranscriptSegment[], level2Chunks: ProcessedTranscriptSegment[] }`
- [x] Implement logic:
  - Always create Level 1 chunks using existing `chunkTranscriptSegments()` function
  - Conditionally create Level 2 chunks if video duration qualifies (using new function from 1.2)
  - Set `chunkLevel: "1"` for detailed chunks
  - Set `chunkLevel: "2"` for thematic chunks
  - Calculate Level 2 chunks by grouping Level 1 chunks based on duration targets
- [x] Add JSDoc comments explaining the two-level strategy
- [x] Validation: Returns both levels for long videos, only Level 1 for short videos

### Phase 2: Update Chunking Pipeline

#### Task 2.1: Modify Transcript Processing Function
- [x] Update `processTranscriptSegments()` in `src/lib/zeroentropy/transcript.ts`
  - Change signature to accept `videoDuration?: number` parameter
  - Call new `chunkHierarchically()` instead of `chunkTranscriptSegments()`
  - Return both Level 1 and Level 2 chunks with `chunkLevel` metadata
- [x] Update logging to report stats for both levels
- [x] Validation: Function processes both levels and logs appropriate metrics

#### Task 2.2: Update ZeroEntropy Processor
- [x] Modify `processTranscriptSegmentsForZeroEntropy()` in `src/lib/inngest/utils/zeroentropy-processor.ts`
  - Get video duration from `video.duration` field
  - Pass duration to `processTranscriptSegments()` function
  - Combine Level 1 and Level 2 chunks for indexing
  - Update logging to show breakdown of chunks by level
- [x] Validation: Processor correctly extracts duration and passes it through the pipeline

#### Task 2.3: Update Indexing to Support Level Metadata
- [x] Modify `indexTranscriptPage()` in `src/lib/zeroentropy/pages.ts`
  - Add `chunkLevel` to metadata object with value from `chunk.chunkLevel`
  - Update page ID generation to include level suffix: `{videoId}-level{1|2}-chunk{N}`
  - Format: `videoId-level1-chunk0`, `videoId-level2-chunk0`, etc.
- [x] Update path parsing logic in search functions to handle new format
- [x] Validation: Chunks are indexed with correct level metadata and unique page IDs

### Phase 3: Create Multi-Tool Search System

#### Task 3.1: Create Separate Search Tools
- [x] Create `searchDetailedChunks` tool in `src/lib/tools/search-tool.ts`
  - Description: "Search precise 30-90 second video chunks for specific facts, timestamps, and detailed information"
  - Parameters: `query`, `videoIds`, `limit` (same as current tool)
- [x] Create `searchThematicChunks` tool in `src/lib/tools/search-tool.ts`
  - Description: "Search broader 5-20 minute video sections for overviews, themes, and general topics"
  - Parameters: `query`, `videoIds`, `limit`
- [x] Keep existing `createSearchKnowledgeBase` function but create separate wrappers
  - `createSearchDetailedChunks(userId, videoScope)` - filters for `chunkLevel: "1"`
  - `createSearchThematicChunks(userId, videoScope)` - filters for `chunkLevel: "2"`
- [x] Validation: Both tools are exported and have distinct descriptions

#### Task 3.2: Update Search Videos Function to Filter by Level
- [x] Modify `searchVideos()` in `src/lib/search-videos.ts`
  - Add optional `chunkLevel?: "1" | "2"` parameter to `SearchVideosParams`
  - Add filter condition in ZeroEntropy query:
    ```typescript
    if (chunkLevel) {
      filter.chunkLevel = chunkLevel
    }
    ```
- [x] Update path parsing to handle new `level{1|2}-chunk{N}` format
- [x] Validation: Search correctly filters by chunk level when specified

#### Task 3.3: Update Chat Route to Expose Both Tools
- [x] Modify `src/app/api/chat/route.ts`
  - Import both `createSearchDetailedChunks` and `createSearchThematicChunks`
  - Create separate tool instances: `searchDetailed` and `searchThematic`
  - Add both to `tools` object in `streamText()` call
  - Keep `stopWhen: stepCountIs(5)` for multi-step tool calling
- [x] Update system prompt to mention availability of two search tools
- [x] Validation: Claude has access to both tools and can call them independently

### Phase 4: Testing & Validation

#### Task 4.1: Unit Tests for Adaptive Chunking
- [ ] Create test file `src/lib/zeroentropy/__tests__/chunking.test.ts`
- [ ] Test `getLevel2ChunkConfig()` with various video lengths:
  - 5 min video → returns null
  - 20 min video → returns 120-240 config
  - 45 min video → returns 180-360 config
  - 90 min video → returns 300-600 config
  - 150 min video → returns 600-1200 config
- [ ] Validation: All test cases pass with correct adaptive configurations

#### Task 4.2: Integration Tests for Hierarchical Chunking
- [ ] Test `chunkHierarchically()` with sample transcript data:
  - Short video (10 min) → only Level 1 chunks created
  - Long video (60 min) → both Level 1 and Level 2 chunks created
  - Verify chunk counts are reasonable for each level
- [ ] Validate metadata: All chunks have correct `chunkLevel`, `chunkIndex`, `start`, `end`, `duration`
- [ ] Validation: Integration tests demonstrate proper two-level chunking

#### Task 4.3: End-to-End Testing
- [ ] Test full pipeline with a 1-hour video:
  - Transcript extraction works
  - Both Level 1 and Level 2 chunks are created
  - Chunks are indexed in ZeroEntropy with correct metadata
  - Search tools can retrieve chunks from correct levels
- [ ] Test queries:
  - "What is this video about?" → should use thematic tool
  - "Find the timestamp where they discuss pricing" → should use detailed tool
  - Complex query spanning both levels → should call both tools sequentially
- [ ] Validation: End-to-end flow works correctly for both chunk levels

## Validation Criteria

### Functional Requirements
✅ Video duration determines Level 2 chunking eligibility  
✅ Both Level 1 and Level 2 chunks are indexed with distinct metadata  
✅ Two separate search tools allow Claude to choose appropriate granularity  
✅ Claude can call tools sequentially for comprehensive answers  
✅ Backward compatibility: Existing videos without `chunkLevel` still work  

### Performance Requirements
✅ Chunking overhead < 20% of original processing time  
✅ Index size growth < 2x (most videos only get Level 1)  
✅ Search latency unchanged for single-tool queries  
✅ Multi-tool queries complete within 5 seconds  

### Quality Requirements
✅ Level 2 chunks capture thematic content (5-20 min windows)  
✅ Level 1 chunks remain precise (30-90 sec windows)  
✅ No information loss: all transcript content is chunked  
✅ Overlap maintained between chunks for context continuity  

