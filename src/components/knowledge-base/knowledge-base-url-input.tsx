'use client'

import { Cloud, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface KnowledgeBaseUrlInputProps {
  urlInput: string
  setUrlInput: (value: string) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

export const KnowledgeBaseUrlInput = ({
  urlInput,
  setUrlInput,
  isSubmitting,
  onSubmit,
}: KnowledgeBaseUrlInputProps) => {
  return (
    <div className="border-b">
      <form onSubmit={onSubmit} className="p-4">
        <div className="relative">
          <Input
            type="url"
            placeholder="Paste YouTube video/channel URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            disabled={isSubmitting}
            className="w-full pr-12"
          />
          <Button type="submit" size="sm" className="absolute right-1 top-1 h-8 w-8 p-0" disabled={isSubmitting || !urlInput.trim()}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
}

