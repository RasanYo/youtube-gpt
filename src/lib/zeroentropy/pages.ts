import { getZeroEntropyClient } from './client'
import type { ProcessedTranscriptSegment } from './types'
import { createPageContent } from './segment-metadata'

/**
 * Index a single transcript segment as a page in ZeroEntropy
 * 
 * @param segment - Processed transcript segment
 * @param collectionName - Collection name
 * @returns Page ID
 */
export async function indexTranscriptPage(
  segment: ProcessedTranscriptSegment,
  collectionName: string
): Promise<string> {
  const client = getZeroEntropyClient()
  
  try {
    // Create page content with searchable text
    const pageContent = createPageContent(segment)
    
    // Generate page ID
    const pageId = `${segment.videoId}-${segment.segmentIndex}`
    
    console.log(`[indexTranscriptPage] Indexing page: ${pageId}`)
    
    // Add document to ZeroEntropy
    await client.documents.add({
      collection_name: collectionName,
      path: pageId,
      content: {
        type: 'text',
        text: pageContent.searchableText
      },
      metadata: {
        videoId: segment.videoId,
        userId: segment.userId,
        startTime: segment.start.toString(),
        endTime: segment.end.toString(),
        duration: segment.duration.toString(),
        language: segment.language,
        segmentIndex: segment.segmentIndex.toString()
      }
    })
    
    console.log(`[indexTranscriptPage] Successfully indexed page: ${pageId}`)
    return pageId
    
  } catch (error: any) {
    console.error(`[indexTranscriptPage] Failed to index page: ${segment.videoId}-${segment.segmentIndex}`, error)
    throw new Error(`Failed to index page: ${error.message}`)
  }
}

/**
 * Batch index multiple transcript segments as pages
 * 
 * @param segments - Array of processed transcript segments
 * @param collectionName - Collection name
 * @returns Array of page IDs
 */
export async function batchIndexPages(
  segments: ProcessedTranscriptSegment[],
  collectionName: string
): Promise<string[]> {
  console.log(`[batchIndexPages] Batch indexing ${segments.length} pages`)
  
  const pageIds: string[] = []
  const errors: string[] = []
  
  // Process segments in parallel with concurrency limit
  const concurrency = 5
  for (let i = 0; i < segments.length; i += concurrency) {
    const batch = segments.slice(i, i + concurrency)
    
    const batchPromises = batch.map(async (segment) => {
      try {
        const pageId = await indexTranscriptPage(segment, collectionName)
        return { success: true, pageId, segment }
      } catch (error: any) {
        const errorMsg = `Failed to index segment ${segment.segmentIndex}: ${error.message}`
        errors.push(errorMsg)
        return { success: false, error: errorMsg, segment }
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
 * Delete all pages for a video
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
    
    // Filter documents that belong to this video
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
