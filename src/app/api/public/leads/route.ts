import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// ── Zod validation schema ──────────────────────────────────
const LeadSchema = z.object({
    first_name: z.string().min(1).max(80),
    last_name: z.string().min(1).max(80),
    email: z.string().email(),
    phone: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    message: z.string().max(1000).optional(),
    program_interest: z.string().optional(), // program_id or label
    agent_slug: z.string().min(1),
    // UTM parameters
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_content: z.string().optional(),
    ref_url: z.string().optional(),
    // Honeypot: must be empty or absent
    _hp_name: z.string().optional(),
})

// ── Simple in-memory rate limiter ──────────────────────────
// (For production use Redis or Supabase rate-limit table)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

function checkRateLimit(ip: string): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
        return true
    }
    if (entry.count >= RATE_LIMIT) return false
    entry.count++
    return true
}

export async function POST(req: NextRequest) {
    try {
        // ── IP rate limiting ───────────────────────────────
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
        if (!checkRateLimit(ip)) {
            return NextResponse.json({ error: 'Too many submissions. Please try again in 1 hour.' }, { status: 429 })
        }

        const body = await req.json()

        // ── Honeypot check ─────────────────────────────────
        if (body._hp_name && body._hp_name.trim() !== '') {
            // Bot detected — silently succeed to not reveal detection
            return NextResponse.json({ success: true, trackingId: 'bot' })
        }

        // ── Validation ─────────────────────────────────────
        const parsed = LeadSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid form data.', details: parsed.error.flatten() }, { status: 400 })
        }
        const data = parsed.data

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // ── Lookup agent by public_slug ────────────────────
        const { data: agent, error: agentErr } = await supabaseAdmin
            .from('agents')
            .select('user_id, display_name, university_id')
            .eq('public_slug', data.agent_slug)
            .eq('active', true)
            .single()

        if (agentErr || !agent) {
            return NextResponse.json({ error: 'Invalid agent link. Please contact the institution.' }, { status: 404 })
        }

        // ── Fetch first kanban stage for tenant ────────────
        const { data: firstStage } = await supabaseAdmin
            .from('kanban_stages')
            .select('id')
            .eq('university_id', agent.university_id)
            .order('position', { ascending: true })
            .limit(1)
            .single()

        // ── Resolve program_id if provided ─────────────────
        let programId: string | null = null
        if (data.program_interest) {
            const { data: prog } = await supabaseAdmin
                .from('programs')
                .select('id')
                .eq('university_id', agent.university_id)
                .eq('id', data.program_interest)
                .single()
            if (prog) programId = prog.id
        }

        // ── Create lead_source record ──────────────────────
        const { data: leadSource, error: lsErr } = await supabaseAdmin
            .from('lead_sources')
            .insert({
                university_id: agent.university_id,
                type: 'agent_landing',
                agent_id: agent.user_id,
                utm_source: data.utm_source || null,
                utm_medium: data.utm_medium || null,
                utm_campaign: data.utm_campaign || null,
                utm_content: data.utm_content || null,
                ref_url: data.ref_url || null,
            })
            .select('id')
            .single()

        if (lsErr) console.error('lead_source insert error:', lsErr)

        // ── Insert the lead ────────────────────────────────
        const { data: newLead, error: leadErr } = await supabaseAdmin
            .from('leads')
            .insert({
                university_id: agent.university_id,
                assigned_agent_id: agent.user_id,
                stage_id: firstStage?.id ?? null,
                first_name: data.first_name,
                last_name: data.last_name,
                email: data.email,
                phone: data.phone || null,
                country: data.country || null,
                city: data.city || null,
                notes: data.message || null,
                program_id: programId,
                source: 'agent_landing',
                source_type: 'agent_landing',
                source_label: `Agent: ${agent.display_name}`,
                lead_source_id: leadSource?.id ?? null,
                score: 0,
            })
            .select('id')
            .single()

        if (leadErr) {
            console.error('Lead insert error:', leadErr)
            return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 })
        }

        // ── Audit log ──────────────────────────────────────
        await supabaseAdmin.from('audit_logs').insert({
            university_id: agent.university_id,
            actor_id: null, // public submission
            actor_role: 'public',
            action: 'lead_created_via_landing',
            entity: 'leads',
            entity_id: newLead.id,
            metadata: {
                agent_id: agent.user_id,
                agent_slug: data.agent_slug,
                source_type: 'agent_landing',
                ip,
            }
        })

        return NextResponse.json({ success: true, trackingId: newLead.id })

    } catch (e: any) {
        console.error('Public lead creation error:', e)
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
    }
}
