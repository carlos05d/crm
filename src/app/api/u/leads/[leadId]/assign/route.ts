import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ leadId: string }> }
) {
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

        // Validate caller is university_admin
        const { data: adminProfile } = await supabaseAdmin
            .from('profiles')
            .select('role, university_id')
            .eq('id', authData.user.id)
            .single()

        if (adminProfile?.role !== 'university_admin') {
            return NextResponse.json({ error: 'Forbidden: University admin only' }, { status: 403 })
        }
        if (!adminProfile.university_id) {
            return NextResponse.json({ error: 'No university context' }, { status: 400 })
        }

        const body = await req.json()
        const { agentId } = body
        if (!agentId) return NextResponse.json({ error: 'Missing agentId' }, { status: 400 })

        const { leadId } = await params

        // Validate lead belongs to admin's university
        const { data: lead } = await supabaseAdmin
            .from('leads')
            .select('id, university_id, assigned_agent_id')
            .eq('id', leadId)
            .single()

        if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        if (lead.university_id !== adminProfile.university_id) {
            return NextResponse.json({ error: 'Forbidden: Lead is not in your university' }, { status: 403 })
        }

        // Validate target agent belongs to same university
        const { data: agent } = await supabaseAdmin
            .from('agents')
            .select('user_id, university_id, display_name')
            .eq('user_id', agentId)
            .single()

        if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
        if (agent.university_id !== adminProfile.university_id) {
            return NextResponse.json({ error: 'Forbidden: Agent is not in your university' }, { status: 403 })
        }

        // Assign the lead
        const { error: updateError } = await supabaseAdmin
            .from('leads')
            .update({ assigned_agent_id: agentId })
            .eq('id', leadId)

        if (updateError) throw updateError

        // Audit log
        await supabaseAdmin.from('audit_logs').insert({
            university_id: adminProfile.university_id,
            actor_id: authData.user.id,
            actor_role: 'university_admin',
            action: 'lead_assigned',
            entity: 'leads',
            entity_id: leadId,
            metadata: {
                assigned_to: agentId,
                agent_name: agent.display_name,
                previous_agent: lead.assigned_agent_id ?? null,
            }
        })

        return NextResponse.json({ success: true, agentName: agent.display_name })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 })
    }
}
