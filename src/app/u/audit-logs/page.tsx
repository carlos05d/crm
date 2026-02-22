"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { Activity, Search, User, Settings, FileText, MessageSquare, Users, Globe } from "lucide-react"

const ACTION_ICONS: Record<string, React.ReactNode> = {
    "agent_provisioned": <Users className="h-4 w-4 text-emerald-600" />,
    "lead_created": <User className="h-4 w-4 text-blue-600" />,
    "lead_updated": <FileText className="h-4 w-4 text-amber-600" />,
    "message_sent": <MessageSquare className="h-4 w-4 text-purple-600" />,
    "settings_updated": <Settings className="h-4 w-4 text-slate-600" />,
    "form_created": <Globe className="h-4 w-4 text-teal-600" />,
}

export default function TenantAuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [universityId, setUniversityId] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
            if (!profile?.university_id) return
            setUniversityId(profile.university_id)

            const { data } = await supabase
                .from("audit_logs")
                .select("*, profiles(first_name, last_name, email)")
                .eq("university_id", profile.university_id)
                .order("created_at", { ascending: false })
                .limit(100)

            setLogs(data ?? [])
            setLoading(false)
        }
        init()
    }, [])

    const filtered = logs.filter(log =>
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity?.toLowerCase().includes(search.toLowerCase()) ||
        log.profiles?.email?.toLowerCase().includes(search.toLowerCase())
    )

    const formatTime = (ts: string) => {
        const d = new Date(ts)
        return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Audit Logs</h1>
                    <p className="text-slate-500 mt-1">All recorded admin and agent actions within your university.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input className="pl-8 w-full sm:w-64" placeholder="Search actions..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            <Card className="rounded-xl border-slate-200">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-slate-500">{search ? "No matching logs found." : "No audit activity recorded yet."}</p>
                            <p className="text-sm mt-1">Actions like creating agents, leads, and sending messages will appear here.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filtered.map((log) => (
                                <div key={log.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50">
                                    <div className="p-2 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                                        {ACTION_ICONS[log.action] || <Activity className="h-4 w-4 text-slate-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-medium text-slate-900">{log.action?.replace(/_/g, " ")}</p>
                                            <Badge variant="outline" className="text-xs shrink-0">{log.entity}</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            by {log.profiles?.email || log.actor_id || "system"} · {log.actor_role}
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-400 shrink-0 font-mono">{formatTime(log.created_at)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
