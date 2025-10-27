# Implementation Plan: Intelligent Transcript Chunking Strategy

---

## 🧠 Context about Project

YouTube-GPT is an AI-powered knowledge management platform that transforms YouTube videos into a searchable personal knowledge base. The platform enables content creators, researchers, students, and professionals to efficiently extract, search, and repurpose information from their YouTube library.

The system consists of three main components:
- **Left Column**: Conversation history with user profile and settings
- **Center Column**: ChatGPT-style interface with AI chat and compose modes
- **Right Column**: Knowledge base explorer for video management and content input

Users can add individual YouTube videos or entire channels to their knowledge base. Videos are processed through a background job pipeline (Inngest) that extracts transcripts from YouTube, processes them, and indexes them in ZeroEntropy (a vector database). Once processed, users can search across their video library using AI to get grounded answers with citations and timestamps.

The platform is built on Next.js 14 with App Router, uses Supabase for database and authentication, ZeroEntropy for vector search and embedding storage, Inngest for background job processing, and integrates with Langfuse for observability. The system is designed for scalability and data isolation with row-level security (RLS) for multi-tenant support.

---

## 🏗️ Context about Feature

Currently, the transcript processing pipeline maps YouTube transcript segments 1:1 to ZeroEntropy documents. Each YouTube segment (typically 1-2 sentences) becomes a separate document in the vector database. This granularity creates several issues:

**Current Problems:**
- Limited semantic context: Each document is too small to capture complete thoughts or topics
- Poor retrieval quality: LLM receives disconnected fragments that lack narrative flow
- Inefficient search: Vector search works best with substantial content (optimal range: 200-800 tokens)
- No topic boundaries: Related segments are stored as separate documents, losing semantic relationships

The hybrid chunking strategy addresses these issues by intelligently grouping transcript segments into meaningful documents (targeting 500-800 tokens) while maintaining temporal continuity through sliding window overlaps (10%).

**Technical Constraints:**
- Must maintain accurate timestamps for video navigation
- Must preserve all transcript segments (no data loss)
- ZeroEntropy path format: `{videoId}-{identifier}` where identifier is chunk index
- Search API expects chunks to return content with startTime/endTime metadata
- Processing happens in background jobs (Inngest) - must be reliable and resumable

**Surrounding Systems:**
- Transcript extraction (`src/lib/inngest/utils/transcript-extractor.ts`) fetches raw YouTube transcripts
- Processing pipeline (`src/lib/inngest/functions/process-video.ts`) orchestrates the 8-step workflow
- ZeroEntropy client (`src/lib/zeroentropy/client.ts`) handles document indexing
- Search module (`src/lib/search-videos.ts`) retrieves relevant chunks for AI responses

---

## 🎯 Feature Vision & Flow

**Vision:** Transform the transcript processing pipeline to create semantically meaningful document chunks that enable both specific snippet retrieval and holistic video comprehension.

**End-to-End Flow:**

1. **Ingestion Phase**: When a video is processed, the system extracts YouTube transcript segments (typically 500-1000 small segments for a 20-minute video)

2. **Chunking Phase**: A new chunking module groups these segments into ~50-100 cohesive documents:
   - Each chunk contains 500-800 tokens worth of content (~200-400 words)
   - Chunks maintain 10% overlap for temporal continuity
   - Each chunk tracks its constituent segments for accurate timestamp calculation

3. **Indexing Phase**: Chunks are indexed in ZeroEntropy with enriched metadata:
   - Path format: `{videoId}-chunk{chunkIndex}`
   - Metadata includes: startTime, endTime, duration, segmentCount, chunkIndex
   - Full chunk text (much longer than current single segments)

4. **Search Phase**: When users query the knowledge base:
   - ZeroEntropy's `topSnippets` API returns relevant 200-character snippets
   - These snippets now come from semantically rich chunks instead of disconnected sentences
   - LLM receives better context and can provide more accurate, coherent responses

**Success Metrics:**
- Reduced document count: 500 segments → ~50-100 chunks (5-10x reduction)
- Improved chunk quality: Average 400+ words per chunk (vs current ~20 words)
- Better retrieval: Snippets contain complete thoughts/topics
- Maintained accuracy: All timestamps preserved for video navigation

---

## 📋 Implementation Plan: Tasks & Subtasks

> **Note:** Mark each task as complete by changing `[ ]` to `[x]`. After completing each top-level task, pause to confirm the implementation is correct before moving to the next task.

### Implementation Principles

Follow these principles throughout implementation:

- **DRY (Don't Repeat Yourself)**: Reuse existing functions and utilities rather than duplicating logic
  - Look for existing helpers in `src/lib/zeroentropy/` before creating new ones
  - Share common token estimation logic instead of reimplementing
  - Extract shared validation logic into reusable functions
  - Avoid copy-pasting similar code patterns

- **Type Safety**: Maintain strict TypeScript typing throughout
  - Use existing types from `src/lib/zeroentropy/types.ts` where possible
  - Create new types ONLY when necessary
  - Leverage type inference where appropriate

- **Backward Compatibility**: Ensure existing videos continue to work
  - Support both old and new path formats during transition
  - Add feature flags for gradual rollout
  - Maintain API contracts for search and processing

---

### Phase 1: Foundation & Types

#### Task 1: Create Chunk Types and Interfaces
- [x] Add `TranscriptChunk` interface to `src/lib/zeroentropy/types.ts`
  - Define fields: `text`, `start`, `end`, `totalDuration`, `segmentCount`, `chunkIndex`, `userId`, `videoId`, `videoTitle`
  - Add comprehensive JSDoc comments explaining each field
- [x] Create new type union for chunked vs non-chunked processing
  - Add `ChunkedTranscriptData` type that contains chunks instead of segments
  - Ensure backward compatibility with existing `TranscriptData` type

**Validation Criteria:**
- ✓ TypeScript compilation passes without errors
- ✓ All new types are exported from `src/lib/zeroentropy/types.ts`
- ✓ Type definitions are compatible with existing `ProcessedTranscriptSegment` usage

---

#### Task 2: Create Chunking Module
- [x] Create `src/lib/zeroentropy/chunking.ts` file
  - Implement `estimateTokens()` helper function for approximate token counting (DRY: reuse this everywhere instead of duplicating logic)
  - Implement core `chunkTranscriptSegments()` function with 500-800 token target
  - Implement `getOverlappingSegments()` helper for sliding window overlap
  - Implement `createChunk()` helper to build chunk objects from segments
  - Add comprehensive JSDoc documentation for all functions
  - DRY Principle: Extract shared utilities to avoid code duplication across the module
- [x] Implement chunking algorithm
  - Target 600 tokens per chunk with 60 token overlap (10%)
  - Maintain temporal order of segments within chunks
  - Handle edge cases: empty segments, very short segments, single-chunk videos
- [x] Add chunking statistics function
  - Implement `getChunkingStats()` to calculate: total chunks, avg tokens per chunk, avg segments per chunk, avg duration per chunk
  - Use for logging and monitoring chunk quality

**Validation Criteria:**
- ✓ Unit test for chunking logic with sample transcript data
- ✓ Verify chunk size constraints (500-800 tokens)
- ✓ Verify 10% overlap between chunks is maintained
- ✓ Verify all timestamps are preserved correctly
- ✓ Handle edge cases: empty input, single segment, very short segments

---

### Phase 2: Integrate Chunking into Processing Pipeline

#### Task 3: Update Transcript Processing
- [x] Modify `processTranscriptSegments()` in `src/lib/zeroentropy/transcript.ts`
  - Update return type from `ProcessedTranscriptSegment[]` to `TranscriptChunk[]`
  - Add chunking step after initial segment processing
  - Call `chunkTranscriptSegments()` from `chunking.ts` module (DRY: reuse chunking module instead of duplicating logic)
  - Add logging for chunk count vs segment count
  - Reuse existing segment validation logic rather than reimplementing
- [x] Update `processTranscriptSegmentsForZeroEntropy()` in `src/lib/inngest/utils/zeroentropy-processor.ts`
  - Update return type to match new chunk-based processing
  - Add chunk statistics logging using `getChunkingStats()`
  - Ensure backward compatibility with calling code

**Validation Criteria:**
- ✓ Existing tests pass with updated assertions for chunking
- ✓ New code properly converts segments to chunks
- ✓ Log outputs show chunk statistics (verify 5-10x reduction in document count)
- ✓ All metadata preserved: userId, videoId, videoTitle, timestamps

---

#### Task 4: Update Indexing Functions
- [x] Modify `indexTranscriptPage()` in `src/lib/zeroentropy/pages.ts`
  - Update parameter type from `ProcessedTranscriptSegment` to `TranscriptChunk`
  - Update `pageId` generation to use `{videoId}-chunk{chunkIndex}` format (DRY: reuse formatTimestamp utilities)
  - Update ZeroEntropy document metadata to include `chunkIndex` and `segmentCount`
  - Update `startTime`/`endTime` to use chunk-level timestamps (not segment-level)
  - Add logging for chunk content length verification
  - Reuse existing error handling patterns rather than duplicating
- [x] Update `batchIndexPages()` in same file
  - Update type annotations to work with `TranscriptChunk[]`
  - Add chunk index to error messages for debugging
  - Verify concurrency limits work with chunked data

**Validation Criteria:**
- ✓ ZeroEntropy documents indexed with correct path format (`{videoId}-chunk{index}`)
- ✓ Metadata includes all chunk-level information
- ✓ Timestamps span full chunk duration (start of first segment to end of last segment)
- ✓ Batch indexing completes successfully for all chunks

---

### Phase 3: Update Search Integration

#### Task 5: Update Search Result Parsing
- [x] Modify `searchVideos()` in `src/lib/search-videos.ts`
  - Update path parsing to handle chunk format: `{videoId}-chunk{chunkIndex}`
  - Use regex pattern `/^(.+)-chunk(\d+)$/` to extract videoId and chunkIndex
  - Add error handling for legacy path format (backward compatibility during migration)
  - Update comments to reflect chunk-based architecture
- [x] Verify search API compatibility
  - Ensure `topSnippets()` API still returns precise 200-char snippets
  - Verify metadata extraction works with new chunk structure
  - Confirm `include_document_metadata: true` returns chunk metadata correctly

**Validation Criteria:**
- ✓ Search successfully parses chunk-based paths
- ✓ Results include correct videoId, videoTitle, and timestamps
- ✓ Search returns snippets from within chunk text (not just first segment)
- ✓ Error handling gracefully handles mixed old/new path formats

---

#### Task 6: Update Search Tool Integration
- [x] Update `createSearchKnowledgeBase()` in `src/lib/tools/search-tool.ts`
  - Verify search results formatting still works with chunked data
  - Ensure timestamp formatting (`formatTime()`) handles chunk-level timestamps
  - Update console logging to show chunk information
- [x] Test end-to-end search flow
  - Verify tool returns results to LLM correctly
  - Check that snippet content comes from full chunks (not just segments)
  - Confirm citations show correct timestamps

**Validation Criteria:**
- ✓ Search tool successfully calls `searchVideos()` with chunk-based data
- ✓ Results formatted correctly for LLM consumption
- ✓ Timestamps accurate and properly formatted
- ✓ LLM receives coherent, context-rich snippets

---

### Phase 4: Testing & Validation

#### Task 7: Unit Tests
- [x] Create tests for chunking module
  - Test in `tests/unit/lib/zeroentropy/chunking.test.ts`
  - Test token estimation accuracy
  - Test chunk size constraints (500-800 token target)
  - Test overlap calculation (10% maintained)
  - Test edge cases: empty input, single segment, very long segments
- [x] Update existing transcript tests
  - Modify `tests/unit/lib/zeroentropy/transcript.test.ts`
  - Update to work with chunk-based processing
  - Add tests for chunk metadata preservation
- [x] Test search integration
  - Create integration test for search with chunked data
  - Verify path parsing works correctly
  - Test backward compatibility during transition

**Validation Criteria:**
- ✓ All unit tests pass (43/43 tests across 4 test suites)
- ✓ Test coverage maintained at >=80%
- ✓ Edge cases handled gracefully
- ✓ No test failures or errors

---

#### Task 8: Integration Testing
- [ ] Test complete video processing pipeline
  - Process a sample video through Inngest job
  - Verify chunks created and indexed in ZeroEntropy
  - Query the indexed chunks via search API
  - Confirm results contain expected content
- [ ] Test with various video types
  - Short video (< 5 minutes): Should create few chunks
  - Medium video (10-20 minutes): Should create moderate chunks
  - Long video (30+ minutes): Should create many chunks with proper sizing
- [ ] Verify timestamp accuracy
  - Test that clicking citations opens correct video timestamp
  - Verify chunk start/end times span entire segment range
  - Confirm no gaps or overlaps in video coverage

**Validation Criteria:**
- ✓ Complete pipeline runs without errors
- ✓ Chunk count appropriate for video length
- ✓ All timestamps accurate when clicking citations
- ✓ Search returns relevant, coherent snippets
- ✓ LLM can generate quality responses from retrieved chunks

---

#### Task 9: Performance & Quality Validation
- [ ] Measure chunk quality metrics
  - Average tokens per chunk (target: 600)
  - Average words per chunk (target: 400-500)
  - Overlap percentage (target: 10%)
  - Document count reduction (target: 5-10x)
- [ ] Verify retrieval quality
  - Test queries against chunked videos
  - Compare snippet quality vs old approach
  - Verify snippets contain complete thoughts/topics
- [ ] Monitor processing performance
  - Measure chunking time overhead
  - Verify indexing performance (should be faster with fewer documents)
  - Check memory usage for chunking algorithm

**Validation Criteria:**
- ✓ Chunk metrics meet targets (400-800 tokens per chunk)
- ✓ 5-10x reduction in document count achieved
- ✓ Search snippets are more coherent than before
- ✓ Processing time increase acceptable (<20% overhead)
- ✓ No memory leaks or performance degradation

---

### Phase 5: Migration & Deployment

#### Task 10: Backward Compatibility
- [ ] Add feature flag for chunking
  - Create environment variable `NEXT_PUBLIC_ENABLE_CHUNKING=true`
  - Update `processTranscriptSegments()` to conditionally use chunking
  - Keep legacy 1:1 segment mapping as fallback
- [ ] Handle mixed document states
  - Update search parsing to handle both old and new path formats
  - Add migration detection logic
  - Ensure existing videos can still be searched

**Validation Criteria:**
- ✓ Feature flag enables/disables chunking correctly
- ✓ Existing videos remain searchable
- ✓ New videos use chunking when flag enabled
- ✓ No errors when mixing old/new documents

---

#### Task 11: Monitoring & Observability
- [ ] Add chunking metrics to Langfuse traces
  - Update `process-video.ts` to log chunk statistics
  - Add chunking span to Inngest workflow
  - Include chunk count, avg size, processing time in trace metadata
- [ ] Add console logging for chunking operations
  - Log chunk creation with size and segment count
  - Log overlap percentage verification
  - Log any edge cases or warnings during chunking

**Validation Criteria:**
- ✓ Langfuse traces show chunking metrics
- ✓ Console logs provide useful debugging information
- ✓ Metrics help identify quality issues
- ✓ Error tracking captures chunking failures

---

#### Task 12: Documentation & Cleanup
- [ ] Update code documentation
  - Add JSDoc comments to all chunking functions
  - Update architecture diagrams if needed
  - Document chunk size targets and rationale
- [ ] Update README or architecture docs
  - Explain chunking strategy
  - Document chunk size configuration
  - Update troubleshooting guide if needed
- [ ] Code cleanup
  - Remove dead code from previous implementation
  - Ensure consistent code style
  - Run linter and fix any issues
  - DRY Principle: Audit for duplicate code and refactor to shared utilities if found

**Validation Criteria:**
- ✓ All new code properly documented
- ✓ Architecture documentation updated
- ✓ No linter errors or warnings
- ✓ No code duplication - shared utilities used appropriately
- ✓ Code review ready

---

## Success Criteria Summary

### Functional Requirements
- [ ] Transcripts are chunked into 500-800 token documents
- [ ] Chunks maintain 10% overlap for continuity
- [ ] All timestamps preserved accurately
- [ ] Search returns coherent, context-rich snippets
- [ ] Citations work correctly with chunk timestamps

### Performance Requirements
- [ ] 5-10x reduction in document count
- [ ] Chunking adds <20% processing overhead
- [ ] Search performance maintained or improved
- [ ] No memory leaks or performance degradation

### Quality Requirements
- [ ] All tests pass
- [ ] Test coverage >=80% maintained
- [ ] No production errors or regressions
- [ ] Backward compatibility ensured

---

## Next Steps After Implementation

1. **Monitor Production Metrics**: Track chunk quality, search performance, and user satisfaction
2. **Tune Parameters**: Adjust chunk size (600 tokens) and overlap (10%) based on real-world performance
3. **Gradual Rollout**: Enable chunking for new videos while keeping old videos functional
4. **User Feedback**: Collect feedback on search quality and citation accuracy
5. **Future Enhancements**: Consider LLM-assisted semantic boundaries for even better chunking
