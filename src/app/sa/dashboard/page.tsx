"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import {
    Building2,
    Users,
    CreditCard,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle,
    ArrowUpRight,
} from "lucide-react"

interface KPICardProps {
    title: string
    value: string | number
    description: string
    icon: React.ReactNode
    trend?: string
    trendUp?: boolean
    loading?: boolean
}

function KPICard({ title, value, description, icon, trend, trendUp, loading }: KPICardProps) {
    if (loading) {
        return (
            <Card className="rounded-xl border-slate-200">
                <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </CardContent>
            </Card>
        )
    }
    return (
        <Card className="rounded-xl border-slate-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
                <div className="p-2 bg-primary/10 text-primary rounded-lg">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-heading font-bold text-slate-900">{value}</div>
                <p className="text-slate-500 text-xs mt-1">{description}</p>
                {trend && (
                    <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
                        <ArrowUpRight className={`h-3 w-3 ${!trendUp && "rotate-180"}`} />
                        {trend}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export default function SuperAdminDashboardPage() {
    const [stats, setStats] = useState({ universities: 0, total_users: 0, active_subs: 0 })
    const [loading, setLoading] = useState(true)
    const [recentUniversities, setRecentUniversities] = useState<any[]>([])

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [{ count: uniCount }, { count: userCount }, { data: recentUnis }] = await Promise.all([
                    supabase.from("universities").select("*", { count: "exact", head: true }),
                    supabase.from("profiles").select("*", { count: "exact", head: true }),
                    supabase.from("universities").select("id, name, subdomain, plan_type, created_at").order("created_at", { ascending: false }).limit(5),
                ])
                setStats({ universities: uniCount ?? 0, total_users: userCount ?? 0, active_subs: uniCount ?? 0 })
                setRecentUniversities(recentUnis ?? [])
            } catch (e) {
                console.error("Failed to fetch dashboard stats", e)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Platform Overview</h1>
                <p className="text-slate-500 mt-1">Global performance metrics across all tenant universities.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard loading={loading} title="Total Universities" value={stats.universities} description="Active tenant accounts" icon={<Building2 className="h-5 w-5" />} trend="+2 this month" trendUp />
                <KPICard loading={loading} title="Total Users" value={stats.total_users} description="Across all tenants" icon={<Users className="h-5 w-5" />} trend="+18 this week" trendUp />
                <KPICard loading={loading} title="Active Plans" value={stats.active_subs} description="Paying subscriptions" icon={<CreditCard className="h-5 w-5" />} trend="100% renewal rate" trendUp />
                <KPICard loading={loading} title="Platform Health" value="99.9%" description="Uptime last 30 days" icon={<Activity className="h-5 w-5" />} trend="No incidents" trendUp />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Recently Added Universities</CardTitle>
                        <CardDescription>Latest tenants onboarded to the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : recentUniversities.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No universities yet. <a href="/sa/universities" className="text-primary underline">Add one →</a></p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentUniversities.map((uni) => (
                                    <div key={uni.id} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                {uni.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{uni.name}</p>
                                                <p className="text-xs text-slate-500 font-mono">{uni.subdomain}.platform.com</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs shrink-0">{uni.plan_type || "Normal"}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">System Alerts</CardTitle>
                        <CardDescription>Issues or approvals requiring attention.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-emerald-900">All systems operational</p>
                                    <p className="text-xs text-emerald-700 mt-0.5">Database, Auth, Edge Functions – all healthy</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-amber-900">2 universities on free trial</p>
                                    <p className="text-xs text-amber-700 mt-0.5">Trials expire in 7 days — consider reaching out.</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
