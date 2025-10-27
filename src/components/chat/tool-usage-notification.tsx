'use client'

import { Search, Loader2 } from 'lucide-react'

// Custom pulse animation
const pulseStyle = `
  @keyframes custom-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  .custom-pulse {
    animation: custom-pulse 2s ease-in-out infinite;
  }
`

interface ToolUsageNotificationProps {
  isActive: boolean
  toolName: string
  status: 'starting' | 'active' | 'completed' | 'error'
  progress?: string
}

export const ToolUsageNotification = ({ 
  isActive, 
  toolName, 
  status, 
  progress 
}: ToolUsageNotificationProps) => {
  if (!isActive) return null

  const getToolIcon = () => {
    switch (toolName) {
      case 'searchKnowledgeBase':
        return <Search className="h-3 w-3" />
      default:
        return <Loader2 className="h-3 w-3" />
    }
  }

  const getToolDisplayName = () => {
    switch (toolName) {
      case 'searchKnowledgeBase':
        return 'Searching your videos'
      default:
        return 'Processing'
    }
  }

  // Returns theme-aware color class based on tool execution status
  // All colors automatically adapt to light/dark mode
  const getStatusColor = () => {
    switch (status) {
      case 'starting':
        return 'text-info' // Blue - action initiated
      case 'active':
        return 'text-info' // Blue - actively processing
      case 'completed':
        return 'text-success' // Green - successful completion
      case 'error':
        return 'text-destructive' // Red - error occurred
      default:
        return 'text-muted-foreground' // Gray - neutral/default state
    }
  }

  const getAnimationClass = () => {
    if (status === 'active') {
      return 'custom-pulse'
    }
    return ''
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: pulseStyle }} />
      <div 
        className={`
          inline-flex items-center gap-2 text-xs font-medium
          transition-all duration-200 ease-in-out
          ${getStatusColor()}
          ${getAnimationClass()}
        `}
        role="status"
        aria-live="polite"
        aria-label={`${getToolDisplayName()} - ${status}`}
      >
      {status === 'active' ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        getToolIcon()
      )}
      <span>
        {progress || getToolDisplayName()}
      </span>
      </div>
    </>
  )
}
