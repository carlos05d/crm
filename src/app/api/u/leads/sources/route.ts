import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const supabaseUser = await createServerClient()
        const { data: authData, error: authError } = await supabaseUser.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Get caller's profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, university_id')
            .eq('id', authData.user.id)
            .single()

        if (!profile || !['university_admin', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const uniId = profile.university_id
        const { searchParams } = new URL(req.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // ── Leads with source info ─────────────────────────────────────────────
        let query = supabaseAdmin
            .from('leads')
            .select(`
                id, first_name, last_name, email, phone,
                created_at, source_type, source_label,
                program_id, programs(name),
                stage_id, kanban_stages(name),
                assigned_agent_id, agents(display_name),
                lead_source_id,
                lead_sources(type, agent_id, file_name, platform, campaign, utm_source, utm_medium, utm_campaign, ref_url)
            `)
            .eq('university_id', uniId)
            .order('created_at', { ascending: false })

        if (from) query = query.gte('created_at', from)
        if (to) query = query.lte('created_at', to)

        const { data: leads, error: leadsError } = await query
        if (leadsError) throw leadsError

        // ── Source breakdown chart data ───────────────────────────────────────
        const { data: sourceBreakdown } = await supabaseAdmin
            .from('leads')
            .select('source_type')
            .eq('university_id', uniId)

        const sourceCount: Record<string, number> = {}
        sourceBreakdown?.forEach(l => {
            const t = l.source_type || 'manual'
            sourceCount[t] = (sourceCount[t] || 0) + 1
        })
        const bySource = Object.entries(sourceCount).map(([name, value]) => ({ name, value }))

        // ── Daily leads (last 30 days) by source ──────────────────────────────
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { data: recentLeads } = await supabaseAdmin
            .from('leads')
            .select('created_at, source_type')
            .eq('university_id', uniId)
            .gte('created_at', thirtyDaysAgo)
            .order('created_at')

        const dailyMap: Record<string, Record<string, number>> = {}
        recentLeads?.forEach(l => {
            const day = l.created_at.substring(0, 10)
            if (!dailyMap[day]) dailyMap[day] = {}
            const st = l.source_type || 'manual'
            dailyMap[day][st] = (dailyMap[day][st] || 0) + 1
        })
        const byDay = Object.entries(dailyMap).map(([date, sources]) => ({ date, ...sources }))

        // ── Top agents by landing leads ────────────────────────────────────────
        const { data: agentLeads } = await supabaseAdmin
            .from('leads')
            .select('assigned_agent_id, agents(display_name)')
            .eq('university_id', uniId)
            .eq('source_type', 'agent_landing')
            .not('assigned_agent_id', 'is', null)

        const agentMap: Record<string, { name: string; count: number }> = {}
        agentLeads?.forEach((l: any) => {
            const id = l.assigned_agent_id
            const name = l.agents?.display_name || id
            if (!agentMap[id]) agentMap[id] = { name, count: 0 }
            agentMap[id].count++
        })
        const topAgents = Object.values(agentMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(({ name, count }) => ({ name, leads: count }))

        // ── Conversion rate by source ──────────────────────────────────────────
        const wonStage = await supabaseAdmin
            .from('kanban_stages')
            .select('id')
            .eq('university_id', uniId)
            .ilike('name', '%won%')
            .limit(1)
            .single()

        const conversionBySrc: { source: string; rate: number }[] = []
        if (wonStage.data) {
            for (const [src, total] of Object.entries(sourceCount)) {
                const { count: won } = await supabaseAdmin
                    .from('leads')
                    .select('*', { count: 'exact', head: true })
                    .eq('university_id', uniId)
                    .eq('source_type', src)
                    .eq('stage_id', wonStage.data.id)
                conversionBySrc.push({
                    source: src,
                    rate: total > 0 ? Math.round(((won ?? 0) / total) * 100) : 0
                })
            }
        }

        return NextResponse.json({
            leads: leads ?? [],
            charts: {
                bySource,
                byDay,
                topAgents,
                conversionBySrc,
            }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
