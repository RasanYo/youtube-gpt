/**
 * Chat Commands Types
 *
 * Defines types for the chat command chip system that allows users
 * to apply prompt templates for specific output formats.
 */

/**
 * Unique identifier for a chat command
 */
export enum CommandId {
  SUMMARIZE = 'summarize',
  CREATE_POST = 'create-post',
}

/**
 * Definition of a chat command that users can select
 *
 * @property id - Unique identifier for the command
 * @property label - Display label shown on the command chip
 * @property icon - Icon name or component to display (optional)
 * @property description - Tooltip description explaining what the command does
 */
export type ChatCommand = {
  id: CommandId;
  label: string;
  icon?: string;
  description: string;
};

/**
 * Prompt template that will be prefixed to user input
 *
 * Templates should include clear instructions for the AI to produce
 * the desired output format while maintaining compatibility with
 * existing system prompts and RAG functionality.
 */
export type CommandTemplate = {
  commandId: CommandId;
  template: string;
};

/**
 * Registry of all available commands with their metadata
 *
 * This type allows for easy extensibility when adding new commands.
 */
export type CommandRegistry = ChatCommand[];
