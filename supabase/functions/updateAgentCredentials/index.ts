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

    // Caller client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Admin client (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 1. Authenticate caller
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    // 2. Verify caller is a university_admin
    const { data: adminProfile } = await supabase.from('profiles').select('role, university_id').eq('id', user.id).single()
    if (adminProfile?.role !== 'university_admin') throw new Error('Forbidden: university_admin role required')
    if (!adminProfile.university_id) throw new Error('Admin has no university_id')

    const { agentId, email, password } = await req.json()
    if (!agentId) throw new Error('agentId is required')
    if (!email && !password) throw new Error('Nothing to update')

    // 3. Verify target agent belongs to caller's university
    const { data: agentData, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('university_id')
      .eq('user_id', agentId)
      .single()

    if (agentError || !agentData) throw new Error('Agent not found')
    if (agentData.university_id !== adminProfile.university_id) throw new Error('Forbidden: Cannot modify agents outside your university')

    // 4. Update Auth User
    const updateData: any = {}
    if (email) updateData.email = email
    if (password) updateData.password = password

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(agentId, updateData)
    if (authUpdateError) throw authUpdateError

    // 5. Update Profile Email if email was changed
    if (email) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email })
        .eq('id', agentId)
      if (profileError) console.error("Failed to sync profile email:", profileError)
    }

    // 6. Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      university_id: adminProfile.university_id,
      actor_id: user.id,
      actor_role: 'university_admin',
      action: 'agent_credentials_updated',
      entity: 'agents',
      entity_id: agentId,
      metadata: {
        email_changed: !!email,
        password_changed: !!password
      }
    })

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
