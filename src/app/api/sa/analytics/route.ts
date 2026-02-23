import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const supabaseUser = await createServerClient()
        const { data: authData, error: authError } = await supabaseUser.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', authData.user.id).single()
        if (!profile || profile.role !== 'super_admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { searchParams } = new URL(req.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // Build date filter
        const dateFilter = (query: any) => {
            if (from) query = query.gte('created_at', from)
            if (to) query = query.lte('created_at', to)
            return query
        }

        // All leads with stage info
        const { data: leads } = await dateFilter(
            supabaseAdmin.from('leads').select('id, stage_id, score, created_at, university_id, kanban_stages(name)')
        )

        // Universities by month (for trend chart)
        const { data: universities } = await supabaseAdmin
            .from('universities')
            .select('id, name, created_at, status, plan_type')
            .order('created_at')

        // Aggregate leads by stage name
        const stageCounts: Record<string, number> = {}
        leads?.forEach(l => {
            const stageName = (l.kanban_stages as any)?.name || 'Unassigned'
            stageCounts[stageName] = (stageCounts[stageName] || 0) + 1
        })

        // Leads by stage as chart-ready array
        const leadsByStage = Object.entries(stageCounts).map(([name, count]) => ({ name, count }))

        // Universities created per month
        const uniByMonth: Record<string, number> = {}
        universities?.forEach(u => {
            const month = new Date(u.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
            uniByMonth[month] = (uniByMonth[month] || 0) + 1
        })
        const uniGrowth = Object.entries(uniByMonth).map(([month, count]) => ({ month, count }))

        // Score distribution
        const scoreBuckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }
        leads?.forEach(l => {
            const s = l.score || 0
            if (s <= 25) scoreBuckets['0-25']++
            else if (s <= 50) scoreBuckets['26-50']++
            else if (s <= 75) scoreBuckets['51-75']++
            else scoreBuckets['76-100']++
        })
        const scoreDistribution = Object.entries(scoreBuckets).map(([range, count]) => ({ range, count }))

        // Plan distribution
        const planCounts: Record<string, number> = {}
        universities?.forEach(u => {
            const plan = u.plan_type || 'basic'
            planCounts[plan] = (planCounts[plan] || 0) + 1
        })
        const planDistribution = Object.entries(planCounts).map(([name, value]) => ({ name, value }))

        // Conversion rate (Admitted / total leads)
        const totalLeads = leads?.length || 0
        const admittedLeads = leads?.filter(l => (l.kanban_stages as any)?.name === 'Admitted').length || 0
        const conversionRate = totalLeads > 0 ? Math.round((admittedLeads / totalLeads) * 100) : 0

        return NextResponse.json({
            leadsByStage,
            uniGrowth,
            scoreDistribution,
            planDistribution,
            conversionRate,
            totalLeads,
            admittedLeads,
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
