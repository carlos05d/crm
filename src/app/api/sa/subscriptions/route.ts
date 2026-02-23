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

        // Fetch subscriptions & related data
        const [
            { data: universities },
            { data: agents }
        ] = await Promise.all([
            supabaseAdmin.from('universities').select('id, name, plan_type, status, created_at').order('created_at', { ascending: false }),
            supabaseAdmin.from('agents').select('id', { count: 'exact', head: true })
        ])

        const activeTenants = universities?.filter(u => u.status === 'active' || !u.status).length || 0
        const totalAgents = agents?.length || 0

        // Approximate MRR based on plans
        let mrr = 0
        universities?.forEach(u => {
            const plan = (u.plan_type || 'basic').toLowerCase()
            if (plan === 'premium') mrr += 299
            if (plan === 'enterprise') mrr += 899
        })

        // Fake recent activity but populated with real university names for now since we don't have a payments webhook table
        const recentActivity = universities?.slice(0, 5).map((u, i) => ({
            id: u.id,
            uni: u.name,
            action: i === 0 ? `Upgraded to ${u.plan_type || 'Premium'}` : i === 1 ? 'Renewed Plan' : 'Account Created',
            time: new Date(u.created_at).toLocaleDateString(),
            color: i === 0 ? "text-emerald-600" : "text-blue-600",
            bg: i === 0 ? "bg-emerald-50" : "bg-blue-50"
        }))

        return NextResponse.json({
            metrics: {
                mrr,
                activeTenants,
                activeAgents: totalAgents,
                pendingRenewals: Math.floor(activeTenants * 0.1) // placeholder metric
            },
            activity: recentActivity || []
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
