import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // Caller client — respects RLS
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })
        // Admin client — bypasses RLS for secure ops
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        // 1. Authenticate and assert caller is university_admin
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const { data: adminProfile } = await supabase.from('profiles').select('role, university_id').eq('id', user.id).single()
        if (adminProfile?.role !== 'university_admin') throw new Error('Forbidden: university_admin role required')
        if (!adminProfile.university_id) throw new Error('Admin has no university_id')

        const { email, name, phone } = await req.json()
        if (!email || !name) throw new Error('email and name are required')

        // 2. Invite user via Auth (sends email invite automatically)
        const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: { full_name: name, role: 'agent', university_id: adminProfile.university_id }
        })
        if (inviteError) throw inviteError

        const newUserId = inviteData.user.id

        // 3. Create/upsert the profile row
        const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
            id: newUserId,
            email,
            first_name: name.split(' ')[0] ?? name,
            last_name: name.split(' ').slice(1).join(' ') || '',
            role: 'agent',
            university_id: adminProfile.university_id,
            status: 'active',
            created_by: user.id,
        })
        if (profileError) throw profileError

        // 4. Create agent record
        const { error: agentError } = await supabaseAdmin.from('agents').insert({
            user_id: newUserId,
            university_id: adminProfile.university_id,
            display_name: name,
            phone: phone ?? null,
            active: true,
        })
        if (agentError) throw agentError

        // 5. Auto-create default Kanban stages if none exist
        const { data: existingStages } = await supabaseAdmin.from('kanban_stages').select('id').eq('university_id', adminProfile.university_id).limit(1)
        if (!existingStages || existingStages.length === 0) {
            const defaultStages = ['New', 'Contacted', 'Qualified', 'Admitted', 'Rejected']
            await supabaseAdmin.from('kanban_stages').insert(
                defaultStages.map((name, i) => ({ university_id: adminProfile.university_id, name, position: i }))
            )
        }

        // 6. Write to audit_logs
        await supabaseAdmin.from('audit_logs').insert({
            university_id: adminProfile.university_id,
            actor_id: user.id,
            actor_role: 'university_admin',
            action: 'agent_provisioned',
            entity: 'agents',
            entity_id: newUserId,
            metadata: { email, name, phone }
        })

        return new Response(
            JSON.stringify({ success: true, agentId: newUserId }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
