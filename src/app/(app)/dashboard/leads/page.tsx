"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone } from "lucide-react"
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Types
type Stage = { id: string; name: string; color: string }
type Lead = { id: string; name: string; program: string; stageId: string; date: string; priority: string; score: number }

// Mock Data Structure
const STAGES: Stage[] = [
    { id: "s1", name: "New Inquiries", color: "bg-slate-100 border-slate-200 text-slate-700" },
    { id: "s2", name: "Contacted", color: "bg-blue-50 border-blue-100 text-blue-700" },
    { id: "s3", name: "Application Started", color: "bg-amber-50 border-amber-100 text-amber-700" },
    { id: "s4", name: "Requires Review", color: "bg-purple-50 border-purple-100 text-purple-700" },
    { id: "s5", name: "Admitted", color: "bg-green-50 border-green-100 text-green-700" },
]

const INITIAL_LEADS: Lead[] = [
    { id: "l1", name: "Emma Thompson", program: "BSc Computer Science", stageId: "s1", date: "2h ago", priority: "High", score: 85 },
    { id: "l2", name: "James Wilson", program: "BA Business Admin", stageId: "s1", date: "5h ago", priority: "Normal", score: 42 },
    { id: "l3", name: "Sarah Chen", program: "MSc Data Analytics", stageId: "s2", date: "1d ago", priority: "Normal", score: 67 },
    { id: "l4", name: "Michael Rodriguez", program: "PhD Physics", stageId: "s3", date: "2d ago", priority: "High", score: 92 },
    { id: "l5", name: "Lisa Patel", program: "BSc Nursing", stageId: "s4", date: "3d ago", priority: "Urgent", score: 98 },
]

// --- Sortable Item Component ---
function SortableLeadCard({ lead }: { lead: Lead }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lead.id, data: { type: "Lead", lead } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none pb-3">
            <Card className="border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing rounded-lg">
                <CardHeader className="p-3 pb-2 space-y-0 flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-sm font-semibold text-slate-900">{lead.name}</CardTitle>
                        <p className="text-xs font-medium text-[#1E3A8A] mt-0.5">{lead.program}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                            Score: {lead.score}
                        </Badge>
                        {lead.priority === "Urgent" || lead.priority === "High" ? (
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-none ${lead.priority === "Urgent" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                                }`}>
                                {lead.priority}
                            </Badge>
                        ) : null}
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    <div className="flex items-center justify-between mt-2 mb-3">
                        <span className="text-[11px] font-medium text-slate-500 flex items-center">
                            {lead.date}
                        </span>
                        <div className="flex items-center space-x-1">
                            {/* Prevent drag events on buttons by consuming the pointer events */}
                            <div onPointerDown={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100">
                                    <Mail className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100">
                                    <Phone className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div onPointerDown={(e) => e.stopPropagation()}>
                        <Button variant="outline" className="w-full h-7 text-[11px] font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-[#1E3A8A] shadow-none">
                            View Details
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// --- Droppable Column Component ---
function DroppableColumn({ stage, leads }: { stage: Stage, leads: Lead[] }) {
    const { setNodeRef } = useDroppable({
        id: stage.id,
        data: {
            type: "Column",
            stage,
        }
    });

    const leadIds = leads.map(l => l.id);

    return (
        <div className="w-80 flex flex-col h-[calc(100vh-14rem)] bg-slate-50 rounded-xl border border-slate-200">
            {/* Stage Header */}
            <div className="p-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stage.color}`}>
                        {stage.name}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{leads.length}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            {/* Sortable Context for Leads List */}
            <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto">
                <SortableContext id={stage.id} items={leadIds} strategy={verticalListSortingStrategy}>
                    <div className="min-h-[150px] space-y-3">
                        {leads.map((lead) => (
                            <SortableLeadCard key={lead.id} lead={lead} />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </div>
    )
}

// --- Main Pipeline Component ---
export default function LeadsPipelineDashboard() {
    const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS)
    const [activeLead, setActiveLead] = useState<Lead | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Requires 5px of movement before drag starts, allows clicks to pass through
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: any) => {
        const { active } = event
        const activeLeadData = leads.find((l) => l.id === active.id)
        if (activeLeadData) setActiveLead(activeLeadData)
    }

    const handleDragOver = (event: any) => {
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        const isActiveALead = active.data.current?.type === "Lead"
        const isOverALead = over.data.current?.type === "Lead"
        const isOverAColumn = over.data.current?.type === "Column"

        if (!isActiveALead) return

        // Dropping a lead over another lead
        if (isActiveALead && isOverALead) {
            setLeads((leads) => {
                const activeIndex = leads.findIndex((l) => l.id === activeId)
                const overIndex = leads.findIndex((l) => l.id === overId)

                if (leads[activeIndex].stageId !== leads[overIndex].stageId) {
                    const newLeads = [...leads]
                    newLeads[activeIndex].stageId = leads[overIndex].stageId
                    return arrayMove(newLeads, activeIndex, overIndex)
                }

                return arrayMove(leads, activeIndex, overIndex)
            })
        }

        // Dropping a lead over an empty column area
        if (isActiveALead && isOverAColumn) {
            setLeads((leads) => {
                const activeIndex = leads.findIndex((l) => l.id === activeId)
                const newLeads = [...leads]
                newLeads[activeIndex].stageId = overId // Column ID
                return arrayMove(newLeads, activeIndex, activeIndex)
            })
        }
    }

    const handleDragEnd = (event: any) => {
        setActiveLead(null)
        const { active, over } = event
        if (!over) return

        const activeId = active.id
        const overId = over.id

        if (activeId === overId) return

        setLeads((leads) => {
            const activeIndex = leads.findIndex((l) => l.id === activeId)
            const overIndex = leads.findIndex((l) => l.id === overId)

            const isOverALead = over.data.current?.type === "Lead"
            if (isOverALead) {
                return arrayMove(leads, activeIndex, overIndex)
            }
            return leads
        })
    }

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col font-sans">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Leads Pipeline</h2>
                    <p className="text-slate-500 mt-1">Manage prospective students through the admissions funnel.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search"
                            placeholder="Search leads..."
                            className="pl-8 w-[250px] border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md"
                        />
                    </div>
                    <Button variant="outline" className="text-slate-700 border-slate-300 hidden sm:flex">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button className="bg-[#1E3A8A] hover:bg-[#14532D] text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Lead
                    </Button>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full gap-4 items-start min-w-max px-1">

                        {STAGES.map((stage) => {
                            const stageLeads = leads.filter(l => l.stageId === stage.id)
                            return <DroppableColumn key={stage.id} stage={stage} leads={stageLeads} />
                        })}

                    </div>

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeLead ? (
                            <div className="w-80">
                                <SortableLeadCard lead={activeLead} />
                            </div>
                        ) : null}
                    </DragOverlay>

                </DndContext>
            </div>
        </div>
    )
}
