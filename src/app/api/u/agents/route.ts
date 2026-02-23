import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

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

        // Get caller's university_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, university_id')
            .eq('id', authData.user.id)
            .single()

        if (!profile || !['university_admin', 'super_admin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const uniId = profile.university_id
        if (!uniId) return NextResponse.json({ error: 'No university context' }, { status: 400 })

        // Fetch agents with service role — bypasses RLS so emails are visible
        const { data: agents, error } = await supabaseAdmin
            .from('agents')
            .select('user_id, display_name, active, phone, university_id, created_at, last_known_password')
            .eq('university_id', uniId)
            .order('display_name')


        if (error) throw error

        // Fetch emails from profiles for all agents
        const agentIds = agents?.map(a => a.user_id) || []
        const { data: profilesData } = await supabaseAdmin
            .from('profiles')
            .select('id, email')
            .in('id', agentIds)

        // Fetch lead counts per agent
        const leadCounts: Record<string, number> = {}
        if (agentIds.length > 0) {
            const { data: leads } = await supabaseAdmin
                .from('leads')
                .select('assigned_agent_id')
                .in('assigned_agent_id', agentIds)

            leads?.forEach(l => {
                if (l.assigned_agent_id) {
                    leadCounts[l.assigned_agent_id] = (leadCounts[l.assigned_agent_id] || 0) + 1
                }
            })
        }

        const profileMap: Record<string, string> = {}
        profilesData?.forEach(p => { if (p.email) profileMap[p.id] = p.email })

        const combined = agents?.map(a => ({
            ...a,
            email: profileMap[a.user_id] || null,
            lead_count: leadCounts[a.user_id] || 0,
        })) || []

        return NextResponse.json({ agents: combined })

    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
