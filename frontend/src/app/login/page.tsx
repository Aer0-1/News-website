import { login, signup } from './actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string; mode?: string }
}) {
  const isSignup = searchParams.mode === 'signup'

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-[80vh]">
      <Link
        href="/"
        className="absolute left-8 top-24 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
      >
        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back
      </Link>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignup
              ? 'Sign up for a new account to get started.'
              : 'Sign in to your account to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex-1 flex flex-col w-full justify-center gap-4 text-foreground">
            
            {/* Full Name — only visible during signup */}
            {isSignup && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium" htmlFor="full_name">
                  Full Name
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            {searchParams?.message && (
              <p className="mt-4 p-4 bg-foreground/10 text-foreground text-center text-sm rounded-md">
                {searchParams.message}
              </p>
            )}

            <div className="flex flex-col gap-3 mt-4">
              {isSignup ? (
                <>
                  <Button formAction={signup}>
                    Create Account
                  </Button>
                  <p className="text-center text-sm text-foreground/60">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary-blue font-medium hover:underline">
                      Sign In
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <Button formAction={login}>
                    Sign In
                  </Button>
                  <p className="text-center text-sm text-foreground/60">
                    Don&apos;t have an account?{' '}
                    <Link href="/login?mode=signup" className="text-primary-blue font-medium hover:underline">
                      Sign Up
                    </Link>
                  </p>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
