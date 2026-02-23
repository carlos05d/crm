import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const cookieHeader = cookieStore.toString()

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseServiceRoleKey) {
            return NextResponse.json({ error: "Missing Server Credentials" }, { status: 500 })
        }

        // 1. Authenticate the caller using standard Anon Key
        const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { cookie: cookieHeader } },
        })

        const { data: authData, error: authError } = await supabaseUser.auth.getUser()
        if (authError || !authData.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // 2. Use Service Role to fetch the caller's true role (bypassing RLS)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', authData.user.id).single()

        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden: Super Admins Only" }, { status: 403 })
        }

        // 3. Fetch all data using Service Role
        const [
            { data: unis },
            { data: profiles },
        ] = await Promise.all([
            supabaseAdmin.from("universities").select("id, name").order("name"),
            supabaseAdmin.from("profiles").select("id, email, role, university_id, created_at")
                .in("role", ["super_admin", "university_admin"])
                .order("created_at", { ascending: false }),
        ])

        return NextResponse.json({ unis, profiles })

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
