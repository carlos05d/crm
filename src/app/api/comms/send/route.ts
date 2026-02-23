import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { channel, to, subject, content, lead_id } = body

        if (!channel || !to || !content) {
            return NextResponse.json({ error: "channel, to, and content are required" }, { status: 400 })
        }

        // Authenticate caller
        const supabaseUser = await createServerClient()
        const { data: authData, error: authError } = await supabaseUser.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        // Get caller profile for university_id
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, university_id')
            .eq('id', authData.user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 403 })
        }

        let status = 'sent'
        let errorMsg: string | null = null

        // ─── Email via Resend ────────────────────────────────────────────────
        if (channel === 'email') {
            const resendApiKey = process.env.RESEND_API_KEY

            if (!resendApiKey) {
                return NextResponse.json(
                    { error: "Email not configured. Set RESEND_API_KEY environment variable." },
                    { status: 503 }
                )
            }

            if (!subject) {
                return NextResponse.json({ error: "Subject is required for email" }, { status: 400 })
            }

            const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@updates.yourdomain.com'

            const emailRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: [to],
                    subject,
                    html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <p>${content.replace(/\n/g, '<br>')}</p>
                    </div>`,
                }),
            })

            if (!emailRes.ok) {
                const errBody = await emailRes.json()
                errorMsg = errBody?.message || 'Email delivery failed'
                status = 'failed'
            } else {
                status = 'delivered'
            }
        }

        // ─── WhatsApp via Meta Cloud API ─────────────────────────────────────
        else if (channel === 'whatsapp') {
            const waToken = process.env.META_WHATSAPP_TOKEN
            const phoneNumberId = process.env.META_PHONE_NUMBER_ID

            if (!waToken || !phoneNumberId) {
                return NextResponse.json(
                    { error: "WhatsApp not configured. Set META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID." },
                    { status: 503 }
                )
            }

            // Strip non-digits, ensure E.164 format
            const toPhone = to.replace(/\D/g, '')

            const waRes = await fetch(
                `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${waToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: toPhone,
                        type: 'text',
                        text: { body: content },
                    }),
                }
            )

            if (!waRes.ok) {
                const errBody = await waRes.json()
                errorMsg = errBody?.error?.message || 'WhatsApp delivery failed'
                status = 'failed'
            } else {
                status = 'delivered'
            }
        } else {
            return NextResponse.json({ error: `Unknown channel: ${channel}` }, { status: 400 })
        }

        // ─── Log to messages table ───────────────────────────────────────────
        await supabaseAdmin.from('messages').insert({
            lead_id: lead_id || null,
            university_id: profile.university_id,
            sent_by: authData.user.id,
            channel,
            recipient: to,
            subject: subject || null,
            body: content,
            status,
            error: errorMsg,
        })

        if (status === 'failed') {
            return NextResponse.json({ error: errorMsg || 'Delivery failed' }, { status: 502 })
        }

        return NextResponse.json({ success: true, status })

    } catch (e: any) {
        console.error("Comms send error:", e)
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
