"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts"
import {
    Users, TrendingUp, BarChart3, MessageSquare, ArrowUpRight,
    KanbanSquare, Bell, Globe, CheckCircle2, Clock, UserPlus,
} from "lucide-react"
import Link from "next/link"

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

const TAILWIND_TO_HEX: Record<string, string> = {
    "bg-slate-100 text-slate-700": "#64748b",
    "bg-blue-100 text-blue-700": "#3b82f6",
    "bg-emerald-100 text-emerald-700": "#10b981",
    "bg-amber-100 text-amber-700": "#f59e0b",
    "bg-purple-100 text-purple-700": "#8b5cf6",
    "bg-red-100 text-red-700": "#ef4444",
    "bg-rose-100 text-rose-700": "#f43f5e",
    "bg-orange-100 text-orange-700": "#f97316",
    "bg-cyan-100 text-cyan-700": "#06b6d4"
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

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

// ── Notification item ─────────────────────────────────────────────────────────

function NotifItem({ type, name, source, time, isNew }: {
    type: "new_lead" | "status_change" | "form_submit"
    name: string
    source?: string
    time: string
    isNew?: boolean
}) {
    const icons = {
        new_lead: <UserPlus className="h-4 w-4 text-blue-500" />,
        status_change: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        form_submit: <Globe className="h-4 w-4 text-violet-500" />,
    }
    const messages = {
        new_lead: `New applicant from ${source ?? "landing page"}`,
        status_change: `Lead moved to ${source}`,
        form_submit: `Form submission via ${source}`,
    }
    return (
        <div className={`flex items-start gap-3 py-3 px-3 rounded-lg transition-colors ${isNew ? "bg-blue-50/70 border border-blue-100" : "hover:bg-slate-50"}`}>
            <div className="mt-0.5 p-1.5 bg-white rounded-full border border-slate-100 shadow-sm shrink-0">
                {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                <p className="text-xs text-slate-500">{messages[type]}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />{time}
                </span>
                {isNew && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
            </div>
        </div>
    )
}

// ── Main dashboard ────────────────────────────────────────────────────────────

export default function TenantAdminDashboardPage() {
    const [stats, setStats] = useState({ leads: 0, agents: 0, messages: 0, forms: 0 })
    const [loading, setLoading] = useState(true)
    const [recentLeads, setRecentLeads] = useState<any[]>([])
    const [notifications, setNotifications] = useState<any[]>([])
    const [stageData, setStageData] = useState<any[]>([])
    const [trendData, setTrendData] = useState<any[]>([])
    const [universityId, setUniversityId] = useState<string | null>(null)
    const universityIdRef = useRef<string | null>(null)

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
            universityIdRef.current = uid

            const [
                { count: leadsCount },
                { count: agentsCount },
                { count: formsCount },
                { data: recent },
                { data: allLeads },
                { data: stages },
            ] = await Promise.all([
                supabase.from("leads").select("*", { count: "exact", head: true }).eq("university_id", uid),
                supabase.from("agents").select("*", { count: "exact", head: true }).eq("university_id", uid),
                supabase.from("forms").select("*", { count: "exact", head: true }).eq("university_id", uid),
                supabase.from("leads").select("id, first_name, last_name, email, created_at, status").eq("university_id", uid).order("created_at", { ascending: false }).limit(5),
                supabase.from("leads").select("id, created_at, status").eq("university_id", uid).order("created_at", { ascending: true }),
                supabase.from("kanban_stages").select("name, position, color").eq("university_id", uid).order("position"),
            ])

            setStats({ leads: leadsCount ?? 0, agents: agentsCount ?? 0, messages: 0, forms: formsCount ?? 0 })
            setRecentLeads(recent ?? [])

            // ── Leads by stage (bar chart) ───────────────────────────
            if (allLeads && stages) {
                const stageCounts: Record<string, number> = {}
                stages.forEach(s => { stageCounts[s.name] = 0 })
                allLeads.forEach(l => {
                    if (l.status && stageCounts[l.status] !== undefined) stageCounts[l.status]++
                    else if (l.status) stageCounts[l.status] = (stageCounts[l.status] || 0) + 1
                })
                setStageData(stages.map(s => ({
                    name: s.name,
                    count: stageCounts[s.name] ?? 0,
                    fill: TAILWIND_TO_HEX[s.color] || "#64748b"
                })))
            }

            // ── Leads over last 7 days (area chart) ─────────────────
            if (allLeads) {
                const dayMap: Record<string, number> = {}
                for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    dayMap[d.toLocaleDateString("en-US", { weekday: "short" })] = 0
                }
                allLeads.forEach(l => {
                    const day = new Date(l.created_at).toLocaleDateString("en-US", { weekday: "short" })
                    if (day in dayMap) dayMap[day]++
                })
                setTrendData(Object.entries(dayMap).map(([day, count]) => ({ day, count })))
            }

            // ── Build notifications from recent leads ────────────────
            const notifs = (recent ?? []).map((l: any) => ({
                id: l.id,
                type: "new_lead" as const,
                name: `${l.first_name} ${l.last_name}`,
                source: "intake form",
                time: timeAgo(l.created_at),
                isNew: Date.now() - new Date(l.created_at).getTime() < 3600000, // < 1h
            }))
            setNotifications(notifs)

            setLoading(false)
        }
        fetchData()

        // ── Realtime subscription for new leads ───────────────────────────────
        const channel = supabase
            .channel("realtime-leads")
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "leads",
            }, (payload) => {
                // Only show if for our university
                if (payload.new?.university_id !== universityIdRef.current) return
                setNotifications(prev => [{
                    id: payload.new.id,
                    type: "new_lead" as const,
                    name: `${payload.new.first_name} ${payload.new.last_name}`,
                    source: "landing page",
                    time: "just now",
                    isNew: true,
                }, ...prev].slice(0, 10))
                setStats(s => ({ ...s, leads: s.leads + 1 }))
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">University Dashboard</h1>
                    <p className="text-slate-500 mt-1">Live overview of your admissions pipeline.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-3 py-1.5 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live data
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard loading={loading} title="Total Leads" value={stats.leads} description="All time applications" icon={<Users className="h-5 w-5" />} trend="+12 this week" trendUp />
                <KPICard loading={loading} title="Active Agents" value={stats.agents} description="Staff provisioned" icon={<BarChart3 className="h-5 w-5" />} />
                <KPICard loading={loading} title="Active Forms" value={stats.forms} description="Public intake pages" icon={<TrendingUp className="h-5 w-5" />} />
                <KPICard loading={loading} title="Messages Sent" value={stats.messages} description="Email + WhatsApp" icon={<MessageSquare className="h-5 w-5" />} trend="Integrations ready" trendUp />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Area chart — leads over time */}
                <Card className="rounded-xl border-slate-200 lg:col-span-3">
                    <CardHeader className="pb-2">
                        <CardTitle className="font-heading text-base">Leads This Week</CardTitle>
                        <CardDescription>New applicants per day (last 7 days)</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={trendData} margin={{ top: 4, right: 12, left: -24, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }}
                                        formatter={(v: any) => [`${v} leads`, "Count"]}
                                    />
                                    <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} fill="url(#grad)" dot={{ r: 3, fill: "#3B82F6" }} activeDot={{ r: 5 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Bar chart — leads by stage */}
                <Card className="rounded-xl border-slate-200 lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="font-heading text-base">Pipeline Stages</CardTitle>
                        <CardDescription>Leads per kanban stage</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {loading ? <Skeleton className="h-52 w-full rounded-lg" /> : (
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={stageData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {stageData.map((entry, index) => (
                                            <Cell key={index} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Bottom row: notifications + recent leads + quick actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notifications / activity feed */}
                <Card className="rounded-xl border-slate-200 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-heading text-base flex items-center gap-2">
                                <Bell className="h-4 w-4" /> Activity Feed
                            </CardTitle>
                            {notifications.some(n => n.isNew) && (
                                <Badge className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5">LIVE</Badge>
                            )}
                        </div>
                        <CardDescription>Real-time form submissions & updates</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                <p className="text-xs">No activity yet. Share your intake form to start receiving applicants.</p>
                            </div>
                        ) : (
                            <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                                {notifications.map((n, i) => (
                                    <NotifItem key={n.id ?? i} {...n} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Leads */}
                <Card className="rounded-xl border-slate-200 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-heading text-base">Recent Leads</CardTitle>
                            <Link href="/u/leads" className="text-xs text-primary hover:underline font-medium">View all →</Link>
                        </div>
                        <CardDescription>Latest applicants from intake forms</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {loading ? (
                            <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
                        ) : recentLeads.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                <p className="text-sm">No leads yet. <a href="/u/forms" className="text-primary underline">Create a form →</a></p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {recentLeads.map((lead) => (
                                    <div key={lead.id} className="py-2.5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                                                {lead.first_name?.charAt(0) ?? "?"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                                                <p className="text-xs text-slate-500 truncate max-w-[130px]">{lead.email}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200 shrink-0">
                                            {lead.status ?? "New"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="rounded-xl border-slate-200 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="font-heading text-base">Quick Actions</CardTitle>
                        <CardDescription>Common administration shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { label: "Invite Agent", href: "/u/agents", icon: <Users className="h-4 w-4" />, color: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100" },
                                { label: "Create Form", href: "/u/forms", icon: <TrendingUp className="h-4 w-4" />, color: "bg-violet-50 text-violet-700 border-violet-100 hover:bg-violet-100" },
                                { label: "View Pipeline", href: "/u/kanban", icon: <KanbanSquare className="h-4 w-4" />, color: "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100" },
                                { label: "Comms Settings", href: "/u/communication", icon: <MessageSquare className="h-4 w-4" />, color: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" },
                            ].map((action) => (
                                <a
                                    key={action.href}
                                    href={action.href}
                                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-sm font-semibold transition-all ${action.color}`}
                                >
                                    {action.icon}
                                    <span className="text-center text-xs leading-tight">{action.label}</span>
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
