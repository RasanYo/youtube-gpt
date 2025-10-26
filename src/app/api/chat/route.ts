import { NextRequest } from 'next/server'
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { ChatRequest, ChatScope } from '@/lib/zeroentropy/types'
import { searchTool, createSearchKnowledgeBase } from '@/lib/tools/search-tool'

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, scope, conversationId }: ChatRequest = await request.json()
    console.log('messages', messages)
    console.log('userId', userId)
    console.log('scope', scope)
    console.log('conversationId', conversationId)
    
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 })
    }
    
    // Get the latest user message
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 })
    }
    
    // Extract and log the user's request
    const userRequest = lastMessage.parts?.find(part => part.type === 'text')?.text || ''
    console.log(`\n🤖 AI Request: "${userRequest}"`)
    
    
    // Determine video scope based on the request
    let videoScope: string[] | undefined
    if (scope && scope.type === 'selected' && scope.videoIds && scope.videoIds.length > 0) {
      videoScope = scope.videoIds
      console.log(`📹 Scope: Selected videos (${videoScope.length})`)
    } else {
      console.log(`📹 Scope: All videos`)
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

    // Create the search function with enhanced logging
    const searchKnowledgeBase = createSearchKnowledgeBase(userId, videoScope)

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
      stopWhen: stepCountIs(5), // Allow up to 5 steps for multi-step tool calling
      onFinish: async (result) => {
        // Extract and log the AI's response from the final step
        const finalStep = result.steps[result.steps.length - 1]
        if (finalStep?.text) {
          console.log(`💬 AI Response: "${finalStep.text}"`)
        }
        
        // Extract citations from tool calls
        const citations: Array<{ videoId: string; videoTitle: string; timestamp: string }> = []
        
        // Loop through all steps to find search tool calls
        for (const step of result.steps) {
          if (step.toolCalls) {
            for (const toolCall of step.toolCalls) {
              if (toolCall.toolName === 'searchKnowledgeBase') {
                const toolResult = step.toolResults?.find(r => r.toolCallId === toolCall.toolCallId)
                // Access the tool result data correctly
                // @ts-ignore - AI SDK has complex nested types for tool results
                const resultData = toolResult?.result
                if (resultData?.results) {
                  const searchResults = resultData.results as Array<{
                    videoId: string
                    videoTitle: string
                    timestamp: string
                  }>
                  // Extract unique citations
                  for (const searchResult of searchResults) {
                    if (searchResult.videoId && searchResult.videoTitle && searchResult.timestamp) {
                      citations.push({
                        videoId: searchResult.videoId,
                        videoTitle: searchResult.videoTitle,
                        timestamp: searchResult.timestamp
                      })
                    }
                  }
                }
              }
            }
          }
        }
        
        console.log(`📋 Citations found: ${citations.length}`)
        if (citations.length > 0) {
          citations.forEach((citation, index) => {
            console.log(`   ${index + 1}. ${citation.videoTitle} - ${citation.timestamp}`)
          })
        }
        
        console.log('─'.repeat(50))
      }
    })

    return result.toUIMessageStreamResponse()
    
  } catch (error: unknown) {
    console.log(`❌ Chat Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
