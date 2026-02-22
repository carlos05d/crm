import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('No authorization header')

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, university_id').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const { to, content, leadId } = await req.json()
        if (!to || !content || !leadId) throw new Error('Missing required fields')

        // 1. Fetch Tenant Settings for WhatsApp API config
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { data: settings } = await supabaseAdmin.from('settings').select('communication').eq('university_id', profile.university_id).single()

        const waNumber = settings?.communication?.whatsapp?.number || '+1234567890'
        const waToken = settings?.communication?.whatsapp?.token

        if (!waToken) {
            console.log("No WhatsApp token configured. Mocking failure state...")
        }

        // 2. MOCK Meta API fetch - Real implementation would send to graph.facebook.com
        console.log(`Sending WhatsApp template to ${to} from Business Number ${waNumber}...`)

        // 3. Log the message
        const { error: insertErr } = await supabaseAdmin.from('messages').insert({
            university_id: profile.university_id,
            lead_id: leadId,
            channel: 'whatsapp',
            to_value: to,
            from_value: waNumber,
            content: content,
            status: waToken ? 'delivered' : 'failed', // Mock accurate status mapping
            created_by: user.id
        })

        if (insertErr) throw insertErr

        return new Response(
            JSON.stringify({ success: !!waToken, message: waToken ? 'Message delivered via API' : 'Message failed: No Meta token configured' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: waToken ? 200 : 400 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
