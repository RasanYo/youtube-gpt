import { NextRequest } from 'next/server'
import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import type { ChatRequest, ChatScope } from '@/lib/zeroentropy/types'
import { searchDetailedTool, searchThematicTool, createSearchDetailedChunks, createSearchThematicChunks } from '@/lib/tools/search-tool'
import { langfuse, isLangfuseConfigured } from '@/lib/langfuse/client'
import { getEnhancedPrompt } from '@/lib/chat-commands/utils'
import { CommandId } from '@/lib/chat-commands/types'

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, scope, conversationId, commandId }: ChatRequest = await request.json()
    console.log('messages', messages)
    console.log('userId', userId)
    console.log('scope', scope)
    console.log('conversationId', conversationId)
    console.log('commandId', commandId)
    
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array is required', { status: 400 })
    }
    
    // Validate commandId if present
    if (commandId && !Object.values(CommandId).includes(commandId as CommandId)) {
      console.error(`❌ Invalid commandId: ${commandId}`)
      return new Response(
        JSON.stringify({ 
          error: 'Invalid command ID',
          message: `Unknown command: ${commandId}`
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Get the latest user message
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 })
    }
    
    // Extract and log the user's request
    let userRequest = lastMessage.parts?.find(part => part.type === 'text')?.text || ''
    
    // Enhance prompt server-side if commandId is present
    if (commandId && lastMessage.parts) {
      const originalInput = userRequest
      const enhancedPrompt = getEnhancedPrompt(originalInput, commandId)
      
      // Find the text part and update it
      const textPart = lastMessage.parts.find(part => part.type === 'text')
      if (textPart && 'text' in textPart) {
        textPart.text = enhancedPrompt
        userRequest = enhancedPrompt
      }
      
      console.log(`\n🎯 Command enhanced: ${commandId}`)
      console.log(`Original input: "${originalInput}"`)
      console.log(`Enhanced prompt: "${enhancedPrompt.substring(0, 100)}..."`)
    }
    
    console.log(`\n🤖 AI Request: "${userRequest}"`)
    
    
    // Determine video scope based on the request
    let videoScope: string[] | undefined
    if (scope && scope.type === 'selected' && scope.videoIds && scope.videoIds.length > 0) {
      videoScope = scope.videoIds
      console.log(`📹 Scope: Selected videos (${videoScope.length})`)
    } else {
      console.log(`📹 Scope: All videos`)
    }

    // Create Langfuse trace if configured
    let trace: ReturnType<typeof langfuse.trace> | null = null
    if (isLangfuseConfigured()) {
      try {
        trace = langfuse.trace({
          name: 'chat',
          userId,
          sessionId: conversationId,
          metadata: {
            scope: scope?.type || 'all',
            videoCount: videoScope?.length || 0,
            messageCount: messages.length,
          },
        })
      } catch (error) {
        console.error('Failed to create Langfuse trace:', error)
      }
    }
    
    // Create the system prompt
    const systemPrompt = `You are Bravi AI, an intelligent assistant that helps users find information in their YouTube video knowledge base. 

You have access to TWO search tools for finding relevant content in the user's YouTube videos:

**searchDetailed**: Use for specific facts, timestamps, exact quotes, or precise information (searches 30-90 second chunks)
**searchThematic**: Use for broad overviews, main topics, key themes, or "what is this about?" questions (searches 5-20 minute sections)

Use your judgment to choose the appropriate tool:
- Specific facts, timestamps, details → Use searchDetailed
- General topics, themes, overviews → Use searchThematic  
- Complex questions → Use both tools sequentially for comprehensive answers
- For general conversation, greetings, or non-video questions → Respond directly

When you do search and find relevant content:
1. Provide comprehensive answers based on the search results
2. Always include specific video citations with timestamps in your response
3. If no relevant content is found, let the user know and suggest they add more videos

**Citation Format Requirement:**
When citing videos in your response, you MUST use the exact format:
\`[Video Title at M:SS](videoId:VIDEO_ID:START_TIME_IN_SECONDS)\`

Where:
- \`Video Title\`: The exact video title to display (e.g., "Amazon Documentary")
- \`at M:SS\`: Human-readable timestamp in minutes:seconds format (e.g., "at 10:15")
- \`VIDEO_ID\`: The internal video ID (UUID) from the search results
- \`START_TIME_IN_SECONDS\`: The exact start time in seconds for navigation (e.g., 615 for 10:15)

Example citation:
\`Customer obsession is the first principle [Amazon Documentary at 10:15](videoId:abc-123-def-456:615) mentioned by Bezos.\`

Important guidelines:
- Calculate START_TIME as the total seconds (minutes * 60 + seconds)
- Only include citations for videos you actually reference in your response
- Be specific about timestamps and video references
- If searching specific videos, use the provided videoIds parameter
- If no videoIds are provided, search all user videos
- Keep responses helpful and conversational

Current user context:
- User ID: ${userId}
- Video scope: ${videoScope ? `Selected videos (${videoScope.length}): ${videoScope.join(', ')}` : 'All videos'}`

    // Create the search functions with enhanced logging
    const searchDetailed = createSearchDetailedChunks(userId, videoScope)
    const searchThematic = createSearchThematicChunks(userId, videoScope)

    // Stream the AI response with multi-step tool calling enabled
    const result = await streamText({
      model: anthropic('claude-3-7-sonnet-latest'),
      system: systemPrompt,
      messages: convertToModelMessages(messages), // ← Use messages directly
      tools: {
        searchDetailed: {
          description: searchDetailedTool.description,
          inputSchema: searchDetailedTool.parameters,
          execute: searchDetailed
        },
        searchThematic: {
          description: searchThematicTool.description,
          inputSchema: searchThematicTool.parameters,
          execute: searchThematic
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
        
        // Track tool calls for Langfuse
        const toolCalls: Array<{ name: string; input: unknown; output: unknown }> = []
        
        // Loop through all steps to find search tool calls
        for (const step of result.steps) {
          if (step.toolCalls) {
            for (const toolCall of step.toolCalls) {
              if (toolCall.toolName === 'searchDetailed' || toolCall.toolName === 'searchThematic') {
                const toolResult = step.toolResults?.find(r => r.toolCallId === toolCall.toolCallId)
                // Access the tool result data correctly
                // @ts-expect-error - AI SDK has complex nested types for tool results
                const resultData = toolResult?.result
                
                // Track tool call for Langfuse
                toolCalls.push({
                  name: toolCall.toolName,
                  input: 'args' in toolCall ? toolCall.args : toolCall,
                  output: resultData,
                })
                
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

        // Trace to Langfuse if configured
        if (trace) {
          try {
            // Create generation observation
            const generation = trace.generation({
              name: 'chat-generation',
              model: 'claude-3-7-sonnet-latest',
              modelParameters: {
                temperature: 0.7,
              },
              input: userRequest,
              output: finalStep?.text || '',
              metadata: {
                finishReason: result.finishReason,
                usage: result.usage,
                steps: result.steps.length,
                toolCalls: toolCalls.length,
                citations: citations.length,
              },
            })

            // Add tool call spans
            for (const toolCall of toolCalls) {
              trace.span({
                name: toolCall.name,
                input: toolCall.input,
                output: toolCall.output,
              })
            }

            // No flush needed for generation - it's automatically sent
          } catch (error) {
            console.error('Langfuse tracing error:', error)
          }
          
          // Flush async to send data to Langfuse
          try {
            // Use Langfuse's flush method if available
            if (typeof langfuse.flushAsync === 'function') {
              await langfuse.flushAsync()
            }
          } catch (error) {
            console.error('Langfuse flush error:', error)
          }
        }
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
