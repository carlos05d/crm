import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { email } = await req.json()

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // We MUST use the service role key to resend an admin invitation
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Resend the invite using the admin API
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mustaphakharacha.bilaldemenagement.com'}/verify-invite`
        })

        if (error) {
            console.error("Supabase resend invite error:", error)
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, message: "Invitation code resent successfully" })
    } catch (e: any) {
        console.error("Resend invite handler error:", e)
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 })
    }
}
