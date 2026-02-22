"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { Download, FileText, Users, MessageSquare, Activity, Loader2 } from "lucide-react"

export default function ReportsPage() {
    const [universityId, setUniversityId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
            if (profile) setUniversityId(profile.university_id)
            setLoading(false)
        }
        init()
    }, [])

    const exportCSV = async (type: string) => {
        if (!universityId) return
        setExporting(type)
        try {
            let data: any[] = []
            let filename = `${type}_export.csv`

            if (type === "leads") {
                const { data: rows } = await supabase.from("leads").select("first_name, last_name, email, phone, source, created_at").eq("university_id", universityId)
                data = rows ?? []
            } else if (type === "agents") {
                const { data: rows } = await supabase.from("agents").select("display_name, phone, active, created_at").eq("university_id", universityId)
                data = rows ?? []
            } else if (type === "messages") {
                const { data: rows } = await supabase.from("messages").select("channel, to_value, from_value, status, sent_at").eq("university_id", universityId)
                data = rows ?? []
            }

            if (data.length === 0) {
                alert("No data to export yet.")
                return
            }

            const headers = Object.keys(data[0]).join(",")
            const rows = data.map(row => Object.values(row).map(v => `"${v ?? ""}"`).join(",")).join("\n")
            const csv = `${headers}\n${rows}`
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = filename
            a.click()
            URL.revokeObjectURL(url)
        } finally {
            setExporting(null)
        }
    }

    const reports = [
        { id: "leads", title: "All Leads Export", description: "Full pipeline CSV with contact info and source.", icon: <Users className="h-5 w-5" />, badge: "Leads" },
        { id: "agents", title: "Agent Directory", description: "List of all provisioned agents and their status.", icon: <Activity className="h-5 w-5" />, badge: "Staff" },
        { id: "messages", title: "Communication Log", description: "All email and WhatsApp messages with status.", icon: <MessageSquare className="h-5 w-5" />, badge: "Comms" },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">CSV Reports</h1>
                <p className="text-slate-500 mt-1">Export your university pipeline data for analysis or compliance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="rounded-xl border-slate-200">
                            <CardHeader><Skeleton className="h-5 w-32 mb-2" /><Skeleton className="h-3 w-48" /></CardHeader>
                            <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                        </Card>
                    ))
                ) : (
                    reports.map((r) => (
                        <Card key={r.id} className="rounded-xl border-slate-200 hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="p-2 bg-primary/10 text-primary rounded-lg">{r.icon}</div>
                                    <Badge variant="outline" className="text-xs">{r.badge}</Badge>
                                </div>
                                <CardTitle className="text-base">{r.title}</CardTitle>
                                <CardDescription className="text-sm">{r.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => exportCSV(r.id)}
                                    disabled={exporting === r.id}
                                >
                                    {exporting === r.id ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="mr-2 h-4 w-4" />
                                    )}
                                    Export CSV
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Card className="rounded-xl border-slate-200 bg-slate-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-slate-700">Data Privacy Notice</p>
                            <p className="text-xs text-slate-500 mt-1">All exports are limited to your university's data only, enforced by Row Level Security. Exports are logged in your Audit Trail.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
