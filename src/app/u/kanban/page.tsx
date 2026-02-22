"use client"

import React, { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone, Eye } from "lucide-react"
import Link from "next/link"

interface Lead {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    stage_id: string | null
}

interface Stage {
    id: string
    name: string
    position: number
}

const STAGE_COLORS: Record<string, string> = {
    "New": "bg-blue-100 text-blue-700 border-blue-200",
    "Contacted": "bg-amber-100 text-amber-700 border-amber-200",
    "Qualified": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "Admitted": "bg-purple-100 text-purple-700 border-purple-200",
    "Rejected": "bg-red-100 text-red-700 border-red-200",
}

function LeadCard({ lead }: { lead: Lead }) {
    return (
        <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-slate-900">{lead.first_name} {lead.last_name}</p>
            {lead.email && (
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Mail className="h-3 w-3 shrink-0" /> {lead.email}
                </p>
            )}
            {lead.phone && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3 shrink-0" /> {lead.phone}
                </p>
            )}
        </div>
    )
}

export default function UniversityKanbanPage() {
    const [stages, setStages] = useState<Stage[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from("profiles")
                .select("university_id")
                .eq("id", user.id)
                .single()

            if (!profile?.university_id) return

            const [{ data: stagesData }, { data: leadsData }] = await Promise.all([
                supabase
                    .from("kanban_stages")
                    .select("*")
                    .eq("university_id", profile.university_id)
                    .order("position"),
                supabase
                    .from("leads")
                    .select("id, first_name, last_name, email, phone, stage_id")
                    .eq("university_id", profile.university_id),
            ])

            setStages(stagesData ?? [])
            setLeads(leadsData ?? [])
            setLoading(false)
        }
        init()
    }, [])

    if (loading) {
        return (
            <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-4 w-72 mb-6" />
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-64 w-64 shrink-0 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    const getLeadsForStage = (stageId: string) => leads.filter(l => l.stage_id === stageId)
    const unassigned = leads.filter(l => !l.stage_id)
    const totalLeads = leads.length

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Pipeline Overview</h1>
                    <p className="text-slate-500 mt-1">
                        Read-only view of all {totalLeads} leads across pipeline stages.
                    </p>
                </div>
                <Button asChild variant="outline" className="shrink-0">
                    <Link href="/u/leads">
                        <Eye className="h-4 w-4 mr-2" />
                        Full Leads Table
                    </Link>
                </Button>
            </div>

            {/* Stage summary strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {stages.map(stage => {
                    const count = getLeadsForStage(stage.id).length
                    const colorClass = STAGE_COLORS[stage.name] || "bg-slate-100 text-slate-700 border-slate-200"
                    return (
                        <Card key={stage.id} className="rounded-lg border-slate-200">
                            <CardContent className="p-3 flex items-center justify-between">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                                    {stage.name}
                                </span>
                                <span className="text-lg font-heading font-bold text-slate-800">{count}</span>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {stages.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-500">No pipeline stages configured.</p>
                    <p className="text-sm mt-1">Stages are created automatically when agents are provisioned.</p>
                </div>
            ) : (
                <div className="flex gap-4 overflow-x-auto pb-6 min-h-[420px]">
                    {stages.map(stage => {
                        const stageLeads = getLeadsForStage(stage.id)
                        const colorClass = STAGE_COLORS[stage.name] || "bg-slate-100 text-slate-700 border-slate-200"
                        return (
                            <div key={stage.id} className="flex flex-col shrink-0 w-60">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`px-2 py-1 rounded-md text-xs font-semibold ${colorClass}`}>
                                        {stage.name}
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">{stageLeads.length}</span>
                                </div>
                                <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                                    {stageLeads.map(lead => (
                                        <LeadCard key={lead.id} lead={lead} />
                                    ))}
                                    {stageLeads.length === 0 && (
                                        <div className="text-center py-6 text-slate-300 text-xs">Empty</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {/* Unassigned column */}
                    {unassigned.length > 0 && (
                        <div className="flex flex-col shrink-0 w-60">
                            <div className="flex items-center justify-between mb-3">
                                <div className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">
                                    Unassigned
                                </div>
                                <span className="text-xs text-slate-400">{unassigned.length}</span>
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-2 space-y-2">
                                {unassigned.map(lead => (
                                    <LeadCard key={lead.id} lead={lead} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-slate-400 text-center pt-2">
                🔒 Read-only view. To move leads between stages, use the Agent Kanban.
            </p>
        </div>
    )
}
