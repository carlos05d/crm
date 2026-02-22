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

        // Create client with the caller's JWT to respect RLS automatically
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        const { data: profile } = await supabase.from('profiles').select('role, university_id').eq('id', user.id).single()
        if (!profile) throw new Error('Profile not found')

        const { to, subject, content, leadId } = await req.json()
        if (!to || !content || !leadId) throw new Error('Missing required fields')

        // 1. Fetch Tenant Settings for SMTP Info
        // Supabase Service Role needed to bypass RLS if settings are restricted to Admins only
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

        const { data: settings } = await supabaseAdmin.from('settings').select('communication, allow_agent_custom_sender_email').eq('university_id', profile.university_id).single()

        const senderConfig = settings?.communication?.email || 'noreply@tenant.edu'

        // 2. MOCK SMTP SEND - In a real app we would use Resend/SendGrid/Nodemailer here
        console.log(`Sending email to ${to} from ${senderConfig} via external SMTP layer...`)

        // 3. Log the outbound message to the database
        const { error: insertErr } = await supabaseAdmin.from('messages').insert({
            university_id: profile.university_id,
            lead_id: leadId,
            channel: 'email',
            to_value: to,
            from_value: senderConfig,
            content: `Subject: ${subject}\n\n${content}`,
            status: 'sent',
            created_by: user.id
        })

        if (insertErr) throw insertErr

        return new Response(
            JSON.stringify({ success: true, message: 'Email sent and logged' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
