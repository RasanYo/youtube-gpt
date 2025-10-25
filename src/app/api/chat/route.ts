import { NextRequest } from 'next/server'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { searchVideos } from '@/lib/search-videos'
import { z } from 'zod'

// Define the search tool schema for Claude
const searchTool = {
  description: 'Search for relevant content in the user\'s YouTube video knowledge base',
  parameters: z.object({
    query: z.string().describe('The search query to find relevant video content'),
    videoIds: z.array(z.string()).optional().describe('Optional array of specific video IDs to search within. If not provided, searches all user videos.')
  })
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, scope } = await request.json()
    
    if (!userId) {
      return new Response('User ID is required', { status: 401 })
    }
    
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 })
    }
    
    console.log(`[chat] Processing chat request for user: ${userId}`)
    console.log(`[chat] Scope:`, scope)
    console.log(`[chat] Messages count:`, messages.length)
    
    // Get the latest user message
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 })
    }
    
    // Create the search function that Claude can call
    const searchKnowledgeBase = async (params: { query: string; videoIds?: string[] }) => {
      console.log(`[searchKnowledgeBase] Searching with query: "${params.query}"`)
      console.log(`[searchKnowledgeBase] Video IDs:`, params.videoIds)
      
      try {
        const results = await searchVideos({
          query: params.query,
          userId,
          videoIds: params.videoIds,
          limit: 5 // Limit to top 5 most relevant results
        })
        
        console.log(`[searchKnowledgeBase] Found ${results.length} results`)
        
        // Format results for Claude
        const formattedResults = results.map(result => ({
          content: result.content,
          videoId: result.videoId,
          timestamp: `${Math.floor(result.startTime / 60)}:${Math.floor(result.startTime % 60).toString().padStart(2, '0')}`,
          startTime: result.startTime,
          endTime: result.endTime,
          score: result.score
        }))
        console.log('formattedResults', formattedResults)
        
        return {
          results: formattedResults,
          totalFound: results.length
        }
      } catch (error: unknown) {
        console.error('[searchKnowledgeBase] Search failed:', error)
        return {
          error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          results: [],
          totalFound: 0
        }
      }
    }
    
    // Determine video scope based on the request
    let videoScope: string[] | undefined
    if (scope && scope.type === 'selected' && scope.videoIds && scope.videoIds.length > 0) {
      videoScope = scope.videoIds
      console.log(`[chat] Using selected videos scope:`, videoScope)
    } else {
      console.log(`[chat] Using all videos scope`)
    }
    
    // Create the system prompt
    const systemPrompt = `You are Bravi AI, an intelligent assistant that helps users find information in their YouTube video knowledge base. 

When users ask questions, you should:
1. Search their video knowledge base for relevant content using the search tool
2. Provide comprehensive answers based on the search results
3. Always include specific video citations with timestamps
4. If no relevant content is found, let the user know and suggest they add more videos

Important guidelines:
- Always use the search tool to find relevant content before answering
- Include video citations in the format: [Video Title at 1:23](videoId:startTime)
- Be specific about timestamps and video references
- If searching specific videos, use the provided videoIds parameter
- If no videoIds are provided, search all user videos
- Keep responses helpful and conversational
- If you find multiple relevant sources, synthesize them into a comprehensive answer

Current user context:
- User ID: ${userId}
- Video scope: ${videoScope ? `Selected videos: ${videoScope.join(', ')}` : 'All videos'}`

    // Stream the response using AI SDK
    const result = await streamText({
      model: anthropic('claude-3-7-sonnet-latest'),
      system: systemPrompt,
      messages,
      tools: {
        searchKnowledgeBase: {
          description: searchTool.description,
          inputSchema: searchTool.parameters,
          execute: async ({ query, videoIds }) => {
            console.log(`[chat] Tool called with query: "${query}", videoIds:`, videoIds)
            
            try {
              const results = await searchVideos({
                query,
                userId,
                videoIds,
              })

              // Format results for the AI to use
              const formattedResults = results.map(r => {
                const formatTime = (seconds: number) => {
                  const mins = Math.floor(seconds / 60)
                  const secs = Math.floor(seconds % 60)
                  return `${mins}:${secs.toString().padStart(2, '0')}`
                }
                
                return {
                  videoId: r.videoId,
                  startTime: r.startTime,
                  endTime: r.endTime,
                  content: r.content,
                  score: r.score,
                  timestamp: formatTime(r.startTime)
                }
              })

              console.log(`[chat] Returning ${formattedResults.length} results to AI`)
              console.log(`[chat] Search results for "${query}":`, formattedResults.map(r => ({
                videoId: r.videoId,
                timestamp: r.timestamp,
                content: r.content.substring(0, 100) + '...',
                score: r.score
              })))
              
              return {
                results: formattedResults,
                totalFound: results.length,
                query: query
              }
            } catch (error) {
              console.error('[chat] Search tool error:', error)
              return {
                error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                results: [],
                totalFound: 0
              }
            }
          }
        }
      },
      temperature: 0.7,
    })
    
    return result.toTextStreamResponse()
    
  } catch (error: unknown) {
    console.error('[chat] API error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
