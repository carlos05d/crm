"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { createBrowserClient } from "@supabase/ssr"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Search, Users, Trash2, Loader2, Mail, Phone, Flame, BookOpen, AlertCircle, RefreshCw } from "lucide-react"

const leadSchema = z.object({
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().optional(),
    source: z.string().optional(),
    assigned_agent_id: z.string().optional(),
    program_id: z.string().optional(),
    score: z.string().optional(),
})
type LeadForm = z.infer<typeof leadSchema>

export default function TenantLeadsPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [programs, setPrograms] = useState<any[]>([])
    const [stages, setStages] = useState<any[]>([])

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState("")

    // Filters
    const [filterProgram, setFilterProgram] = useState<string>("all")
    const [filterStage, setFilterStage] = useState<string>("all")

    const [universityId, setUniversityId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    // Detail Sheet
    const [activeLead, setActiveLead] = useState<any>(null)
    const [sheetOpen, setSheetOpen] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<z.infer<typeof leadSchema>>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            score: ""
        }
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
        if (!profile?.university_id) return
        setUniversityId(profile.university_id)

        const [
            { data: leadsData },
            { data: agentsData },
            { data: programsData },
            { data: stagesData }
        ] = await Promise.all([
            supabase.from("leads").select("*, profiles(first_name, last_name, display_name), programs(name), kanban_stages(name)").eq("university_id", profile.university_id).order("created_at", { ascending: false }),
            supabase.from("agents").select("user_id, display_name").eq("university_id", profile.university_id).eq("active", true),
            supabase.from("programs").select("id, name").eq("university_id", profile.university_id).order("name"),
            supabase.from("kanban_stages").select("id, name").eq("university_id", profile.university_id).order("position"),
        ])
        setLeads(leadsData ?? [])
        setAgents(agentsData ?? [])
        setPrograms(programsData ?? [])
        setStages(stagesData ?? [])
        setLoading(false)
    }

    const onSubmit = async (data: LeadForm) => {
        if (!universityId) return
        setSaving(true)
        const { error } = await supabase.from("leads").insert({
            university_id: universityId,
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            source: data.source || "manual",
            score: data.score ? parseInt(data.score, 10) : 0,
            assigned_agent_id: data.assigned_agent_id && data.assigned_agent_id !== "unassigned" ? data.assigned_agent_id : null,
            program_id: data.program_id && data.program_id !== "unassigned" ? data.program_id : null,
        })
        if (!error) {
            reset()
            setDialogOpen(false)
            await fetchData()
        }
        setSaving(false)
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleting(id)
        await supabase.from("leads").delete().eq("id", id)
        setLeads(prev => prev.filter(l => l.id !== id))
        if (activeLead?.id === id) setSheetOpen(false)
        setDeleting(null)
    }

    const handleAssign = async (leadId: string, agentUserId: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        await supabase.from("leads").update({ assigned_agent_id: agentUserId || null }).eq("id", leadId)
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_agent_id: agentUserId || null } : l))
        if (activeLead?.id === leadId) setActiveLead((prev: any) => ({ ...prev, assigned_agent_id: agentUserId || null }))
    }

    const filtered = useMemo(() => {
        return leads.filter(l => {
            const matchesSearch = `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(search.toLowerCase())
            const matchesProg = filterProgram === "all" || l.program_id === filterProgram
            const matchesStage = filterStage === "all" || l.stage_id === filterStage
            return matchesSearch && matchesProg && matchesStage
        })
    }, [leads, search, filterProgram, filterStage])

    const openDetails = (lead: any) => {
        setActiveLead(lead)
        setSheetOpen(true)
    }

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Leads Management</h1>
                    <p className="text-slate-500 mt-1">View, create, assign, and score your university's pipeline.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Lead</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Lead</DialogTitle>
                            <DialogDescription>Create a manual lead entry and optionally assign it to an agent or program.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>First Name</Label>
                                        <Input {...register("first_name")} placeholder="Jane" />
                                        {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Last Name</Label>
                                        <Input {...register("last_name")} placeholder="Doe" />
                                        {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Email</Label>
                                    <Input {...register("email")} type="email" placeholder="jane@example.com" />
                                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Phone (optional)</Label>
                                        <Input {...register("phone")} placeholder="+1 555 000 0000" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Initial Score (0-100)</Label>
                                        <Input {...register("score")} type="number" placeholder="50" min={0} max={100} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Interested Program</Label>
                                    <Select onValueChange={val => setValue("program_id", val)}>
                                        <SelectTrigger><SelectValue placeholder="No program selected" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">No Program</SelectItem>
                                            {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Assign to Agent</Label>
                                    <Select onValueChange={val => setValue("assigned_agent_id", val)}>
                                        <SelectTrigger><SelectValue placeholder="No agent assigned" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                            {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Create Lead
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary/20" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger className="w-[200px] bg-slate-50">
                        <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        <SelectItem value="-">Unassigned</SelectItem>
                        {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-[180px] bg-slate-50">
                        <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Pipeline Stages</SelectItem>
                        <SelectItem value="-">Unassigned Stage</SelectItem>
                        {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>

                {(search !== "" || filterProgram !== "all" || filterStage !== "all") && (
                    <Button variant="ghost" className="text-slate-500 h-9" onClick={() => { setSearch(""); setFilterProgram("all"); setFilterStage("all") }}>
                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reset
                    </Button>
                )}
            </div>

            <Card className="rounded-xl border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-100/50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-slate-700">Lead Info</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-700 hidden md:table-cell">Contact</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-700">Program / Stage</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-700">Score</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-700">Assignment</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="px-4 py-3"><Skeleton className="h-10 w-48" /></td>
                                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-8 w-32" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-8 w-40" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-6 w-8 mx-auto" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-8 w-40" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-6 w-6" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-slate-400">
                                        <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium text-slate-500">{search ? "No leads match your active filters." : "No leads exist in the database yet."}</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(lead => (
                                    <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/80 cursor-pointer transition-colors" onClick={() => openDetails(lead)}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                                    {lead.first_name.charAt(0)}{lead.last_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 leading-tight">{lead.first_name} {lead.last_name}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5 md:hidden">{lead.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <p className="flex items-center gap-1.5 text-slate-600 text-xs"><Mail className="h-3 w-3 text-slate-400" /> {lead.email}</p>
                                            {lead.phone && <p className="flex items-center gap-1.5 text-slate-500 text-xs mt-1"><Phone className="h-3 w-3 text-slate-400" /> {lead.phone}</p>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1.5 items-start">
                                                {lead.programs ? (
                                                    <Badge variant="outline" className="text-xs font-normal text-primary bg-primary/5 border-primary/20">
                                                        <BookOpen className="h-3 w-3 mr-1" /> {lead.programs.name}
                                                    </Badge>
                                                ) : <span className="text-xs text-slate-400">No Program</span>}

                                                {lead.kanban_stages ? (
                                                    <Badge variant="secondary" className="text-xs font-normal">
                                                        {lead.kanban_stages.name}
                                                    </Badge>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {lead.score > 80 && <Flame className="h-4 w-4 text-orange-500" />}
                                                <span className={`font-semibold ${lead.score > 80 ? 'text-orange-600' : 'text-slate-700'}`}>{lead.score || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            <Select
                                                value={lead.assigned_agent_id || "unassigned"}
                                                onValueChange={val => handleAssign(lead.id, val === "unassigned" ? "" : val)}
                                            >
                                                <SelectTrigger className="h-8 text-xs w-48 bg-white">
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned" className="text-slate-500 italic">Unassigned</SelectItem>
                                                    {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => handleDelete(lead.id, e)} disabled={deleting === lead.id}>
                                                {deleting === lead.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

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
                                                {activeLead.kanban_stages?.name || "Uncategorized"}
                                            </Badge>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-slate-500 mb-1 block">Assigned Agent</Label>
                                            <Select
                                                value={activeLead.assigned_agent_id || "unassigned"}
                                                onValueChange={val => handleAssign(activeLead.id, val === "unassigned" ? "" : val)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned" className="italic">Unassigned</SelectItem>
                                                    {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
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
