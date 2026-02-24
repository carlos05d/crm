import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy', {
    apiVersion: '2026-01-28.clover', // Update to match the installed @types/stripe requirement
})

// Stripe requires raw body for signature verification
export async function POST(req: Request) {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err: any) {
        console.error('Stripe webhook signature failed:', err.message)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ─── Handle Events ───────────────────────────────────────────────────────
    switch (event.type) {

        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session
            const uniId = session.metadata?.university_id
            const plan = session.metadata?.plan || 'basic'

            if (uniId && session.subscription) {
                const sub = await stripe.subscriptions.retrieve(session.subscription as string)
                await supabaseAdmin.from('universities').update({
                    stripe_subscription_id: sub.id,
                    stripe_price_id: sub.items.data[0]?.price.id,
                    plan_type: plan,
                    status: 'active',
                    subscription_current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
                }).eq('id', uniId)
            }
            break
        }

        case 'customer.subscription.updated': {
            const sub = event.data.object as Stripe.Subscription
            const { data: unis } = await supabaseAdmin
                .from('universities')
                .select('id')
                .eq('stripe_subscription_id', sub.id)
                .single()

            if (unis) {
                await supabaseAdmin.from('universities').update({
                    status: sub.status === 'active' ? 'active' : 'suspended',
                    subscription_current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
                }).eq('id', unis.id)
            }
            break
        }

        case 'customer.subscription.deleted': {
            const sub = event.data.object as Stripe.Subscription
            const { data: unis } = await supabaseAdmin
                .from('universities')
                .select('id')
                .eq('stripe_subscription_id', sub.id)
                .single()

            if (unis) {
                await supabaseAdmin.from('universities').update({
                    status: 'suspended',
                    stripe_subscription_id: null,
                    stripe_price_id: null,
                }).eq('id', unis.id)
            }
            break
        }

        default:
            // Unhandled event type — just return 200 so Stripe doesn't retry
            break
    }

    return NextResponse.json({ received: true })
}
