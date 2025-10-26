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
    const searchParams = { query, videoIds, userId, videoScope }
    console.log('[searchKnowledgeBase] Search params:', JSON.stringify(searchParams, null, 2))
    
    const searchVideoIds = videoIds || videoScope
    
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
      
      console.log('[searchKnowledgeBase] Formatted tool result:', JSON.stringify(toolResult, null, 2))
      
      return toolResult
    } catch (error: unknown) {
      const errorResult = {
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        results: [],
        totalFound: 0
      }
      
      console.error('[searchKnowledgeBase] Search error:', JSON.stringify(errorResult, null, 2))
      console.error('[searchKnowledgeBase] Original error:', error)
      
      return errorResult
    }
  }
}
