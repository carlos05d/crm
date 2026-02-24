import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const stageSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required").max(50),
    color: z.string().min(1),
    position: z.number().int().min(0)
})

const bulkUpdateSchema = z.object({
    stages: z.array(stageSchema),
    deleted_ids: z.array(z.string().uuid())
})

// Use service role for admin operations bypassing RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'
)

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { }
                    }
                }
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabaseAdmin.from("profiles").select("university_id, role").eq("id", user.id).single()
        if (!profile?.university_id || profile.role !== "university_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { data: stages, error } = await supabaseAdmin
            .from("kanban_stages")
            .select("*")
            .eq("university_id", profile.university_id)
            .order("position", { ascending: true })

        if (error) throw error
        return NextResponse.json({ stages })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch { }
                    }
                }
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabaseAdmin.from("profiles").select("university_id, role").eq("id", user.id).single()
        if (!profile?.university_id || profile.role !== "university_admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const parsed = bulkUpdateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid payload", details: parsed.error.issues }, { status: 400 })
        }

        const { stages, deleted_ids } = parsed.data
        const uniId = profile.university_id

        // 1. Handle Deletions
        if (deleted_ids.length > 0) {
            // First check if any leads are in these stages
            const { count, error: countError } = await supabaseAdmin
                .from("leads")
                .select("*", { count: "exact", head: true })
                .in("stage_id", deleted_ids)

            if (count && count > 0) {
                return NextResponse.json({
                    error: `Cannot delete stage(s) because there are ${count} lead(s) currently assigned to them. Please move the leads first.`
                }, { status: 400 })
            }

            const { error: deleteError } = await supabaseAdmin
                .from("kanban_stages")
                .delete()
                .in("id", deleted_ids)
                .eq("university_id", uniId) // security check

            if (deleteError) throw deleteError
        }

        // 2. Handle Upserts (Updates + Inserts)
        const toUpsert = stages.map(st => ({
            id: st.id, // if undefined, Supabase generates one (or we let the DB default it if we omit it)
            university_id: uniId,
            name: st.name,
            color: st.color,
            position: st.position,
            // Keep existing fields
        }))

        // We separate into new vs existing because missing ID for insert needs to be omitted to hit the default
        const toInsert = []
        for (const st of stages) {
            if (!st.id || st.id.startsWith("temp-")) {
                toInsert.push({
                    university_id: uniId,
                    name: st.name,
                    color: st.color,
                    position: st.position
                })
            } else {
                // Update existing
                const { error: updateError } = await supabaseAdmin
                    .from("kanban_stages")
                    .update({ name: st.name, color: st.color, position: st.position })
                    .eq("id", st.id)
                    .eq("university_id", uniId)
                if (updateError) throw updateError
            }
        }

        if (toInsert.length > 0) {
            const { error: insertError } = await supabaseAdmin.from("kanban_stages").insert(toInsert)
            if (insertError) throw insertError
        }

        // Fetch refreshed stages to return
        const { data: freshStages, error: fetchError } = await supabaseAdmin
            .from("kanban_stages")
            .select("*")
            .eq("university_id", uniId)
            .order("position", { ascending: true })

        if (fetchError) throw fetchError

        return NextResponse.json({ stages: freshStages })

    } catch (error: any) {
        console.error("PUT /api/u/settings/stages ERRROR:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
