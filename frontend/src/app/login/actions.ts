'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate inputs
  if (!email || !email.includes('@')) {
    redirect('/login?message=Please enter a valid email address')
  }
  if (!password || password.length < 6) {
    redirect('/login?message=Password must be at least 6 characters')
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(`/login?message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  // Validate inputs
  if (!email || !email.includes('@')) {
    redirect('/login?mode=signup&message=Please enter a valid email address')
  }
  if (!password || password.length < 6) {
    redirect('/login?mode=signup&message=Password must be at least 6 characters')
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
      }
    }
  })

  if (error) {
    redirect(`/login?mode=signup&message=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/login?message=Check your email to continue sign in process')
}

export async function signout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
