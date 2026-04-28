import * as React from "react"
import Link from "next/link"
import { Search, User, Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { createClient } from "@/utils/supabase/server"
import { signout } from "@/app/login/actions"

export async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto max-w-content flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4">
          <Button variant="tertiary" size="icon" className="md:hidden">
            <Menu className="h-5 w-5 text-foreground" />
          </Button>
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary-blue tracking-tight">NewsAggregator</span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50" />
            <Input 
              type="search" 
              placeholder="Search news..." 
              className="w-full pl-9 bg-light-gray border-transparent focus-visible:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="tertiary" size="icon" className="md:hidden">
            <Search className="h-5 w-5 text-foreground" />
          </Button>
          
          {user ? (
            <form action={signout} className="flex items-center gap-2">
              <Link href="/profile">
                <Button variant="tertiary" size="icon" title="Profile">
                  <User className="h-5 w-5 text-primary-blue" />
                </Button>
              </Link>
              <Button variant="tertiary" size="icon" type="submit" title="Sign Out">
                <LogOut className="h-5 w-5 text-foreground/70" />
              </Button>
            </form>
          ) : (
            <Link href="/login">
              <Button variant="primary" size="sm">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
