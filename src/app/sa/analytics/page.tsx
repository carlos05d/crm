"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Users, Target, BookOpen, UserCheck, TrendingUp, Loader2 } from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [metrics, setMetrics] = useState({
        totalUniversities: 0,
        totalLeads: 0,
        totalAgents: 0,
        totalPrograms: 0,
        activeForms: 0,
    })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Fetch aggregate counts in parallel
                const [
                    { count: uniCount },
                    { count: leadCount },
                    { count: agentCount },
                    { count: progCount },
                    { count: formCount }
                ] = await Promise.all([
                    supabase.from('universities').select('*', { count: 'exact', head: true }),
                    supabase.from('leads').select('*', { count: 'exact', head: true }),
                    supabase.from('agents').select('*', { count: 'exact', head: true }),
                    supabase.from('programs').select('*', { count: 'exact', head: true }),
                    supabase.from('forms').select('*', { count: 'exact', head: true }).eq('active', true)
                ])

                setMetrics({
                    totalUniversities: uniCount || 0,
                    totalLeads: leadCount || 0,
                    totalAgents: agentCount || 0,
                    totalPrograms: progCount || 0,
                    activeForms: formCount || 0,
                })
            } catch (error) {
                console.error("Failed to load metrics", error)
            } finally {
                setLoading(false)
            }
        }

        fetchMetrics()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Loading global platform metrics...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 font-sans">
            <div>
                <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Platform Analytics</h2>
                <p className="text-slate-500 mt-1">Global statistics overview across all onboarded institutions.</p>
            </div>

            {/* Top Level KPIs */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Tenants</CardTitle>
                        <Building2 className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold font-heading text-slate-900">{metrics.totalUniversities}</div>
                        <p className="text-xs text-emerald-600 font-medium flex items-center mt-2">
                            <TrendingUp className="h-3 w-3 mr-1" /> Active institutions
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                        <CardTitle className="text-sm font-medium text-slate-600">Global Leads</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold font-heading text-slate-900">{metrics.totalLeads}</div>
                        <p className="text-xs text-slate-500 mt-2">Captured across {metrics.activeForms} active forms</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                        <CardTitle className="text-sm font-medium text-slate-600">Global Agents</CardTitle>
                        <UserCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold font-heading text-slate-900">{metrics.totalAgents}</div>
                        <p className="text-xs text-slate-500 mt-2">Provisioned staff accounts</p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 rounded-t-xl border-b border-slate-100">
                        <CardTitle className="text-sm font-medium text-slate-600">Global Programs</CardTitle>
                        <BookOpen className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-3xl font-bold font-heading text-slate-900">{metrics.totalPrograms}</div>
                        <p className="text-xs text-slate-500 mt-2">Registered academic courses</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-slate-200 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                        <Target className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Lead Volume History</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-2">
                        Install Recharts library to view deeply interactive historical graphs of lead generation per month across the global catalog.
                    </p>
                </Card>
                <Card className="border-slate-200 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                        <TrendingUp className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Tenant Growth Rate</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-2">
                        Observe Month-over-Month onboarding comparisons to track SaaS expansion goals. Requires advanced charting libraries.
                    </p>
                </Card>
            </div>
        </div>
    )
}
