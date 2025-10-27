/**
 * Chat Commands Constants
 *
 * Defines the available commands and their prompt templates for the
 * chat command chip system.
 */

import { ChatCommand, CommandId, CommandTemplate } from './types';

/**
 * Command prompt templates that will be prefixed to user input
 *
 * Each template provides specific instructions for the AI to format
 * its response in the desired way while maintaining compatibility with
 * the existing RAG system and citation functionality.
 */
export const COMMAND_TEMPLATES: Record<CommandId, string> = {
  [CommandId.SUMMARIZE]: `Please provide a comprehensive summary of the content based on the following request. Structure your response with:

1. **Key Points**: 3-5 main takeaways in bullet points
2. **Main Insights**: 2-3 paragraphs of the most important insights
3. **Notable Examples**: Any specific examples or case studies mentioned

Keep the summary concise, well-organized, and easy to scan. Include relevant citations with timestamps.

User request: `,

  [CommandId.CREATE_POST]: `Please create a LinkedIn-style social media post based on the following request. Follow these formatting guidelines:

1. **Hook Line**: Start with an engaging opening line that captures attention
2. **Value Content**: 2-4 paragraphs providing valuable insights or takeaways
3. **Formatting**: Use line breaks between paragraphs for readability
4. **Emojis**: Use 2-3 strategic emojis (not excessive) to add visual interest
5. **Call to Action**: End with a question or prompt to encourage engagement
6. **Citations**: Include relevant video citations with timestamps

Keep the tone professional yet conversational, and focus on delivering value to the reader.

User request: `,
};

/**
 * Configuration for all available chat commands
 *
 * This array defines the commands that will appear as selectable chips
 * in the chat interface.
 * 
 * @example Adding a new command:
 * ```typescript
 * // 1. Add new command ID to enum in types.ts:
 * export enum CommandId {
 *   SUMMARIZE = 'summarize',
 *   CREATE_POST = 'create-post',
 *   NEW_COMMAND = 'new-command', // Add here
 * }
 * 
 * // 2. Add template to COMMAND_TEMPLATES:
 * export const COMMAND_TEMPLATES: Record<CommandId, string> = {
 *   [CommandId.NEW_COMMAND]: `Your template here... User request: `,
 *   // ... other commands
 * }
 * 
 * // 3. Add config here:
 * export const COMMAND_CONFIG: ChatCommand[] = [
 *   // ... existing commands
 *   {
 *     id: CommandId.NEW_COMMAND,
 *     label: 'New Command',
 *     icon: '🎯',
 *     description: 'What this command does',
 *   },
 * ]
 * ```
 */
export const COMMAND_CONFIG: ChatCommand[] = [
  {
    id: CommandId.SUMMARIZE,
    label: 'Summarize',
    icon: '📝',
    description: 'Create a structured summary with key points and insights',
  },
  {
    id: CommandId.CREATE_POST,
    label: 'Create Post',
    icon: '✍️',
    description: 'Generate a LinkedIn-style social media post',
  },
];
