'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const authSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(6, "Password must be at least 6 characters long."),
})

export async function login(formData: FormData) {
    const supabase = await createClient()

    const result = authSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!result.success) {
        redirect(`/login?error=${result.error.issues[0].message}`)
    }

    const { email, password } = result.data

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (authError || !authData.user) {
        redirect('/login?error=Invalid login credentials')
    }

    // Determine user role for routing
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

    revalidatePath('/', 'layout')

    // Route based on role — strict interface isolation
    if (profile?.role === 'super_admin') {
        redirect('/sa/dashboard')
    } else if (profile?.role === 'university_admin') {
        redirect('/u/dashboard')
    } else if (profile?.role === 'agent') {
        redirect('/agent/dashboard')
    } else {
        // Fallback if no profile exists yet (e.g. newly signed up super_admin)
        redirect('/sa/dashboard')
    }
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const result = authSchema.safeParse(Object.fromEntries(formData.entries()))
    if (!result.success) {
        redirect(`/login?error=${result.error.issues[0].message}`)
    }

    const { email, password } = result.data

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError || !authData.user) {
        redirect('/login?error=Could not create user account: ' + authError?.message)
    }

    // Auto-create a super_admin profile for this newly signed up user for demo purposes
    await supabase.from('profiles').insert({
        id: authData.user.id,
        email: email,
        role: 'super_admin'
    })

    revalidatePath('/', 'layout')
    redirect('/sa/dashboard')
}
