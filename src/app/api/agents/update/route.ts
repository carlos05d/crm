import { NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { agentId, email, password } = body
        if (!agentId) return NextResponse.json({ error: "Missing agentId" }, { status: 400 })
        if (!email && !password) return NextResponse.json({ error: "No update fields provided" }, { status: 400 })

        // 1. Authenticate caller using RLS
        const cookieStore = await cookies()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set(name: string, value: string, options: CookieOptions) { cookieStore.set({ name, value, ...options }) },
                remove(name: string, options: CookieOptions) { cookieStore.set({ name, value: "", ...options }) },
            },
        })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        // 2. Validate admin role
        const { data: adminProfile } = await supabase.from('profiles').select('role, university_id').eq('id', user.id).single()
        if (adminProfile?.role !== 'university_admin') return NextResponse.json({ error: "Forbidden: Not admin" }, { status: 403 })
        if (!adminProfile.university_id) return NextResponse.json({ error: "Admin has no university_id" }, { status: 400 })

        // 3. Admin client for secure updates
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 4. Validate target agent
        const { data: agentData, error: agentError } = await supabaseAdmin.from('agents').select('university_id').eq('user_id', agentId).single()
        if (agentError || !agentData) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
        if (agentData.university_id !== adminProfile.university_id) return NextResponse.json({ error: "Forbidden: Cannot edit agents outside your tenant" }, { status: 403 })

        // 5. Update auth credentials
        const updateData: any = {}
        if (email) updateData.email = email
        if (password) updateData.password = password

        const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(agentId, updateData)
        if (authUpdateError) return NextResponse.json({ error: authUpdateError.message }, { status: 500 })

        // 6. Sync profile email
        if (email) {
            await supabaseAdmin.from('profiles').update({ email }).eq('id', agentId)
        }

        // 7. Log action
        await supabaseAdmin.from('audit_logs').insert({
            university_id: adminProfile.university_id,
            actor_id: user.id,
            actor_role: 'university_admin',
            action: 'agent_credentials_updated',
            entity: 'agents',
            entity_id: agentId,
            metadata: { email_changed: !!email, password_changed: !!password }
        })

        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 })
    }
}
