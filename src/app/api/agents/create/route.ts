import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        let { name, email, phone, password } = body

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

        // Must be university_admin or super_admin
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
        const { data: requestorProfile } = await supabaseAdmin.from('profiles').select('role, university_id').eq('id', authData.user.id).single()

        if (!requestorProfile || !['university_admin', 'super_admin'].includes(requestorProfile.role)) {
            return NextResponse.json({ error: "Forbidden: Not allowed to provision agents" }, { status: 403 })
        }

        const uniId = requestorProfile.university_id
        if (!uniId && requestorProfile.role !== 'super_admin') {
            return NextResponse.json({ error: "No university assigned to your account" }, { status: 400 })
        }

        // Generate a random password if not provided (so we can at least create the account immediately)
        const tempPassword = password || Array(16).fill(0).map(() => Math.random().toString(36).charAt(2)).join('')

        // Create the user in Auth
        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: tempPassword,
            email_confirm: true,
            user_metadata: { name: name.trim() }
        })

        if (createError) {
            if (createError.message.includes("already registered")) {
                return NextResponse.json({ error: "User with this email already exists." }, { status: 400 })
            }
            throw createError
        }

        const userId = newUserData.user.id

        // Create Profile
        await supabaseAdmin.from('profiles').insert({
            id: userId,
            email: email.trim(),
            role: 'agent',
            university_id: uniId
        })

        // Create Agent Record
        await supabaseAdmin.from('agents').insert({
            user_id: userId,
            display_name: name.trim(),
            university_id: uniId,
            phone: phone ? phone.trim() : null,
            active: true
        })

        return NextResponse.json({ success: true, message: "Agent provisioned successfully.", userId })

    } catch (e: any) {
        console.error("Agent creation error:", e)
        return NextResponse.json({ error: e.message || "Internal Server Error" }, { status: 500 })
    }
}
