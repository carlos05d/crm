"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { Activity, User, MessageSquare, FileText, KanbanSquare, Clock } from "lucide-react"

const ACTION_ICONS: Record<string, React.ReactNode> = {
    "lead_created": <User className="h-4 w-4 text-blue-600" />,
    "lead_updated": <FileText className="h-4 w-4 text-amber-600" />,
    "message_sent": <MessageSquare className="h-4 w-4 text-purple-600" />,
    "kanban_moved": <KanbanSquare className="h-4 w-4 text-teal-600" />,
}

export default function AgentActivityPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from("audit_logs")
                .select("*")
                .eq("actor_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50)

            setLogs(data ?? [])
            setLoading(false)
        }
        init()
    }, [])

    const formatTime = (ts: string) => {
        const d = new Date(ts)
        const now = new Date()
        const diffMs = now.getTime() - d.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        if (diffMins < 1) return "just now"
        if (diffMins < 60) return `${diffMins}m ago`
        const diffHrs = Math.floor(diffMins / 60)
        if (diffHrs < 24) return `${diffHrs}h ago`
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">My Activity</h1>
                <p className="text-slate-500 mt-1">A chronological log of your actions in the system.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-2">
                {[
                    { label: "Total Actions", value: loading ? "—" : logs.length },
                    { label: "This Week", value: loading ? "—" : logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 7 * 86400000)).length },
                    { label: "Today", value: loading ? "—" : logs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length },
                ].map(stat => (
                    <Card key={stat.label} className="rounded-xl border-slate-200">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs text-slate-500">{stat.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-heading font-bold text-slate-900">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="rounded-xl border-slate-200">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-slate-500">No activity recorded yet.</p>
                            <p className="text-sm mt-1">Start working on your leads to see your history here.</p>
                        </div>
                    ) : (
                        <div className="relative pl-10">
                            {/* Timeline Line */}
                            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-100" />
                            {logs.map((log, i) => (
                                <div key={log.id} className="relative py-4 pr-6 border-b border-slate-100 last:border-0">
                                    <div className="absolute left-0 p-1.5 bg-white border border-slate-200 rounded-full">
                                        {ACTION_ICONS[log.action] || <Activity className="h-3.5 w-3.5 text-slate-400" />}
                                    </div>
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 capitalize">{log.action?.replace(/_/g, " ")}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                on <span className="font-medium">{log.entity}</span>
                                                {log.entity_id && <span className="text-slate-400 font-mono"> #{log.entity_id.slice(0, 8)}</span>}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400 shrink-0">{formatTime(log.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
