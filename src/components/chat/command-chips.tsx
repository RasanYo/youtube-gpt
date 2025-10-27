'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { COMMAND_CONFIG } from '@/lib/chat-commands/constants'
import type { CommandId } from '@/lib/chat-commands/types'

interface CommandChipsProps {
  selectedCommand: CommandId | null
  onCommandChange: (commandId: CommandId | null) => void
}

/**
 * CommandChips Component
 *
 * Displays selectable command chips that apply prompt templates to user input.
 * Only one command can be selected at a time. Clicking a selected command
 * deselects it.
 *
 * @param selectedCommand - The currently selected command ID, or null if none
 * @param onCommandChange - Callback when command selection changes
 */
export const CommandChips = ({ selectedCommand, onCommandChange }: CommandChipsProps): JSX.Element => {
  /**
   * Handles command chip click/toggle behavior.
   * If the clicked command is already selected, deselects it.
   * Otherwise, selects the clicked command.
   * 
   * @param commandId - The ID of the command that was clicked
   */
  const handleCommandClick = (commandId: CommandId): void => {
    // Toggle: if clicked command is already selected, deselect it
    if (selectedCommand === commandId) {
      onCommandChange(null)
    } else {
      onCommandChange(commandId)
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-2">
        {COMMAND_CONFIG.map((command) => {
          const isSelected = selectedCommand === command.id
          
          return (
            <Tooltip key={command.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant={isSelected ? 'default' : 'secondary'}
                  className={`
                    cursor-pointer transition-all duration-200
                    hover:scale-105 active:scale-95
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'hover:bg-secondary/80'
                    }
                  `}
                  onClick={() => handleCommandClick(command.id)}
                  role="button"
                  aria-label={`Select command: ${command.label}. ${command.description}. Click to ${isSelected ? 'deselect' : 'select'}.`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCommandClick(command.id)
                    }
                  }}
                >
                  {command.icon && <span className="mr-1">{command.icon}</span>}
                  {command.label}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{command.description}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

