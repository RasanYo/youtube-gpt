import { NextRequest } from 'next/server'
import { generateText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

export async function POST(request: NextRequest) {
  try {
    const { userMessage, assistantMessage } = await request.json()

    if (!userMessage || !assistantMessage) {
      return new Response(
        JSON.stringify({ error: 'User message and assistant message are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate a concise title based on the conversation
    const result = await generateText({
      model: anthropic('claude-3-7-sonnet-latest'),
      system: `You are a title generator. Generate a concise, descriptive title (max 6 words) that captures the main theme or topic of a conversation between a user and an AI assistant.
      
Guidelines:
- Be specific and descriptive
- Maximum 6 words
- No punctuation at the end
- Capitalize the first letter of each word
- Focus on the user's intent or question
- Avoid generic titles like "Chat" or "Conversation"
- Keep the response to a single line, just the title

Example good titles:
- "YouTube Video SEO Strategies"
- "Pricing Model Recommendations"
- "Content Planning Techniques"
- "Data Analysis Best Practices"`,
      messages: [
        {
          role: 'user',
          content: `User: "${userMessage}"\n\nAssistant: "${assistantMessage.substring(0, 200)}..."`
        }
      ],
      maxOutputTokens: 20,
      temperature: 0.7,
    })

    const title = result.text.trim()

    return new Response(
      JSON.stringify({ title }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error generating title:', error)
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

