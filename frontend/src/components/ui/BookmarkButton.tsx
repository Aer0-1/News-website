"use client"

import { useState, useTransition } from "react"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { toggleBookmark } from "@/app/actions/bookmarks"
import { usePathname } from "next/navigation"

export function BookmarkButton({ 
  articleId, 
  initialIsBookmarked = false,
  variant = "secondary",
  showText = false
}: { 
  articleId: string
  initialIsBookmarked?: boolean
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost"
  showText?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const pathname = usePathname()

  const handleToggle = () => {
    // Optimistic update
    const newStatus = !isBookmarked
    setIsBookmarked(newStatus)
    
    startTransition(async () => {
      const result = await toggleBookmark(articleId, !newStatus, pathname)
      if (result.error) {
        // Revert on error
        setIsBookmarked(!newStatus)
        alert(result.error)
      }
    })
  }

  return (
    <Button 
      variant={variant} 
      size={showText ? "default" : "icon"} 
      onClick={(e) => {
        e.preventDefault() // prevent navigation if inside a Link wrapper
        handleToggle()
      }}
      disabled={isPending}
      className={!showText ? "rounded-full" : ""}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current text-primary-blue' : ''} ${showText ? 'mr-2' : ''}`} />
      {showText && (isBookmarked ? "Saved" : "Save for later")}
    </Button>
  )
}
