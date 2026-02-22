"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { createBrowserClient } from "@supabase/ssr"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Search, Users, Trash2, Loader2, Mail, Phone, UserCheck } from "lucide-react"

const leadSchema = z.object({
    first_name: z.string().min(2, "First name is required"),
    last_name: z.string().min(2, "Last name is required"),
    email: z.string().email("Valid email required"),
    phone: z.string().optional(),
    source: z.string().optional(),
    assigned_agent_id: z.string().optional(),
})
type LeadForm = z.infer<typeof leadSchema>

export default function TenantLeadsPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState("")
    const [universityId, setUniversityId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<LeadForm>({
        resolver: zodResolver(leadSchema),
    })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
        if (!profile?.university_id) return
        setUniversityId(profile.university_id)

        const [{ data: leadsData }, { data: agentsData }] = await Promise.all([
            supabase.from("leads").select("id, first_name, last_name, email, phone, source, assigned_agent_id, created_at, profiles(first_name, last_name)").eq("university_id", profile.university_id).order("created_at", { ascending: false }),
            supabase.from("agents").select("user_id, display_name").eq("university_id", profile.university_id).eq("active", true),
        ])
        setLeads(leadsData ?? [])
        setAgents(agentsData ?? [])
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
            assigned_agent_id: data.assigned_agent_id || null,
        })
        if (!error) {
            reset()
            setDialogOpen(false)
            await fetchData()
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        await supabase.from("leads").delete().eq("id", id)
        setLeads(prev => prev.filter(l => l.id !== id))
        setDeleting(null)
    }

    const handleAssign = async (leadId: string, agentUserId: string) => {
        await supabase.from("leads").update({ assigned_agent_id: agentUserId || null }).eq("id", leadId)
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_agent_id: agentUserId || null } : l))
    }

    const filtered = leads.filter(l =>
        `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Leads Management</h1>
                    <p className="text-slate-500 mt-1">View, create, assign, and manage your university's lead pipeline.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Lead</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Add New Lead</DialogTitle>
                            <DialogDescription>Create a manual lead entry and optionally assign it to an agent.</DialogDescription>
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
                                        <Label>Source</Label>
                                        <Input {...register("source")} placeholder="manual, form, import..." />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Assign to Agent (optional)</Label>
                                    <Select onValueChange={val => setValue("assigned_agent_id", val)}>
                                        <SelectTrigger><SelectValue placeholder="No agent assigned" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">No assignment</SelectItem>
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

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input className="pl-8" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <p className="text-sm text-slate-500">{filtered.length} leads</p>
            </div>

            <Card className="rounded-xl border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Lead</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Contact</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Source</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Assigned Agent</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="border-b border-slate-100">
                                        <td className="px-4 py-3"><Skeleton className="h-8 w-48" /></td>
                                        <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-8 w-40" /></td>
                                        <td className="px-4 py-3"><Skeleton className="h-6 w-6" /></td>
                                    </tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-slate-400">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p className="font-medium text-slate-500">{search ? "No leads match your search." : "No leads yet. Add the first one above."}</p>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(lead => (
                                    <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold text-sm shrink-0">
                                                    {lead.first_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                                                    <p className="text-xs text-slate-500 md:hidden">{lead.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <p className="flex items-center gap-1 text-slate-600"><Mail className="h-3 w-3" /> {lead.email}</p>
                                            {lead.phone && <p className="flex items-center gap-1 text-slate-400 text-xs mt-0.5"><Phone className="h-3 w-3" /> {lead.phone}</p>}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell">
                                            <Badge variant="outline" className="text-xs capitalize">{lead.source || "manual"}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Select
                                                value={lead.assigned_agent_id || "unassigned"}
                                                onValueChange={val => handleAssign(lead.id, val === "unassigned" ? "" : val)}
                                            >
                                                <SelectTrigger className="h-8 text-xs w-40">
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                                    {agents.map(a => <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => handleDelete(lead.id)} disabled={deleting === lead.id}>
                                                {deleting === lead.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
