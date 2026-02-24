import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy', {
    apiVersion: '2026-01-28.clover', // Update to match the installed @types/stripe requirement
})

// Map plan names to Stripe Price IDs (set these in your Stripe dashboard)
const PLAN_PRICE_MAP: Record<string, string> = {
    basic: process.env.STRIPE_PRICE_BASIC!,
    premium: process.env.STRIPE_PRICE_PREMIUM!,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE!,
}

export async function POST(req: Request) {
    try {
        const { plan = 'premium', university_id } = await req.json()

        if (!PLAN_PRICE_MAP[plan]) {
            return NextResponse.json({ error: `Unknown plan: ${plan}` }, { status: 400 })
        }

        // Auth
        const supabaseUser = await createServerClient()
        const { data: authData, error: authError } = await supabaseUser.auth.getUser()
        if (authError || !authData?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        // Fetch university for this user
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role, university_id')
            .eq('id', authData.user.id)
            .single()

        const uniId = (profile?.role === 'super_admin' ? university_id : profile?.university_id) as string

        if (!uniId) {
            return NextResponse.json({ error: 'No university context found' }, { status: 400 })
        }

        const { data: uni } = await supabaseAdmin
            .from('universities')
            .select('id, name, stripe_customer_id')
            .eq('id', uniId)
            .single()

        if (!uni) {
            return NextResponse.json({ error: 'University not found' }, { status: 404 })
        }

        // Get or create Stripe customer
        let customerId = uni.stripe_customer_id
        if (!customerId) {
            const customer = await stripe.customers.create({
                name: uni.name,
                metadata: { university_id: uniId },
            })
            customerId = customer.id
            await supabaseAdmin.from('universities').update({ stripe_customer_id: customerId }).eq('id', uniId)
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: PLAN_PRICE_MAP[plan], quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/u/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/u/billing?cancelled=true`,
            metadata: { university_id: uniId, plan },
        })

        return NextResponse.json({ url: session.url })

    } catch (e: any) {
        console.error('Stripe checkout error:', e)
        return NextResponse.json({ error: e.message || 'Checkout failed' }, { status: 500 })
    }
}
