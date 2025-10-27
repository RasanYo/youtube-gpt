/**
 * Chat Commands Utilities
 *
 * Utility functions for working with chat commands and prompt templates.
 */

import { COMMAND_TEMPLATES } from './constants'
import type { CommandId } from './types'

/**
 * Enhances user input with command template prefix if a command is selected
 *
 * If a command is selected, the appropriate template is prepended to the
 * user's input. If no command is selected, the original input is returned.
 *
 * @param userInput - The user's input message
 * @param selectedCommand - The ID of the selected command, or null if none
 * @returns The enhanced prompt with template prefix, or original input
 *
 * @example
 * ```typescript
 * const enhanced = getEnhancedPrompt("find mentions of pricing", CommandId.SUMMARIZE)
 * // Returns: "Please provide a comprehensive summary... User request: find mentions of pricing"
 * ```
 */
export function getEnhancedPrompt(userInput: string, selectedCommand: CommandId | null): string {
  if (!selectedCommand) {
    return userInput
  }

  const template = COMMAND_TEMPLATES[selectedCommand]
  return template + userInput
}

