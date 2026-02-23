import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, role, universityId } = body
        if (!email || !password || !role) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })

        // 1. Authenticate caller (must be logged in)
        const cookieStore = await cookies()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseServiceRoleKey) {
            return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })
        }

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
                remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }) },
            },
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // 2. Validate caller role (must be super_admin to create admins anywhere, or university_admin for their own)
        const { data: adminProfile } = await supabase.from('profiles').select('role, university_id').eq('id', user.id).single()

        if (adminProfile?.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden: Only Super Admins can create new admins via this route" }, { status: 403 })
        }

        // 3. Use Admin client for secure user creation
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 4. Create user in auth.users
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm so they can log in
        })

        if (createError) return NextResponse.json({ error: createError.message }, { status: 400 })
        if (!newUser.user) return NextResponse.json({ error: "Failed to create user" }, { status: 500 })

        // 5. Explicitly upsert profile (overriding the trigger if necessary, or just ensuring role/uni_id)
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: newUser.user.id,
            email: email,
            role: role,
            university_id: universityId || null,
        }, { onConflict: 'id' })

        if (profileError) {
            // Rollback auth user creation if profile fails? Probably good idea but skipping for now
            return NextResponse.json({ error: profileError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, user: newUser.user })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 })
    }
}
