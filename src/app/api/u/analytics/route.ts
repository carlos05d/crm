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

        const { data: profile } = await supabaseAdmin.from('profiles').select('role, university_id').eq('id', authData.user.id).single()
        if (!profile || profile.role !== 'university_admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const uniId = profile.university_id
        const { searchParams } = new URL(req.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        const dateFilter = (query: any) => {
            if (from) query = query.gte('created_at', from)
            if (to) query = query.lte('created_at', to)
            return query
        }

        // All leads for this university
        const { data: leads } = await dateFilter(
            supabaseAdmin.from('leads')
                .select('id, stage_id, score, created_at, assigned_agent_id, kanban_stages(name)')
                .eq('university_id', uniId)
        )

        // Leads by stage
        const stageCounts: Record<string, number> = {}
        leads?.forEach((l: any) => {
            const name = (l.kanban_stages as any)?.name || 'Unassigned'
            stageCounts[name] = (stageCounts[name] || 0) + 1
        })
        const leadsByStage = Object.entries(stageCounts).map(([name, count]) => ({ name, count }))

        // Score distribution
        const scoreBuckets = { '0-25': 0, '26-50': 0, '51-75': 0, '76-100': 0 }
        leads?.forEach((l: any) => {
            const s = l.score || 0
            if (s <= 25) scoreBuckets['0-25']++
            else if (s <= 50) scoreBuckets['26-50']++
            else if (s <= 75) scoreBuckets['51-75']++
            else scoreBuckets['76-100']++
        })
        const scoreDistribution = Object.entries(scoreBuckets).map(([range, count]) => ({ range, count }))

        // Leads per agent
        const agentCounts: Record<string, number> = {}
        leads?.forEach((l: any) => {
            const agentId = l.assigned_agent_id || 'Unassigned'
            agentCounts[agentId] = (agentCounts[agentId] || 0) + 1
        })

        // Leads created per day (last 30 days)
        const leadsByDay: Record<string, number> = {}
        leads?.forEach((l: any) => {
            const day = new Date(l.created_at).toLocaleDateString()
            leadsByDay[day] = (leadsByDay[day] || 0) + 1
        })
        const leadVolume = Object.entries(leadsByDay).map(([day, count]) => ({ day, count })).slice(-30)

        // Conversion rate for this university
        const totalLeads = leads?.length || 0
        const admitted = leads?.filter((l: any) => (l.kanban_stages as any)?.name === 'Admitted').length || 0
        const conversionRate = totalLeads > 0 ? Math.round((admitted / totalLeads) * 100) : 0

        return NextResponse.json({
            leadsByStage,
            scoreDistribution,
            leadVolume,
            conversionRate,
            totalLeads,
            admittedLeads: admitted,
        })

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
