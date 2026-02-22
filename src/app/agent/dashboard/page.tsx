"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import {
    Users,
    MessageSquare,
    Target,
    Clock,
    ArrowUpRight,
    CheckCircle2,
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

export default function AgentDashboardPage() {
    const [stats, setStats] = useState({ myLeads: 0, contacted: 0, qualified: 0, admitted: 0 })
    const [loading, setLoading] = useState(true)
    const [myLeads, setMyLeads] = useState<any[]>([])
    const [agentName, setAgentName] = useState("Agent")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from("profiles").select("university_id, first_name").eq("id", user.id).single()
            if (!profile) return
            if (profile.first_name) setAgentName(profile.first_name)

            // Fetch leads assigned to this agent (RLS will auto-filter by scope setting)
            const [{ count: myLeadsCount }, { data: recent }] = await Promise.all([
                supabase.from("leads").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("assigned_agent_id", user.id),
                supabase.from("leads").select("id, first_name, last_name, email, created_at").eq("university_id", profile.university_id).order("created_at", { ascending: false }).limit(6),
            ])

            setStats({ myLeads: myLeadsCount ?? 0, contacted: 0, qualified: 0, admitted: 0 })
            setMyLeads(recent ?? [])
            setLoading(false)
        }
        fetchData()
    }, [])

    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

    return (
        <div className="space-y-8">
            <div>
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{today}</p>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight mt-1">Welcome back, {agentName} 👋</h1>
                <p className="text-slate-500 mt-1">Here's a snapshot of your pipeline activity.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard loading={loading} title="My Assigned Leads" value={stats.myLeads} description="In your pipeline" icon={<Users className="h-5 w-5" />} />
                <KPICard loading={loading} title="Follow-ups Due" value="3" description="Overdue by >3 days" icon={<Clock className="h-5 w-5" />} trend="Action needed" trendUp={false} />
                <KPICard loading={loading} title="Qualified This Month" value={stats.qualified} description="Ready for admission" icon={<Target className="h-5 w-5" />} trend="Keep it up!" trendUp />
                <KPICard loading={loading} title="Messages Sent" value={stats.contacted} description="This month" icon={<MessageSquare className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card className="rounded-xl border-slate-200 lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">My Lead Pipeline</CardTitle>
                        <CardDescription>Recent leads assigned to you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : myLeads.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No leads assigned yet. Check with your admin.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {myLeads.map((lead) => (
                                    <div key={lead.id} className="py-3 flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm">
                                                {lead.first_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                                                <p className="text-xs text-slate-400">{lead.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-xs bg-sky-50 text-sky-700 border-sky-200 shrink-0">New</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Today's Checklist</CardTitle>
                        <CardDescription>Quick wins to win the day.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { task: "Follow up with 3 cold leads", done: false },
                                { task: "Review new form submissions", done: true },
                                { task: "Send WhatsApp to qualified leads", done: false },
                                { task: "Move 2 leads to Qualified stage", done: false },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-start gap-3 text-sm p-2 rounded-lg ${item.done ? "opacity-50 line-through" : ""}`}>
                                    <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${item.done ? "text-emerald-500" : "text-slate-300"}`} />
                                    <span className="text-slate-700">{item.task}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
