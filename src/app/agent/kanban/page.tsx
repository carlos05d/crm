"use client"

import React, { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Mail, Phone, BookOpen, Flame, AlertCircle } from "lucide-react"
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    type DragStartEvent,
    type DragEndEvent,
    closestCorners,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"

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
    programs?: { name: string } | null
}

interface Stage {
    id: string
    name: string
    position: number
}

const STAGE_COLORS: Record<string, string> = {
    "New": "bg-blue-100 text-blue-700",
    "Contacted": "bg-amber-100 text-amber-700",
    "Qualified": "bg-emerald-100 text-emerald-700",
    "Admitted": "bg-purple-100 text-purple-700",
    "Rejected": "bg-red-100 text-red-700",
}

function LeadCard({ lead, isDragging, onClick }: { lead: Lead; isDragging?: boolean, onClick?: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id })
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={onClick}
            className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none relative"
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

            {lead.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{lead.email}</span></p>}
            {lead.phone && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Phone className="h-3 w-3 shrink-0" /> {lead.phone}</p>}
        </div>
    )
}

export default function AgentKanbanPage() {
    const [stages, setStages] = useState<Stage[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)

    // Detail Sheet
    const [activeLead, setActiveLead] = useState<Lead | null>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
            if (!profile?.university_id) return

            const [{ data: stagesData }, { data: leadsData }] = await Promise.all([
                supabase.from("kanban_stages").select("*").eq("university_id", profile.university_id).order("position"),
                supabase.from("leads").select("*, programs(name)").eq("university_id", profile.university_id),
                // RLS on leads ensures only assigned_agent_id = auth.uid() are fetched
            ])

            setStages(stagesData ?? [])
            setLeads(leadsData ?? [])
            setLoading(false)
        }
        init()
    }, [])

    const getLeadsForStage = (stageId: string) => leads.filter(l => l.stage_id === stageId).sort((a, b) => b.score - a.score)
    const unassigned = leads.filter(l => !l.stage_id).sort((a, b) => b.score - a.score)

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        if (!over || active.id === over.id) return

        const draggedLead = leads.find(l => l.id === active.id)
        if (!draggedLead) return

        const overIsStage = stages.some(s => s.id === over.id)
        const targetStageId = overIsStage ? (over.id as string) : (leads.find(l => l.id === over.id)?.stage_id ?? null)

        if (draggedLead.stage_id === targetStageId) return

        setLeads(prev => prev.map(l => l.id === active.id ? { ...l, stage_id: targetStageId } : l))
        await supabase.from("leads").update({ stage_id: targetStageId }).eq("id", active.id)
    }

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

    const activeDragLead = activeId ? leads.find(l => l.id === activeId) : null

    return (
        <div className="space-y-4 font-sans">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Lead Pipeline</h1>
                <p className="text-slate-500 mt-1">Drag and drop leads between stages to update their progress.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {stages.map(stage => {
                    const count = getLeadsForStage(stage.id).length
                    const colorClass = STAGE_COLORS[stage.name] || "bg-slate-100 text-slate-700"
                    return (
                        <Card key={stage.id} className="rounded-lg border-slate-200">
                            <CardContent className="p-3 flex items-center justify-between">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${colorClass}`}>
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
                    <p className="font-medium text-slate-500">Pipeline stages are not configured.</p>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-6 min-h-[500px]">
                        {stages.map(stage => {
                            const stageLeads = getLeadsForStage(stage.id)
                            const colorClass = STAGE_COLORS[stage.name] || "bg-slate-100 text-slate-700"
                            return (
                                <div key={stage.id} className="flex flex-col shrink-0 w-64">
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <div className={`px-2 py-1 rounded-md text-xs font-semibold ${colorClass}`}>
                                            {stage.name}
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium">{stageLeads.length}</span>
                                    </div>
                                    <SortableContext items={stageLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                        <div id={stage.id} className="flex-1 bg-slate-50/80 rounded-xl border border-slate-200 p-2 space-y-2 min-h-[120px]">
                                            {stageLeads.map(lead => (
                                                <LeadCard key={lead.id} lead={lead} isDragging={lead.id === activeId} onClick={() => openDetails(lead)} />
                                            ))}
                                            {stageLeads.length === 0 && <div className="text-center py-6 text-slate-300 text-xs">Drop leads here</div>}
                                        </div>
                                    </SortableContext>
                                </div>
                            )
                        })}

                        {unassigned.length > 0 && (
                            <div className="flex flex-col shrink-0 w-64">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <div className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">Unassigned</div>
                                    <span className="text-xs text-slate-400 font-medium">{unassigned.length}</span>
                                </div>
                                <div className="flex-1 bg-slate-50/50 rounded-xl border border-dashed border-slate-300 p-2 space-y-2">
                                    {unassigned.map(lead => (
                                        <LeadCard key={lead.id} lead={lead} onClick={() => openDetails(lead)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DragOverlay>
                        {activeDragLead && (
                            <div className="bg-white rounded-lg border border-primary p-3 shadow-2xl w-64 cursor-grabbing transform rotate-2">
                                <p className="text-sm font-semibold text-slate-900 leading-tight">{activeDragLead.first_name} {activeDragLead.last_name}</p>
                                {activeDragLead.programs?.name && <p className="text-[10px] uppercase font-semibold text-primary mt-1">{activeDragLead.programs.name}</p>}
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Lead Detail Sheet Overlay */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto">
                    {activeLead && (
                        <>
                            <SheetHeader className="pb-6 border-b border-slate-100 flex flex-row items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600">ID: {activeLead.id.split('-')[0]}</Badge>
                                        <Badge variant="outline" className="text-primary bg-primary/5">{activeLead.source || "Manual"}</Badge>
                                    </div>
                                    <SheetTitle className="text-2xl font-bold">{activeLead.first_name} {activeLead.last_name}</SheetTitle>
                                    <SheetDescription>Lead Profile Detailed View</SheetDescription>
                                </div>
                                <div className="flex flex-col items-center justify-center h-16 w-16 bg-slate-50 rounded-full border border-slate-100 shrink-0">
                                    <span className={`text-xl font-bold ${activeLead.score > 80 ? 'text-orange-500' : 'text-slate-800'}`}>{activeLead.score || 0}</span>
                                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Score</span>
                                </div>
                            </SheetHeader>

                            <div className="py-6 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact Info</h4>
                                    <div className="grid grid-cols-[30px_1fr] gap-y-3 gap-x-2 text-sm">
                                        <Mail className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-700">{activeLead.email}</span>
                                        <Phone className="h-4 w-4 text-slate-400" />
                                        <span className="text-slate-700">{activeLead.phone || "No phone provided"}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Academic Interest</h4>
                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex items-center gap-3 w-full">
                                        <BookOpen className="h-5 w-5 text-primary shrink-0" />
                                        <span className="font-medium text-slate-800">{activeLead.programs?.name || "Program Not Specified"}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Pipeline Status</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label className="text-xs text-slate-500 mb-1 block">Current Stage</Label>
                                            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-50">
                                                {stages.find(s => s.id === activeLead.stage_id)?.name || "Uncategorized"}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-400 flex items-center">
                                        <AlertCircle className="h-3 w-3 mr-1" /> Profile created on {new Date(activeLead.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
