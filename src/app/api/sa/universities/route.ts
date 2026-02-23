import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!supabaseServiceRoleKey) {
            return NextResponse.json({ error: "Missing Server Credentials" }, { status: 500 })
        }

        const supabaseUser = await createServerClient()

        const { data: authData, error: authError } = await supabaseUser.auth.getUser()
        if (authError || !authData.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', authData.user.id).single()

        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden: Super Admins Only" }, { status: 403 })
        }

        const { data: unis } = await supabaseAdmin
            .from("universities")
            .select("id, name, subdomain, plan_type, status, created_at")
            .order("created_at", { ascending: false })

        if (!unis) return NextResponse.json({ unis: [] })

        // Fetch counts for each university
        const enriched = await Promise.all(unis.map(async (uni) => {
            const [{ count: adminCount }, { count: leadCount }, { count: agentCount }] = await Promise.all([
                supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", uni.id).eq("role", "university_admin"),
                supabaseAdmin.from("leads").select("*", { count: "exact", head: true }).eq("university_id", uni.id),
                supabaseAdmin.from("agents").select("*", { count: "exact", head: true }).eq("university_id", uni.id),
            ])
            return { ...uni, admin_count: adminCount ?? 0, lead_count: leadCount ?? 0, agent_count: agentCount ?? 0 }
        }))

        return NextResponse.json({ unis: enriched })

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
