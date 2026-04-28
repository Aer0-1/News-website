import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, Compass, Bookmark, Clock, Settings } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Compass, label: "Discover", href: "/discover" },
  { icon: Bookmark, label: "Bookmarks", href: "/profile?tab=bookmarks" },
  { icon: Clock, label: "History", href: "/profile?tab=history" },
  { icon: Settings, label: "Preferences", href: "/profile?tab=preferences" },
]

const categories = [
  "Technology", "Business", "Politics", "Sports", "Entertainment", "Science", "Health"
]

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("w-64 flex-shrink-0 flex flex-col space-y-8 p-6", className)}>
      <div className="space-y-2">
        <h3 className="px-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-4">
          Menu
        </h3>
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center space-x-3 px-2 py-2.5 rounded-md text-sm font-medium text-foreground hover:bg-light-gray hover:text-primary-blue transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-2">
        <h3 className="px-2 text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-4">
          Categories
        </h3>
        <div className="flex flex-col space-y-1">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/search?category=${category.toLowerCase()}`}
              className="px-2 py-2 rounded-md text-sm text-foreground hover:bg-light-gray transition-colors"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
