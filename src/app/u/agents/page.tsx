"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreHorizontal, Mail, Loader2, CheckCircle2, Users, Pencil, Power, Trash2 } from "lucide-react"

import { Eye, EyeOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface Agent {
    user_id: string
    display_name: string
    active: boolean
    phone: string | null
    university_id: string
    profiles: Array<{ email: string | null }>
    _lead_count?: number
}

const getProfileEmail = (agent: Agent): string => agent.profiles?.[0]?.email ?? ""

export default function TenantAgentManagementPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [universityId, setUniversityId] = useState<string | null>(null)

    // Invite dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isInviting, setIsInviting] = useState(false)
    const [inviteSuccess, setInviteSuccess] = useState(false)
    const [inviteError, setInviteError] = useState("")

    // Form fields
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isActive, setIsActive] = useState(true)
    const [editError, setEditError] = useState("")

    // Edit state
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [activeAgent, setActiveAgent] = useState<Agent | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchAgents = useCallback(async (uid: string) => {
        const { data: agentsData } = await supabase
            .from("agents")
            .select("user_id, display_name, active, phone, university_id, profiles(email)")
            .eq("university_id", uid)
            .order("display_name")

        if (!agentsData) { setAgents([]); return }

        const withCounts = await Promise.all(
            agentsData.map(async (agent) => {
                const { count } = await supabase
                    .from("leads")
                    .select("*", { count: "exact", head: true })
                    .eq("assigned_agent_id", agent.user_id)
                return { ...agent, _lead_count: count ?? 0 }
            })
        )
        setAgents(withCounts)
    }, [supabase])

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
            setUniversityId(profile.university_id)
            await fetchAgents(profile.university_id)
            setLoading(false)
        }
        init()
    }, [fetchAgents, supabase])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsInviting(true)
        setInviteError("")
        setInviteSuccess(false)
        try {
            const { error } = await supabase.functions.invoke("provisionAgent", {
                body: { name, email, phone },
            })
            if (error) throw error
            setInviteSuccess(true)
            if (universityId) await fetchAgents(universityId)
            setTimeout(() => {
                setInviteSuccess(false)
                setName(""); setEmail(""); setPhone("")
                setDialogOpen(false)
            }, 2500)
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to provision agent."
            setInviteError(msg)
        } finally {
            setIsInviting(false)
        }
    }

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeAgent || !name.trim()) return
        setActionLoading(true)
        setEditError("")

        const originalEmail = getProfileEmail(activeAgent)
        const emailChanged = email.trim() !== "" && email.trim() !== originalEmail
        const pwdChanged = password.trim() !== ""
        const statusChanged = isActive !== activeAgent.active

        try {
            // Update Auth Credentials if email or password changed
            if (emailChanged || pwdChanged) {
                const res = await fetch("/api/agents/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        agentId: activeAgent.user_id,
                        email: emailChanged ? email.trim() : undefined,
                        password: pwdChanged ? password : undefined
                    })
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || "Failed to update security credentials")
            }

            // Update basic agent metadata & status
            const updatePayload: any = { display_name: name.trim(), phone: phone.trim() }
            if (statusChanged) updatePayload.active = isActive

            const { error } = await supabase
                .from('agents')
                .update(updatePayload)
                .eq('user_id', activeAgent.user_id)

            if (error) throw error

            // Optimistic localized UI update
            setAgents(prev => prev.map(a =>
                a.user_id === activeAgent.user_id
                    ? {
                        ...a,
                        display_name: name.trim(),
                        phone: phone.trim(),
                        active: isActive,
                        profiles: emailChanged ? [{ email: email.trim() }] : a.profiles
                    }
                    : a
            ))
            setEditDialogOpen(false)
        } catch (err: any) {
            setEditError(err.message || "Failed to save changes")
        } finally {
            setActionLoading(false)
        }
    }

    const toggleStatus = async (agent: Agent) => {
        const newStatus = !agent.active
        const { error } = await supabase
            .from('agents')
            .update({ active: newStatus })
            .eq('user_id', agent.user_id)

        if (!error) {
            setAgents(prev => prev.map(a =>
                a.user_id === agent.user_id ? { ...a, active: newStatus } : a
            ))
        }
    }

    const handleDelete = async (agentId: string) => {
        if (!confirm("Are you sure? This removes the agent from your university and unassigns their leads.")) return
        const { error } = await supabase.from('agents').delete().eq('user_id', agentId)
        if (!error) {
            setAgents(prev => prev.filter(a => a.user_id !== agentId))
        }
    }

    const openEdit = (agent: Agent) => {
        setActiveAgent(agent)
        setName(agent.display_name)
        setEmail(getProfileEmail(agent))
        setPhone(agent.phone || "")
        setPassword("") // Blank default context for security
        setIsActive(agent.active)
        setEditError("")
        setEditDialogOpen(true)
    }

    const filtered = agents.filter(a =>
        `${a.display_name} ${getProfileEmail(a)}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Agent Management</h2>
                    <p className="text-slate-500 mt-1">Onboard staff, assign departments, and track active conversion agents.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search"
                            placeholder="Search agents..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 w-[250px] bg-white rounded-md border-slate-200 focus-visible:ring-primary"
                        />
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open)
                        if (open) { setName(""); setEmail(""); setPhone(""); setInviteError("") }
                    }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Invite Agent</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Provision New Agent</DialogTitle>
                                <DialogDescription>
                                    This will create a user account, assign permissions, and send an email invite.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Work Email</Label>
                                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@university.edu" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone (Optional)</Label>
                                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                                {inviteError && <p className="text-sm text-red-600 mb-4">{inviteError}</p>}
                                {inviteSuccess && (
                                    <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center text-sm">
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Agent provisioned and invited!
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button type="submit" disabled={isInviting}>
                                        {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                        Send Invite
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="rounded-xl border-slate-200">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-slate-500">
                                {search ? "No agents match your search." : "No agents yet. Invite your first agent above."}
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700 w-[300px]">Agent Profile</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center">Active Leads</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(agent => (
                                    <TableRow key={agent.user_id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-slate-200">
                                                    <AvatarFallback className="bg-blue-50 text-primary text-sm font-semibold">
                                                        {agent.display_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-slate-900">{agent.display_name}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600 flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                {getProfileEmail(agent) || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={agent.active
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                                    : "bg-slate-100 text-slate-500 border-slate-200"}
                                            >
                                                {agent.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-medium text-slate-900">{agent._lead_count}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(agent)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit Configuration
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(agent.user_id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Remove Team Member
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agent Configuration</DialogTitle>
                        <DialogDescription>Manage profile settings, credentials, and access.</DialogDescription>
                    </DialogHeader>
                    {editError && <div className="p-3 mb-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm">{editError}</div>}
                    <form onSubmit={handleEditSave} className="space-y-5 pt-2">

                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-lg flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base font-semibold">Agent Access</Label>
                                <p className="text-xs text-slate-500">Allow agent to login and view assigned leads</p>
                            </div>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>

                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="editName">Full Name</Label>
                                <Input
                                    id="editName"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editEmail">Sign-in Email</Label>
                                <Input
                                    id="editEmail"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editPhone">Phone Number</Label>
                                <Input
                                    id="editPhone"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="editPassword" className="flex items-center justify-between">
                                    <span>Reset Password</span>
                                    <span className="text-[10px] uppercase text-slate-400 font-bold whitespace-nowrap">Optional</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="editPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Leave blank to drop"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
