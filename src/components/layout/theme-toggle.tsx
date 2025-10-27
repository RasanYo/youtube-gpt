'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | undefined>(undefined)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated
    setIsHydrated(true)
    
    // Get theme from localStorage
    const stored = localStorage.getItem('bravi_theme') as
      | 'light'
      | 'dark'
      | null
    const initial = stored || 'light'
    setTheme(initial)
    document.documentElement.classList.toggle('dark', initial === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('bravi_theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  // Show placeholder during hydration to prevent mismatch
  if (!isHydrated || theme === undefined) {
    return (
      <div className="h-9 w-9" />
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
