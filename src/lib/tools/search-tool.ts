import { z } from 'zod'
import { searchVideos } from '@/lib/search-videos'

// Define the shared search tool schema for Claude
const sharedSearchSchema = z.object({
  query: z.string().describe('The search query to find relevant video content'),
  videoIds: z.array(z.string()).optional().describe('Optional array of specific video IDs to search within. If not provided, searches all user videos.'),
  limit: z.number().int().min(5).max(50).default(20).describe('Number of results to return. Use 5-10 for specific facts and precise information. Use 15-25 for broad questions requiring comprehensive overview (e.g., "what do they talk about?", "main topics", "key concepts across videos"). Use higher limits (30-50) when searching multiple long videos or when needing extensive context for analysis.')
})

// Define the detailed search tool schema (Level 1 chunks)
export const searchDetailedTool = {
  description: 'Search precise 30-90 second video chunks for specific facts, timestamps, and detailed information. Use this for exact quotes, specific mentions, timestamps, or detailed explanations.',
  parameters: sharedSearchSchema
}

// Define the thematic search tool schema (Level 2 chunks)
export const searchThematicTool = {
  description: 'Search broader 5-20 minute video sections for overviews, themes, general topics, and high-level concepts. Use this for questions like "what is this video about?", "main topics discussed", or "key themes".',
  parameters: sharedSearchSchema
}

// Helper function to format results for the AI
const formatSearchResults = (results: Awaited<ReturnType<typeof searchVideos>>) => {
  return results.map(result => {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    return {
      content: result.content,
      videoId: result.videoId,
      videoTitle: result.videoTitle,
      timestamp: formatTime(result.startTime),
      startTime: result.startTime,
      endTime: result.endTime,
      score: result.score
    }
  })
}

// Create the search function for the AI SDK (Level 1 - Detailed chunks)
export const createSearchDetailedChunks = (
  userId: string,
  videoScope: string[] | undefined
) => {
  return async ({ query, videoIds, limit = 5 }: { query: string; videoIds?: string[]; limit?: number }) => {
    const searchVideoIds = videoIds || videoScope
    console.log(`🔍 Tool Called: searchDetailedChunks (Level 1 - 30-90s chunks)`)
    console.log(`   Query: "${query}"`)
    console.log(`   Limit: ${limit}`)
    console.log(`   Video IDs: ${searchVideoIds ? searchVideoIds.join(', ') : 'All videos'}`)
    
    try {
      const results = await searchVideos({
        query,
        userId,
        videoIds: searchVideoIds,
        limit,
        chunkLevel: "1"
      })
            
      const formattedResults = formatSearchResults(results)
      
      const toolResult = {
        results: formattedResults,
        totalFound: results.length
      }

      console.log(`✅ Tool Result: Found ${results.length} detailed chunks`)
      formattedResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.videoId} at ${result.timestamp} (score: ${result.score.toFixed(2)})`)
        console.log(`      Content preview: ${result.content.substring(0, 80)}...`)
      })

      return toolResult
    } catch (error: unknown) {
      const errorResult = {
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: [],
        totalFound: 0
      }
      
      console.log(`❌ Tool Error: ${errorResult.error}`)
      
      return errorResult
    }
  }
}

// Create the search function for the AI SDK (Level 2 - Thematic chunks)
export const createSearchThematicChunks = (
  userId: string,
  videoScope: string[] | undefined
) => {
  return async ({ query, videoIds, limit = 5 }: { query: string; videoIds?: string[]; limit?: number }) => {
    const searchVideoIds = videoIds || videoScope
    console.log(`🔍 Tool Called: searchThematicChunks (Level 2 - 5-20min chunks)`)
    console.log(`   Query: "${query}"`)
    console.log(`   Limit: ${limit}`)
    console.log(`   Video IDs: ${searchVideoIds ? searchVideoIds.join(', ') : 'All videos'}`)
    
    try {
      const results = await searchVideos({
        query,
        userId,
        videoIds: searchVideoIds,
        limit,
        chunkLevel: "2"
      })
            
      const formattedResults = formatSearchResults(results)
      
      const toolResult = {
        results: formattedResults,
        totalFound: results.length
      }

      console.log(`✅ Tool Result: Found ${results.length} thematic chunks`)
      formattedResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.videoId} at ${result.timestamp} (score: ${result.score.toFixed(2)})`)
        console.log(`      Content preview: ${result.content.substring(0, 80)}...`)
      })

      return toolResult
    } catch (error: unknown) {
      const errorResult = {
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: [],
        totalFound: 0
      }
      
      console.log(`❌ Tool Error: ${errorResult.error}`)
      
      return errorResult
    }
  }
}