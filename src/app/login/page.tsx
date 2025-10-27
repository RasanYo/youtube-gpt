'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { Mail, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Simulate sending magic link
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setEmailSent(true)

      toast({
        title: 'Magic link sent!',
        description: 'Check your email for the login link',
      })

      // Auto-login after 2 seconds for demo
      setTimeout(async () => {
        await login(email)
        router.push('/')
      }, 2000)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send magic link',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Bravi</CardTitle>
          <CardDescription>
            Your YouTube AI assistant powered by advanced analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <div className="space-y-4">
              {/* OAuth Buttons */}
              <OAuthButtons />

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* Magic Link Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending magic link...' : 'Send magic link'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  We'll send you a magic link to sign in without a password
                </p>
              </form>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a magic link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Logging you in automatically...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
