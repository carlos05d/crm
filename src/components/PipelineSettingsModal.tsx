"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings2, Plus, GripVertical, Trash2, Loader2 } from "lucide-react"
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent
} from "@dnd-kit/core"
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toast-provider"

export const KANBAN_COLORS = [
    { label: "Slate", value: "bg-slate-100 text-slate-700" },
    { label: "Blue", value: "bg-blue-100 text-blue-700" },
    { label: "Emerald", value: "bg-emerald-100 text-emerald-700" },
    { label: "Amber", value: "bg-amber-100 text-amber-700" },
    { label: "Purple", value: "bg-purple-100 text-purple-700" },
    { label: "Red", value: "bg-red-100 text-red-700" },
    { label: "Rose", value: "bg-rose-100 text-rose-700" },
    { label: "Orange", value: "bg-orange-100 text-orange-700" },
    { label: "Cyan", value: "bg-cyan-100 text-cyan-700" },
]

export interface KanbanStage {
    id: string
    name: string
    color: string
    position: number
}

interface SortableStageItemProps {
    stage: KanbanStage
    onUpdate: (id: string, updates: Partial<KanbanStage>) => void
    onDelete: (id: string) => void
}

function SortableStageItem({ stage, onUpdate, onDelete }: SortableStageItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id })
    const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 2 : 1 }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-2 rounded-md border ${isDragging ? 'bg-slate-50 border-primary/50 shadow-md' : 'bg-white border-slate-200'}`}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 rounded"
            >
                <GripVertical className="h-4 w-4" />
            </div>

            <Input
                value={stage.name}
                onChange={(e) => onUpdate(stage.id, { name: e.target.value })}
                className="h-8 w-40"
                placeholder="Stage name"
            />

            <div className="flex-1 flex gap-1 flex-wrap items-center justify-end px-2">
                {KANBAN_COLORS.map(c => (
                    <button
                        key={c.value}
                        type="button"
                        onClick={() => onUpdate(stage.id, { color: c.value })}
                        className={`w-5 h-5 rounded-full border border-black/10 transition-transform ${c.value.split(' ')[0]} ${stage.color === c.value ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-110'}`}
                        title={c.label}
                    />
                ))}
            </div>

            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                onClick={() => onDelete(stage.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

export function PipelineSettingsModal({
    universityId,
    onSaved
}: {
    universityId: string | null
    onSaved: () => void
}) {
    const [open, setOpen] = useState(false)
    const [stages, setStages] = useState<KanbanStage[]>([])
    const [deletedIds, setDeletedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const { show } = useToast()

    // DND Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    useEffect(() => {
        if (open && universityId) {
            fetchStages()
        }
    }, [open, universityId])

    const fetchStages = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/u/settings/stages")
            const data = await res.json()
            if (data.stages) {
                setStages(data.stages)
                setDeletedIds([])
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setStages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id)
                const newIndex = items.findIndex(i => i.id === over.id)
                const reordered = arrayMove(items, oldIndex, newIndex)
                // Update position numbers to match new index
                return reordered.map((item, idx) => ({ ...item, position: idx }))
            })
        }
    }

    const updateStage = (id: string, updates: Partial<KanbanStage>) => {
        setStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    }

    const addStage = () => {
        const newStage: KanbanStage = {
            id: `temp-${crypto.randomUUID()}`,
            name: "New Stage",
            color: KANBAN_COLORS[0].value,
            position: stages.length
        }
        setStages([...stages, newStage])
    }

    const deleteStage = (id: string) => {
        if (!id.startsWith("temp-")) {
            setDeletedIds([...deletedIds, id])
        }
        setStages(stages.filter(s => s.id !== id))
    }

    const handleSave = async () => {
        if (stages.some(s => !s.name.trim())) {
            show("Process aborted: All stages must have a name.", "error")
            return
        }

        setSaving(true)
        try {
            // Re-sync positions before sending just in case
            const payloadStages = stages.map((s, idx) => ({ ...s, position: idx }))

            const res = await fetch("/api/u/settings/stages", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stages: payloadStages,
                    deleted_ids: deletedIds
                })
            })

            const data = await res.json()
            if (!res.ok) {
                show(data.error || "Failed to save pipeline", "error")
            } else {
                show("Pipeline updated successfully!", "success")
                setOpen(false)
                onSaved() // trigger parent refresh
            }
        } catch (err) {
            console.error(err)
            show("An unexpected error occurred.", "error")
        }
        setSaving(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline"><Settings2 className="mr-2 h-4 w-4" /> Customize Pipeline</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Customize Pipeline Stages</DialogTitle>
                    <DialogDescription>
                        Add, remove, recolor, and drag to reorder the stages on your Kanban boards. Changes apply to all agents instantly.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 py-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-14 bg-slate-100 rounded animate-pulse" />)}
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {stages.map((stage) => (
                                        <SortableStageItem
                                            key={stage.id}
                                            stage={stage}
                                            onUpdate={updateStage}
                                            onDelete={deleteStage}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-4 text-slate-500 hover:text-slate-900 border-2 border-dashed border-slate-200 hover:border-slate-300 bg-transparent hover:bg-slate-50"
                        onClick={addStage}
                        disabled={loading}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Add Stage
                    </Button>
                </div>

                <DialogFooter className="mt-2 pt-4 border-t border-slate-100">
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Pipeline
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
