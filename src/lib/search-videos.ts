import { getZeroEntropyClient } from './zeroentropy/client'
import { getOrCreateUserCollection } from './zeroentropy/collections'

/**
 * Search result from ZeroEntropy
 */
export interface SearchResult {
  content: string
  videoId: string
  videoTitle?: string
  startTime: number
  endTime: number
  score: number
  path: string
}

/**
 * Search parameters for video content
 */
export interface SearchVideosParams {
  query: string
  userId: string
  videoIds?: string[] // If provided, only search in these specific videos
  limit?: number
}

/**
 * Search for relevant video content using ZeroEntropy
 * 
 * @param params - Search parameters
 * @returns Array of search results with video metadata
 */
export async function searchVideos(params: SearchVideosParams): Promise<SearchResult[]> {
  const { query, userId, videoIds, limit = 10 } = params
  
  try {
    // Get or create user collection
    const collectionName = await getOrCreateUserCollection(userId)
    
    // Get ZeroEntropy client
    const client = getZeroEntropyClient()
    
    // Build filter for specific videos if provided
    let filter: Record<string, unknown> | undefined
    if (videoIds && videoIds.length > 0) {
      filter = {
        videoId: {
          $in: videoIds
        }
      }
    }
    
    console.log(`[searchVideos] Searching for: "${query}" in collection: ${collectionName}`)
    console.log(`[searchVideos] Filter:`, filter)
    
    // Search for top snippets
    const response = await client.queries.topSnippets({
      collection_name: collectionName,
      query,
      k: limit,
      filter: filter || undefined,
      include_document_metadata: true,
      precise_responses: true // Get more precise snippets (~200 chars)
    })
    
    console.log(`[searchVideos] Found ${response.results.length} snippets`)
    
    // Transform results to our format
    const results: SearchResult[] = response.results.map(snippet => {
      // Extract video metadata from the document path
      // Path format: "videoId-segmentIndex"
      const pathParts = snippet.path.split('-')
      const videoId = pathParts[0]
      const segmentIndex = parseInt(pathParts[1] || '0')
      
      // Get document metadata for this snippet
      const documentResult = response.document_results.find(doc => doc.path === snippet.path)
      
      // Extract timing information from metadata
      const startTime = documentResult?.metadata?.startTime 
        ? parseFloat(documentResult.metadata.startTime as string) 
        : 0
      const endTime = documentResult?.metadata?.endTime 
        ? parseFloat(documentResult.metadata.endTime as string) 
        : startTime + 30 // Default 30 second duration
      
      // Extract video title from metadata
      const videoTitle = documentResult?.metadata?.videoTitle as string | undefined
      
      return {
        content: snippet.content,
        videoId,
        videoTitle,
        startTime,
        endTime,
        score: snippet.score,
        path: snippet.path
      }
    })
    
    console.log(`[searchVideos] Processed ${results.length} results`)
    return results
    
  } catch (error: unknown) {
    console.error('[searchVideos] Search failed:', error)
    throw new Error(`Video search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search for videos by a specific user
 * 
 * @param query - Search query
 * @param userId - User ID
 * @param limit - Maximum number of results
 * @returns Array of search results
 */
export async function searchUserVideos(
  query: string, 
  userId: string, 
  limit: number = 10
): Promise<SearchResult[]> {
  return searchVideos({ query, userId, limit })
}

/**
 * Search for videos within specific video IDs
 * 
 * @param query - Search query
 * @param userId - User ID
 * @param videoIds - Array of video IDs to search within
 * @param limit - Maximum number of results
 * @returns Array of search results
 */
export async function searchSpecificVideos(
  query: string,
  userId: string,
  videoIds: string[],
  limit: number = 10
): Promise<SearchResult[]> {
  return searchVideos({ query, userId, videoIds, limit })
}
