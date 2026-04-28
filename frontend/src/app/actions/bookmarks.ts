"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function toggleBookmark(articleId: string, isBookmarked: boolean, path: string) {
  const supabase = createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Must be logged in to bookmark articles" }
  }

  if (isBookmarked) {
    // Remove bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('article_id', articleId)

    if (error) {
      console.error('Error removing bookmark:', error)
      return { error: 'Failed to remove bookmark' }
    }
  } else {
    // Add bookmark
    const { error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        article_id: articleId
      })

    if (error) {
      console.error('Error adding bookmark:', error)
      return { error: 'Failed to add bookmark' }
    }
  }

  revalidatePath(path)
  return { success: true }
}

export async function checkIsBookmarked(articleId: string) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return false
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', user.id)
    .eq('article_id', articleId)
    .single()

  if (error || !data) return false
  return true
}
