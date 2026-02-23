import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
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

        // Get agent's user_id
        const userId = authData.user.id

        // Fetch agent row (read landing stats + slug)
        const { data: agent } = await supabaseAdmin
            .from('agents')
            .select('user_id, display_name, public_slug, university_id')
            .eq('user_id', userId)
            .single()

        if (!agent) {
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        }

        // Count total landing leads
        const { count: totalLeads } = await supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_agent_id', userId)
            .eq('source_type', 'agent_landing')

        // Count last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { count: last7 } = await supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_agent_id', userId)
            .eq('source_type', 'agent_landing')
            .gte('created_at', sevenDaysAgo)

        // Count last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { count: last30 } = await supabaseAdmin
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_agent_id', userId)
            .eq('source_type', 'agent_landing')
            .gte('created_at', thirtyDaysAgo)

        // Check how many were "Won" for conversion rate
        const { data: stages } = await supabaseAdmin
            .from('kanban_stages')
            .select('id, name')
            .eq('university_id', agent.university_id)
        const wonStage = stages?.find(s => s.name.toLowerCase().includes('won') || s.name.toLowerCase().includes('converted'))
        let conversionRate = 0
        if (wonStage && totalLeads && totalLeads > 0) {
            const { count: wonCount } = await supabaseAdmin
                .from('leads')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_agent_id', userId)
                .eq('source_type', 'agent_landing')
                .eq('stage_id', wonStage.id)
            conversionRate = Math.round(((wonCount ?? 0) / totalLeads) * 100)
        }

        // Fetch university slug for the landing URL
        const { data: uni } = await supabaseAdmin
            .from('universities')
            .select('slug')
            .eq('id', agent.university_id)
            .single()

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const landingUrl = agent.public_slug
            ? `${appUrl}/forms/${uni?.slug || agent.university_id}/agent/${agent.public_slug}`
            : null

        return NextResponse.json({
            agent: {
                user_id: agent.user_id,
                display_name: agent.display_name,
                public_slug: agent.public_slug,
            },
            landing_url: landingUrl,
            stats: {
                total: totalLeads ?? 0,
                last7: last7 ?? 0,
                last30: last30 ?? 0,
                conversionRate,
            }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
