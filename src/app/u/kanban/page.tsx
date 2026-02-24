"use client"

import React, { useState, useEffect, useMemo } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Phone, Flame, Users, Filter } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { PipelineSettingsModal } from "@/components/PipelineSettingsModal"

interface Lead {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
    stage_id: string | null
    score: number
    source: string
    created_at: string
    assigned_agent_id: string | null
    programs?: { name: string } | null
}

interface Stage {
    id: string
    name: string
    color: string
    position: number
}


/**
 * Static read-only lead card — no drag, no sortable, no refs.
 * University Admins can view and click to see lead details, but CANNOT move cards.
 * Only Agents have drag-and-drop on /agent/kanban.
 */
function ReadOnlyLeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer select-none"
        >
            <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{lead.first_name} {lead.last_name}</p>
                <div className="flex items-center gap-1 shrink-0">
                    {lead.score > 80 && <Flame className="h-3 w-3 text-orange-500" />}
                    <span className={`text-xs font-bold ${lead.score > 80 ? 'text-orange-600' : 'text-slate-500'}`}>{lead.score || 0}</span>
                </div>
            </div>

            {lead.programs?.name && (
                <p className="text-[10px] uppercase font-semibold text-primary mb-2 line-clamp-1">{lead.programs.name}</p>
            )}

            {lead.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{lead.email}</span></p>}
            {lead.phone && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Phone className="h-3 w-3 shrink-0" />{lead.phone}</p>}
        </div>
    )
}

export default function UniversityKanbanPage() {
    const [stages, setStages] = useState<Stage[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [programs, setPrograms] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [universityId, setUniversityId] = useState<string | null>(null)

    // Filters
    const [filterAgent, setFilterAgent] = useState<string>("all")
    const [filterProgram, setFilterProgram] = useState<string>("all")

    // Detail Sheet
    const [activeLead, setActiveLead] = useState<Lead | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

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

            const [
                { data: stagesData },
                { data: leadsData },
                { data: agentsData },
                { data: programsData },
            ] = await Promise.all([
                supabase.from("kanban_stages").select("*").eq("university_id", profile.university_id).order("position"),
                supabase.from("leads").select("*, programs(name)").eq("university_id", profile.university_id),
                supabase.from("agents").select("user_id, display_name").eq("university_id", profile.university_id).eq("active", true),
                supabase.from("programs").select("id, name").eq("university_id", profile.university_id),
            ])

            setStages(stagesData ?? [])
            setLeads(leadsData ?? [])
            setAgents(agentsData ?? [])
            setPrograms(programsData ?? [])
            setLoading(false)
        }
        init()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase])

    const refreshStages = async () => {
        if (!universityId) return
        const { data: stagesData } = await supabase.from("kanban_stages").select("*").eq("university_id", universityId).order("position")
        setStages(stagesData ?? [])
    }

    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            if (filterAgent !== "all" && l.assigned_agent_id !== filterAgent) return false
            if (filterProgram !== "all" && (l.programs as any)?.id !== filterProgram) return false
            return true
        })
    }, [leads, filterAgent, filterProgram])

    const getLeadsForStage = (stageId: string) => filteredLeads.filter(l => l.stage_id === stageId).sort((a, b) => b.score - a.score)
    const unassigned = filteredLeads.filter(l => !l.stage_id).sort((a, b) => b.score - a.score)

    const openDetails = (lead: Lead) => {
        setActiveLead(lead)
        setSheetOpen(true)
    }

    if (loading) {
        return (
            <div>
                <Skeleton className="h-8 w-56 mb-2" />
                <Skeleton className="h-4 w-72 mb-6" />
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64 w-64 shrink-0 rounded-xl" />)}
                </div>
            </div>
        )
    }

    const allStageColumns = [
        { id: "unassigned", name: "Unassigned", color: "bg-slate-100 text-slate-700", leads: unassigned },
        ...stages.map(s => ({ id: s.id, name: s.name, color: s.color, leads: getLeadsForStage(s.id) }))
    ]

    return (
        <div className="space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Pipeline Overview</h1>
                    <p className="text-slate-500 mt-1">Read-only view of all leads across stages. Agents move leads on their Kanban.</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <PipelineSettingsModal universityId={universityId} onSaved={refreshStages} />
                    <Filter className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    <Select value={filterAgent} onValueChange={setFilterAgent}>
                        <SelectTrigger className="w-[160px] bg-white border-slate-200 text-sm">
                            <SelectValue placeholder="All Agents" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Agents</SelectItem>
                            {agents.map(a => (
                                <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                        <SelectTrigger className="w-[160px] bg-white border-slate-200 text-sm">
                            <SelectValue placeholder="All Programs" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Programs</SelectItem>
                            {programs.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Summary stat bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {allStageColumns.map(col => {
                    const colorClass = col.color || "bg-slate-100 text-slate-700"
                    return (
                        <Card key={col.id} className="rounded-lg border-slate-200">
                            <CardContent className="p-3 flex items-center justify-between">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${colorClass}`}>
                                    {col.name}
                                </span>
                                <span className="text-lg font-heading font-bold text-slate-800">{col.leads.length}</span>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
                {allStageColumns.map(col => {
                    const colorClass = col.color || "bg-slate-100 text-slate-700"
                    return (
                        <div key={col.id} className="flex-shrink-0 w-72">
                            <Card className="h-full rounded-xl border-slate-200 bg-slate-50/80">
                                <CardHeader className="pb-0 pt-4 px-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${colorClass}`}>
                                            {col.name}
                                        </span>
                                        <Badge variant="secondary" className="bg-white border border-slate-200 text-slate-600 font-semibold">
                                            <Users className="h-3 w-3 mr-1" />
                                            {col.leads.length}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-3 pb-4 space-y-2.5 min-h-[200px]">
                                    {col.leads.length === 0 ? (
                                        <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-lg">
                                            <p className="text-xs text-slate-400">No leads</p>
                                        </div>
                                    ) : (
                                        col.leads.map(lead => (
                                            <ReadOnlyLeadCard
                                                key={lead.id}
                                                lead={lead}
                                                onClick={() => openDetails(lead)}
                                            />
                                        ))
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )
                })}
            </div>

            {/* Lead Detail Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>{activeLead?.first_name} {activeLead?.last_name}</SheetTitle>
                        <SheetDescription>Lead profile details</SheetDescription>
                    </SheetHeader>
                    {activeLead && (
                        <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs text-slate-500">Email</Label>
                                    <p className="text-sm font-medium">{activeLead.email || "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Phone</Label>
                                    <p className="text-sm font-medium">{activeLead.phone || "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Lead Score</Label>
                                    <p className="text-sm font-bold text-primary">{activeLead.score}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Source</Label>
                                    <p className="text-sm font-medium capitalize">{activeLead.source || "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Program</Label>
                                    <p className="text-sm font-medium">{activeLead.programs?.name || "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Assigned Agent</Label>
                                    <p className="text-sm font-medium">
                                        {agents.find(a => a.user_id === activeLead.assigned_agent_id)?.display_name || "Unassigned"}
                                    </p>
                                </div>
                                <div>
                                    <Label className="text-xs text-slate-500">Created</Label>
                                    <p className="text-sm font-medium">{new Date(activeLead.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
