import { NextRequest } from 'next/server'
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { ChatRequest, ChatScope } from '@/lib/zeroentropy/types'
import { searchTool, createSearchKnowledgeBase } from '@/lib/tools/search-tool'

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, scope }: ChatRequest = await request.json()
    
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
    
    // Extract text content from the last user message for logging
    const lastMessageText = lastMessage.parts?.find(part => part.type === 'text')?.text || ''
    console.log('[chat] Last user message:', lastMessageText)
    
    
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

You have access to a search tool that can find relevant content in the user's YouTube videos. Use your judgment to decide when to search:

- For questions about specific video content, topics, or information → Use the search tool
- For general conversation, greetings, or non-video questions → Respond directly

When you do search and find relevant content:
1. Provide comprehensive answers based on the search results
2. Always include specific video citations with timestamps
3. If no relevant content is found, let the user know and suggest they add more videos

Important guidelines:
- Include video citations in the format: [Video Title at 1:23](videoId:startTime)
- Be specific about timestamps and video references
- If searching specific videos, use the provided videoIds parameter
- If no videoIds are provided, search all user videos
- Keep responses helpful and conversational

Current user context:
- User ID: ${userId}
- Video scope: ${videoScope ? `Selected videos (${videoScope.length}): ${videoScope.join(', ')}` : 'All videos'}`

    // Create the search function
    const searchKnowledgeBase = createSearchKnowledgeBase(userId, videoScope)

    // Messages are already in UIMessage format - no conversion needed!
    console.log('[chat] Using messages directly (already UIMessage format)')

    // Stream the AI response with multi-step tool calling enabled
    const result = await streamText({
      model: anthropic('claude-3-7-sonnet-latest'),
      system: systemPrompt,
      messages: convertToModelMessages(messages), // ← Use messages directly
      tools: {
        searchKnowledgeBase: {
          description: searchTool.description,
          inputSchema: searchTool.parameters,
          execute: searchKnowledgeBase
        }
      },
      temperature: 0.7,
      stopWhen: stepCountIs(5) // Allow up to 5 steps for multi-step tool calling
    })

    return result.toUIMessageStreamResponse()
    
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
