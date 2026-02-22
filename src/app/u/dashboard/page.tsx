"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import {
    Users,
    TrendingUp,
    BarChart3,
    MessageSquare,
    ArrowUpRight,
    KanbanSquare,
} from "lucide-react"

function KPICard({ title, value, description, icon, trend, trendUp, loading }: any) {
    if (loading) return (
        <Card className="rounded-xl border-slate-200">
            <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-3 w-32" /></CardContent>
        </Card>
    )
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

export default function TenantAdminDashboardPage() {
    const [stats, setStats] = useState({ leads: 0, agents: 0, messages: 0, forms: 0 })
    const [loading, setLoading] = useState(true)
    const [recentLeads, setRecentLeads] = useState<any[]>([])
    const [universityId, setUniversityId] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
            if (!profile?.university_id) return
            const uid = profile.university_id
            setUniversityId(uid)

            const [{ count: leadsCount }, { count: agentsCount }, { count: formsCount }, { data: recent }] = await Promise.all([
                supabase.from("leads").select("*", { count: "exact", head: true }).eq("university_id", uid),
                supabase.from("agents").select("*", { count: "exact", head: true }).eq("university_id", uid),
                supabase.from("forms").select("*", { count: "exact", head: true }).eq("university_id", uid),
                supabase.from("leads").select("id, first_name, last_name, email, created_at").eq("university_id", uid).order("created_at", { ascending: false }).limit(5),
            ])

            setStats({ leads: leadsCount ?? 0, agents: agentsCount ?? 0, messages: 0, forms: formsCount ?? 0 })
            setRecentLeads(recent ?? [])
            setLoading(false)
        }
        fetchData()
    }, [])

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Tenant Dashboard</h1>
                <p className="text-slate-500 mt-1">Overview of your university's pipeline and admissions activity.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard loading={loading} title="Total Leads" value={stats.leads} description="All time applications" icon={<Users className="h-5 w-5" />} trend="+12 this week" trendUp />
                <KPICard loading={loading} title="Active Agents" value={stats.agents} description="Staff provisioned" icon={<BarChart3 className="h-5 w-5" />} />
                <KPICard loading={loading} title="Active Forms" value={stats.forms} description="Public intake pages" icon={<TrendingUp className="h-5 w-5" />} />
                <KPICard loading={loading} title="Messages Sent" value={stats.messages} description="Email + WhatsApp" icon={<MessageSquare className="h-5 w-5" />} trend="Integrations ready" trendUp />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Recent Leads</CardTitle>
                        <CardDescription>Most recently submitted applications from intake forms.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : recentLeads.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No leads yet. <a href="/u/forms" className="text-primary underline">Create a form to start capturing →</a></p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentLeads.map((lead) => (
                                    <div key={lead.id} className="py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                                                {lead.first_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                                                <p className="text-xs text-slate-500">{lead.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200">New</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
                        <CardDescription>Commonly used administration shortcuts.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: "Invite Agent", href: "/u/agents", icon: <Users className="h-4 w-4" /> },
                                { label: "Create Form", href: "/u/forms", icon: <TrendingUp className="h-4 w-4" /> },
                                { label: "View Pipeline", href: "/u/kanban", icon: <KanbanSquare className="h-4 w-4" /> },
                                { label: "Comms Settings", href: "/u/communication", icon: <MessageSquare className="h-4 w-4" /> },
                            ].map((action) => (
                                <a key={action.href} href={action.href} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary/30 text-sm font-medium text-slate-700 hover:text-primary transition-all">
                                    {action.icon}
                                    {action.label}
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
