import { z } from 'zod'
import { searchVideos } from '@/lib/search-videos'

// Define the search tool schema for Claude
export const searchTool = {
  description: 'Search for relevant content in the user\'s YouTube video knowledge base',
  parameters: z.object({
    query: z.string().describe('The search query to find relevant video content'),
    videoIds: z.array(z.string()).optional().describe('Optional array of specific video IDs to search within. If not provided, searches all user videos.'),
    limit: z.number().int().min(5).max(50).default(20).describe('Number of results to return. Use 5-10 for specific facts and precise information. Use 15-25 for broad questions requiring comprehensive overview (e.g., "what do they talk about?", "main topics", "key concepts across videos"). Use higher limits (30-50) when searching multiple long videos or when needing extensive context for analysis.')
  })
}

// Create the search function for the AI SDK
export const createSearchKnowledgeBase = (
  userId: string,
  videoScope: string[] | undefined
) => {
  return async ({ query, videoIds, limit = 5 }: { query: string; videoIds?: string[]; limit?: number }) => {
    const searchVideoIds = videoIds || videoScope
    console.log(`🔍 Tool Called: searchKnowledgeBase`)
    console.log(`   Query: "${query}"`)
    console.log(`   Limit: ${limit}`)
    console.log(`   Video IDs: ${searchVideoIds ? searchVideoIds.join(', ') : 'All videos'}`)
    
    try {
      const results = await searchVideos({
        query,
        userId,
        videoIds: searchVideoIds,
        limit
      })
            
      // Format results for the AI
      const formattedResults = results.map(result => {
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
      
      const toolResult = {
        results: formattedResults,
        totalFound: results.length
      }

      console.log(`✅ Tool Result: Found ${results.length} results`)
      formattedResults.forEach((result, index) => {
        const isChunk = results[index].path.includes('-chunk')
        const pathType = isChunk ? 'chunk' : 'segment'
        console.log(`   ${index + 1}. ${result.videoId} at ${result.timestamp} (${pathType}, score: ${result.score.toFixed(2)})`)
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
