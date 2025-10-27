import { getZeroEntropyClient } from './client'
import type { ProcessedTranscriptSegment } from './types'
import { createPageContent } from './segment-metadata'

/**
 * Index a single transcript chunk as a page in ZeroEntropy
 *
 * @param chunk - Processed transcript chunk (or segment for backward compatibility)
 * @param collectionName - Collection name
 * @returns Page ID
 */
export async function indexTranscriptPage(
  chunk: ProcessedTranscriptSegment,
  collectionName: string
): Promise<string> {
  const client = getZeroEntropyClient()

  try {
    // Create page content with searchable text
    const pageContent = createPageContent(chunk)

    // Generate page ID - use chunkIndex if available (chunked), otherwise segmentIndex (backward compatible)
    const isChunk = chunk.chunkIndex !== undefined
    const pageId = isChunk
      ? `${chunk.videoId}-chunk${chunk.chunkIndex}`
      : `${chunk.videoId}-${chunk.segmentIndex}`

    console.log(`[indexTranscriptPage] Indexing ${isChunk ? 'chunk' : 'segment'}: ${pageId}${isChunk ? ` (${chunk.segmentCount} segments, ${chunk.text.length} chars)` : ''}`)

    // Prepare metadata - include chunk-specific fields if available
    const metadata: Record<string, string> = {
      videoId: chunk.videoId,
      userId: chunk.userId,
      videoTitle: chunk.videoTitle,
      startTime: chunk.start.toString(),
      endTime: chunk.end.toString(),
      duration: chunk.duration.toString(),
      language: chunk.language || 'en'
    }

    // Add chunk-specific metadata
    if (isChunk) {
      metadata.chunkIndex = chunk.chunkIndex!.toString()
      metadata.segmentCount = chunk.segmentCount!.toString()
      metadata.isChunk = 'true'
    } else {
      metadata.segmentIndex = chunk.segmentIndex?.toString() || '0'
      metadata.isChunk = 'false'
    }

    // Add document to ZeroEntropy
    await client.documents.add({
      collection_name: collectionName,
      path: pageId,
      content: {
        type: 'text',
        text: pageContent.searchableText
      },
      metadata
    })

    console.log(`[indexTranscriptPage] Successfully indexed page: ${pageId}`)
    return pageId

  } catch (error: any) {
    const identifier = chunk.chunkIndex !== undefined ? `chunk${chunk.chunkIndex}` : `segment${chunk.segmentIndex}`
    console.error(`[indexTranscriptPage] Failed to index page: ${chunk.videoId}-${identifier}`, error)
    throw new Error(`Failed to index page: ${error.message}`)
  }
}

/**
 * Batch index multiple transcript chunks as pages
 *
 * @param chunks - Array of processed transcript chunks (or segments for backward compatibility)
 * @param collectionName - Collection name
 * @returns Array of page IDs
 */
export async function batchIndexPages(
  chunks: ProcessedTranscriptSegment[],
  collectionName: string
): Promise<string[]> {
  const isChunked = chunks.length > 0 && chunks[0].chunkIndex !== undefined
  console.log(`[batchIndexPages] Batch indexing ${chunks.length} ${isChunked ? 'chunks' : 'segments'}`)

  const pageIds: string[] = []
  const errors: string[] = []

  // Process chunks in parallel with concurrency limit
  const concurrency = 5
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency)

    const batchPromises = batch.map(async (chunk) => {
      try {
        const pageId = await indexTranscriptPage(chunk, collectionName)
        return { success: true, pageId, chunk }
      } catch (error: any) {
        const identifier = chunk.chunkIndex !== undefined
          ? `chunk ${chunk.chunkIndex}`
          : `segment ${chunk.segmentIndex}`
        const errorMsg = `Failed to index ${identifier}: ${error.message}`
        errors.push(errorMsg)
        return { success: false, error: errorMsg, chunk }
      }
    })

    const results = await Promise.all(batchPromises)

    // Collect successful page IDs
    results.forEach(result => {
      if (result.success) {
        pageIds.push(result.pageId)
      }
    })
  }

  console.log(`[batchIndexPages] Batch indexing completed: ${pageIds.length} successful, ${errors.length} failed`)

  if (errors.length > 0) {
    console.error(`[batchIndexPages] Errors during batch indexing:`, errors)
  }

  return pageIds
}

/**
 * Delete a page from ZeroEntropy
 * 
 * @param pageId - Page ID to delete
 * @param collectionName - Collection name
 * @returns True if deleted successfully
 */
export async function deletePage(
  pageId: string,
  collectionName: string
): Promise<boolean> {
  const client = getZeroEntropyClient()
  
  try {
    console.log(`[deletePage] Deleting page: ${pageId}`)
    
    await client.documents.delete({
      collection_name: collectionName,
      path: pageId
    })
    
    console.log(`[deletePage] Successfully deleted page: ${pageId}`)
    return true
    
  } catch (error: any) {
    if (error.status === 404) {
      console.log(`[deletePage] Page not found: ${pageId}`)
      return true // Consider it deleted if it doesn't exist
    }
    
    console.error(`[deletePage] Failed to delete page: ${pageId}`, error)
    throw new Error(`Failed to delete page: ${error.message}`)
  }
}

/**
 * Delete all pages for a video (supports both chunk and segment formats)
 *
 * @param videoId - Video ID
 * @param collectionName - Collection name
 * @returns Number of pages deleted
 */
export async function deleteVideoPages(
  videoId: string,
  collectionName: string
): Promise<number> {
  const client = getZeroEntropyClient()

  try {
    console.log(`[deleteVideoPages] Deleting all pages for video: ${videoId}`)

    // Get all documents in the collection
    const documents = await client.documents.getInfoList({
      collection_name: collectionName
    })

    // Filter documents that belong to this video (matches both chunk and segment formats)
    // Format: {videoId}-chunk{N} or {videoId}-{N}
    const videoPages = documents.documents.filter(doc =>
      doc.path.startsWith(`${videoId}-`)
    )

    console.log(`[deleteVideoPages] Found ${videoPages.length} pages for video: ${videoId}`)

    // Delete all pages for this video
    const deletePromises = videoPages.map(page =>
      deletePage(page.path, collectionName)
    )

    const results = await Promise.all(deletePromises)
    const deletedCount = results.filter(Boolean).length

    console.log(`[deleteVideoPages] Successfully deleted ${deletedCount} pages for video: ${videoId}`)
    return deletedCount

  } catch (error: any) {
    console.error(`[deleteVideoPages] Failed to delete pages for video: ${videoId}`, error)
    throw new Error(`Failed to delete video pages: ${error.message}`)
  }
}

/**
 * Get page information
 * 
 * @param pageId - Page ID
 * @param collectionName - Collection name
 * @returns Page information
 */
export async function getPageInfo(
  pageId: string,
  collectionName: string
): Promise<any> {
  const client = getZeroEntropyClient()
  
  try {
    console.log(`[getPageInfo] Getting page info: ${pageId}`)
    
    const response = await client.documents.getInfo({
      collection_name: collectionName,
      path: pageId
    })
    
    console.log(`[getPageInfo] Successfully retrieved page info: ${pageId}`)
    return response.document
    
  } catch (error: any) {
    console.error(`[getPageInfo] Failed to get page info: ${pageId}`, error)
    throw new Error(`Failed to get page info: ${error.message}`)
  }
}
