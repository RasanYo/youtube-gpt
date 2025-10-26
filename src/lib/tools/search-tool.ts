import { z } from 'zod'
import { searchVideos } from '@/lib/search-videos'

// Define the search tool schema for Claude
export const searchTool = {
  description: 'Search for relevant content in the user\'s YouTube video knowledge base',
  parameters: z.object({
    query: z.string().describe('The search query to find relevant video content'),
    videoIds: z.array(z.string()).optional().describe('Optional array of specific video IDs to search within. If not provided, searches all user videos.')
  })
}

// Create the search function for the AI SDK
export const createSearchKnowledgeBase = (
  userId: string,
  videoScope: string[] | undefined
) => {
  return async ({ query, videoIds }: { query: string; videoIds?: string[] }) => {
    const searchVideoIds = videoIds || videoScope
    console.log(`🔍 Tool Called: searchKnowledgeBase`)
    console.log(`   Query: "${query}"`)
    console.log(`   Video IDs: ${searchVideoIds ? searchVideoIds.join(', ') : 'All videos'}`)
    
    try {
      const results = await searchVideos({
        query,
        userId,
        videoIds: searchVideoIds,
        limit: 5
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
        console.log(`   ${index + 1}. ${result.videoId} at ${result.timestamp} (score: ${result.score.toFixed(2)})`)
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
