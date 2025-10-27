'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { useAuth } from '@/contexts/AuthContext'
import { CurrentUserAvatar } from '@/components/auth/current-user-avatar'
import { useCurrentUserName } from '@/hooks/use-current-user-name'

export const ConversationSidebarProfile = () => {
  const { user, logout } = useAuth()
  const userName = useCurrentUserName()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  return (
    <div className="border-t bg-sidebar-accent/50">
      <Separator />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <CurrentUserAvatar />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-sidebar-foreground">
              {userName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="flex-1 justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  )
}
