"use client"

import React, { useState, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Loader2, Zap, Building2, Rocket } from "lucide-react"
import { useSearchParams } from "next/navigation"

const PLANS = [
    {
        key: "basic",
        name: "Basic",
        price: "$0",
        period: "/month",
        description: "For small teams getting started",
        icon: Building2,
        color: "border-slate-200",
        badgeClass: "bg-slate-100 text-slate-700",
        features: ["Up to 3 Agents", "500 Leads", "Basic Kanban", "Email Support"],
    },
    {
        key: "premium",
        name: "Premium",
        price: "$299",
        period: "/month",
        description: "For growing universities",
        icon: Zap,
        color: "border-primary ring-2 ring-primary/20",
        badgeClass: "bg-primary/10 text-primary",
        features: ["Unlimited Agents", "5,000 Leads", "Advanced Kanban + Analytics", "WhatsApp + Email Comms", "Priority Support"],
        popular: true,
    },
    {
        key: "enterprise",
        name: "Enterprise",
        price: "$899",
        period: "/month",
        description: "For large institutions",
        icon: Rocket,
        color: "border-slate-200",
        badgeClass: "bg-purple-100 text-purple-700",
        features: ["Unlimited Everything", "Dedicated Instance", "Custom Branding", "SLA + Dedicated Manager", "API Access"],
    },
]

function BillingContent() {
    const [loading, setLoading] = useState<string | null>(null)
    const params = useSearchParams()
    const success = params.get('success')
    const cancelled = params.get('cancelled')

    const handleUpgrade = async (plan: string) => {
        setLoading(plan)
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            if (data.url) window.location.href = data.url
        } catch (e: any) {
            alert(`Checkout error: ${e.message}`)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-6 font-sans max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Subscription & Billing</h2>
                <p className="text-slate-500 mt-1">Manage your university's plan and billing information.</p>
            </div>

            {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Subscription activated successfully!</p>
                        <p className="text-sm">Your plan is now active. All features are unlocked.</p>
                    </div>
                </div>
            )}

            {cancelled && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
                    <p className="font-semibold">Checkout cancelled.</p>
                    <p className="text-sm">No charges were made. You can upgrade anytime.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map(plan => (
                    <Card key={plan.key} className={`rounded-xl relative ${plan.color}`}>
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge className="bg-primary text-white px-3 py-0.5 text-xs font-bold shadow-sm">
                                    Most Popular
                                </Badge>
                            </div>
                        )}
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${plan.badgeClass}`}>{plan.name}</span>
                                <plan.icon className="h-5 w-5 text-slate-400" />
                            </div>
                            <CardTitle className="text-3xl font-heading">
                                {plan.price}
                                <span className="text-sm font-normal text-slate-500">{plan.period}</span>
                            </CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className="w-full"
                                variant={plan.popular ? "default" : "outline"}
                                disabled={loading !== null || plan.key === 'basic'}
                                onClick={() => plan.key !== 'basic' && handleUpgrade(plan.key)}
                            >
                                {loading === plan.key && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {plan.key === 'basic' ? 'Current Free Plan' : `Upgrade to ${plan.name}`}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default function BillingPage() {
    return (
        <Suspense fallback={<div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <BillingContent />
        </Suspense>
    )
}
