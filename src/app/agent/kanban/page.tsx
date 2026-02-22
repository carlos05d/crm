"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Users, Mail, Phone } from "lucide-react"
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
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Lead {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string
    stage_id: string | null
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

function LeadCard({ lead, isDragging }: { lead: Lead; isDragging?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id })
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}
            className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
        >
            <p className="text-sm font-semibold text-slate-900">{lead.first_name} {lead.last_name}</p>
            {lead.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Mail className="h-3 w-3" /> {lead.email}</p>}
            {lead.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</p>}
        </div>
    )
}

export default function AgentKanbanPage() {
    const [stages, setStages] = useState<Stage[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [universityId, setUniversityId] = useState<string | null>(null)

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
            setUniversityId(profile.university_id)

            const [{ data: stagesData }, { data: leadsData }] = await Promise.all([
                supabase.from("kanban_stages").select("*").eq("university_id", profile.university_id).order("position"),
                supabase.from("leads").select("id, first_name, last_name, email, phone, stage_id").eq("university_id", profile.university_id),
            ])
            setStages(stagesData ?? [])
            setLeads(leadsData ?? [])
            setLoading(false)
        }
        init()
    }, [])

    const getLeadsForStage = (stageId: string) =>
        leads.filter(l => l.stage_id === stageId)

    const unassigned = leads.filter(l => !l.stage_id)

    const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string)

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)
        if (!over || active.id === over.id) return

        const draggedLead = leads.find(l => l.id === active.id)
        if (!draggedLead) return

        // The `over.id` is either a stage ID or another lead ID
        // Determine target stage
        const overIsStage = stages.some(s => s.id === over.id)
        const targetStageId = overIsStage
            ? (over.id as string)
            : (leads.find(l => l.id === over.id)?.stage_id ?? null)

        if (draggedLead.stage_id === targetStageId) return

        // Optimistic update
        setLeads(prev => prev.map(l => l.id === active.id ? { ...l, stage_id: targetStageId } : l))

        // Persist to Supabase
        await supabase.from("leads").update({ stage_id: targetStageId }).eq("id", active.id)
    }

    if (loading) return (
        <div>
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="flex gap-4 overflow-x-auto pb-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-64 w-64 shrink-0 rounded-xl" />)}
            </div>
        </div>
    )

    const activeLead = activeId ? leads.find(l => l.id === activeId) : null

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Kanban Pipeline</h1>
                <p className="text-slate-500 mt-1">Drag leads across stages to update their status.</p>
            </div>

            {stages.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-slate-500">No pipeline stages found.</p>
                    <p className="text-sm mt-1">Your admin needs to configure Kanban stages.</p>
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="flex gap-4 overflow-x-auto pb-6 min-h-[500px]">
                        {stages.map(stage => {
                            const stageLeads = getLeadsForStage(stage.id)
                            const colorClass = STAGE_COLORS[stage.name] || "bg-slate-100 text-slate-700"
                            return (
                                <div key={stage.id} className="flex flex-col shrink-0 w-64">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`px-2 py-1 rounded-md text-xs font-semibold ${colorClass}`}>{stage.name}</div>
                                        <span className="text-xs text-slate-400 font-medium">{stageLeads.length}</span>
                                    </div>
                                    <SortableContext items={stageLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
                                        <div
                                            id={stage.id}
                                            className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-2 min-h-[100px]"
                                        >
                                            {stageLeads.map(lead => (
                                                <LeadCard key={lead.id} lead={lead} isDragging={lead.id === activeId} />
                                            ))}
                                            {stageLeads.length === 0 && (
                                                <div className="text-center py-6 text-slate-300 text-xs">Drop here</div>
                                            )}
                                        </div>
                                    </SortableContext>
                                </div>
                            )
                        })}

                        {/* Unassigned column */}
                        {unassigned.length > 0 && (
                            <div className="flex flex-col shrink-0 w-64">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600">Unassigned</div>
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

                    <DragOverlay>
                        {activeLead && (
                            <div className="bg-white rounded-lg border-2 border-primary p-3 shadow-xl w-64 cursor-grabbing">
                                <p className="text-sm font-semibold text-slate-900">{activeLead.first_name} {activeLead.last_name}</p>
                                {activeLead.email && <p className="text-xs text-slate-500 mt-1">{activeLead.email}</p>}
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            )}
        </div>
    )
}
