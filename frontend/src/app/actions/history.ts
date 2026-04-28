"use server"

import { createClient } from "@/utils/supabase/server"

export async function logReadingHistory(articleId: string) {
  const supabase = createClient()

  // Verify authentication silently
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, reason: "unauthenticated" }
  }

  // Upsert the reading history (relies on a unique constraint on user_id + article_id,
  // or we just insert and ignore conflicts, or we can just insert a new row if we want to track every view)
  // Our schema uses a composite primary key (user_id, article_id) for reading_history, 
  // so we can upsert to update the read_at timestamp.
  const { error } = await supabase
    .from('reading_history')
    .upsert({
      user_id: user.id,
      article_id: articleId,
      read_at: new Date().toISOString()
    }, { onConflict: 'user_id, article_id' })

  if (error) {
    console.error('Error logging reading history:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function clearReadingHistory() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { error } = await supabase
    .from('reading_history')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('Error clearing history:', error)
    return { error: 'Failed to clear history' }
  }

  return { success: true }
}
