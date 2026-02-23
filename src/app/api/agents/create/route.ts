import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        let { name, email, phone, password, mode, university_id: bodyUniversityId } = body

        if (!email || !name) {
            return NextResponse.json({ error: "Name and Email are required" }, { status: 400 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        // Authenticate requestor via secure Server Client
        const supabaseUser = await createServerClient()
        const { data: authData, error: authError } = await supabaseUser.auth.getUser()

        if (authError || !authData?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
        const { data: requestorProfile } = await supabaseAdmin
            .from('profiles')
            .select('role, university_id')
            .eq('id', authData.user.id)
            .single()

        if (!requestorProfile || !['university_admin', 'super_admin'].includes(requestorProfile.role)) {
            return NextResponse.json({ error: "Forbidden: Not allowed to provision agents" }, { status: 403 })
        }

        // ─── Resolve university_id ───────────────────────────────────────────
        let uniId: string | null = null

        if (requestorProfile.role === 'super_admin') {
            // Super admin MUST explicitly pass university_id in the body
            if (!bodyUniversityId) {
                return NextResponse.json(
                    { error: "university_id is required when a Super Admin creates an agent" },
                    { status: 400 }
                )
            }
            // Verify the university exists
            const { data: uni, error: uniError } = await supabaseAdmin
                .from('universities')
                .select('id')
                .eq('id', bodyUniversityId)
                .single()

            if (uniError || !uni) {
                return NextResponse.json({ error: "Invalid university_id: university not found" }, { status: 400 })
            }
            uniId = bodyUniversityId
        } else {
            // University admin uses their own university
            uniId = requestorProfile.university_id
        }

        if (!uniId) {
            return NextResponse.json({ error: "Could not determine university for this agent" }, { status: 400 })
        }

        // ─── Validate password for manual mode ──────────────────────────────
        if (mode === 'manual' && (!password || password.trim().length < 6)) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
        }

        // ─── Create auth user ────────────────────────────────────────────────
        let newUserData, createError;

        if (mode === 'invite') {
            const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email.trim(), {
                redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '')}/agent/dashboard`,
                data: { name: name.trim() }
            });
            newUserData = data;
            createError = error;
        } else {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: email.trim(),
                password: password,
                email_confirm: true,
                user_metadata: { name: name.trim() }
            });
            newUserData = data;
            createError = error;
        }

        if (createError) {
            if (createError.message.toLowerCase().includes("already registered")) {
                return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 })
            }
            throw createError
        }

        const userId = newUserData?.user?.id

        if (!userId) {
            return NextResponse.json({ error: "Failed to obtain user ID from Auth service." }, { status: 500 })
        }

        // ─── Upsert Profile (trigger may have already created it) ───────────
        await supabaseAdmin.from('profiles').upsert({
            id: userId,
            email: email.trim(),
            role: 'agent',
            university_id: uniId
        }, { onConflict: 'id' })

        // ─── Generate unique public_slug ─────────────────────────────────────
        const baseSlug = name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
        const shortId = Math.random().toString(36).slice(2, 7)
        const publicSlug = `${baseSlug}-${shortId}`

        // ─── Create Agent Record ─────────────────────────────────────────────
        const { error: agentError } = await supabaseAdmin.from('agents').insert({
            user_id: userId,
            display_name: name.trim(),
            university_id: uniId,
            phone: phone ? phone.trim() : null,
            active: true,
            public_slug: publicSlug,
            // Store plain-text password so admin can retrieve it later (manual mode only)
            ...(mode === 'manual' && password ? { last_known_password: password } : {}),
        })


        if (agentError) {
            console.error("Agent row insert error:", agentError)
            throw new Error(`Agent record error: ${agentError.message}`)
        }

        // ─── Write Audit Log ─────────────────────────────────────────────────
        await supabaseAdmin.from('audit_logs').insert({
            actor_id: authData.user.id,
            university_id: uniId,
            action: 'agent_created',
            details: `Provisioned agent "${name.trim()}" (${email.trim()}) via ${mode === 'invite' ? 'email invite' : 'manual password'}`,
        }).then(() => { }) // fire and forget — don't fail the whole request for a log write

        return NextResponse.json({
            success: true,
            message: mode === 'invite'
                ? "Invite email sent. Agent account will activate when they accept."
                : "Agent account created. They can log in immediately.",
            userId
        })

    } catch (e: any) {
        console.error("Agent creation error:", e)
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
