"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
    Search, Plus, MoreHorizontal, Mail, Loader2, CheckCircle2,
    Users, Power, Trash2, KeyRound, Eye, EyeOff, Phone,
    User, Activity, Shield, AlertTriangle, Lock, ChevronRight
} from "lucide-react"

interface Agent {
    user_id: string
    display_name: string
    active: boolean
    phone: string | null
    university_id: string
    email: string | null
    lead_count: number
    created_at?: string
}

export default function TenantAgentManagementPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    // Provision dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [provisionMode, setProvisionMode] = useState<"invite" | "manual">("invite")
    const [isInviting, setIsInviting] = useState(false)
    const [inviteSuccess, setInviteSuccess] = useState(false)
    const [inviteError, setInviteError] = useState("")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [password, setPassword] = useState("")
    const [showProvPwd, setShowProvPwd] = useState(false)

    // Detail sheet
    const [sheetOpen, setSheetOpen] = useState(false)
    const [sheetAgent, setSheetAgent] = useState<Agent | null>(null)
    const [sheetLoading, setSheetLoading] = useState(false)
    const [sheetError, setSheetError] = useState("")
    const [sheetSuccess, setSheetSuccess] = useState("")
    const [resetPwd, setResetPwd] = useState("")
    const [showResetPwd, setShowResetPwd] = useState(false)

    // Delete confirm
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const fetchAgents = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/u/agents')
            const data = await res.json()
            if (res.ok) setAgents(data.agents || [])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAgents() }, [fetchAgents])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsInviting(true); setInviteError(""); setInviteSuccess(false)
        try {
            const res = await fetch("/api/agents/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password: provisionMode === 'manual' ? password : "", mode: provisionMode })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to provision agent")
            setInviteSuccess(true)
            await fetchAgents()
            setTimeout(() => { setInviteSuccess(false); setName(""); setEmail(""); setPhone(""); setPassword(""); setDialogOpen(false) }, 2000)
        } catch (err: any) {
            setInviteError(err.message || "Failed to provision agent.")
        } finally { setIsInviting(false) }
    }

    const openSheet = (agent: Agent) => {
        setSheetAgent(agent); setResetPwd(""); setSheetError(""); setSheetSuccess(""); setSheetOpen(true)
    }

    const handleToggleStatus = async (agent: Agent) => {
        const newStatus = !agent.active
        setSheetLoading(true); setSheetError("")
        const res = await fetch('/api/u/agents', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: agent.user_id, active: newStatus })
        })
        if (!res.ok) {
            // Fallback: use anon client directly (active is not sensitive)
            const { createBrowserClient } = await import('@supabase/ssr')
            const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
            const { error } = await supabase.from('agents').update({ active: newStatus }).eq('user_id', agent.user_id)
            if (error) { setSheetError("Failed to update status: " + error.message); setSheetLoading(false); return }
        }
        setAgents(prev => prev.map(a => a.user_id === agent.user_id ? { ...a, active: newStatus } : a))
        setSheetAgent(prev => prev ? { ...prev, active: newStatus } : prev)
        setSheetSuccess(newStatus ? "Agent activated ✓" : "Agent deactivated ✓")
        setTimeout(() => setSheetSuccess(""), 3000)
        setSheetLoading(false)
    }

    const handleResetPassword = async () => {
        if (!sheetAgent || !resetPwd || resetPwd.length < 6) { setSheetError("Password must be at least 6 characters."); return }
        setSheetLoading(true); setSheetError("")
        try {
            const res = await fetch("/api/agents/update", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentId: sheetAgent.user_id, password: resetPwd })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setResetPwd(""); setSheetSuccess("Password reset successfully! ✓")
            setTimeout(() => setSheetSuccess(""), 3000)
        } catch (err: any) { setSheetError(err.message || "Password reset failed.") }
        finally { setSheetLoading(false) }
    }

    const confirmDelete = (agent: Agent) => { setAgentToDelete(agent); setDeleteDialogOpen(true) }

    const handleDelete = async () => {
        if (!agentToDelete) return
        setDeleteLoading(true)
        const { createBrowserClient } = await import('@supabase/ssr')
        const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
        const { error } = await supabase.from('agents').delete().eq('user_id', agentToDelete.user_id)
        if (!error) {
            setAgents(prev => prev.filter(a => a.user_id !== agentToDelete.user_id))
            if (sheetAgent?.user_id === agentToDelete.user_id) setSheetOpen(false)
        }
        setDeleteLoading(false); setDeleteDialogOpen(false); setAgentToDelete(null)
    }

    const filtered = agents.filter(a =>
        `${a.display_name} ${a.email || ''}`.toLowerCase().includes(search.toLowerCase())
    )

    const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

    return (
        <div className="space-y-6 font-sans">
            {/* ─── Header ──────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Agent Management</h2>
                    <p className="text-slate-500 mt-1">Manage your team — credentials, access, and performance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input type="search" placeholder="Search agents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 w-[240px] bg-white border-slate-200" />
                    </div>
                    {/* Provision Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (open) { setName(""); setEmail(""); setPhone(""); setPassword(""); setInviteError("") } }}>
                        <DialogTrigger asChild>
                            <Button className="shadow-sm"><Plus className="mr-2 h-4 w-4" /> Invite Agent</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Provision New Agent</DialogTitle>
                                <DialogDescription>
                                    {provisionMode === "invite" ? "Send a magic link — agent sets their own password." : "Create account with a known password. They can log in immediately."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite}>
                                <div className="grid gap-4 py-4">
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {(["invite", "manual"] as const).map(mode => (
                                            <button key={mode} type="button" onClick={() => setProvisionMode(mode)}
                                                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${provisionMode === mode ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>
                                                {mode === "invite" ? "Send Email Invite" : "Set Password Manually"}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-2"><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" /></div>
                                    <div className="space-y-2"><Label>Work Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@university.edu" /></div>
                                    {provisionMode === "manual" && (
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <div className="relative">
                                                <Input type={showProvPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" className="pr-10" />
                                                <button type="button" onClick={() => setShowProvPwd(!showProvPwd)} className="absolute right-3 top-2.5 text-slate-400">{showProvPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2"><Label>Phone (Optional)</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" /></div>
                                </div>
                                {inviteError && <p className="text-sm text-red-600 mb-4 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{inviteError}</p>}
                                {inviteSuccess && <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center text-sm"><CheckCircle2 className="h-4 w-4 mr-2" />Agent provisioned successfully!</div>}
                                <DialogFooter>
                                    <Button type="submit" disabled={isInviting}>
                                        {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                        {provisionMode === "invite" ? "Send Invite" : "Create Agent"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* ─── Stats Row ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total Agents", value: agents.length, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Active", value: agents.filter(a => a.active).length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Total Leads", value: agents.reduce((s, a) => s + a.lead_count, 0), icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
                ].map(s => (
                    <Card key={s.label} className="border-slate-200 rounded-xl">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                            <div><p className="text-xl font-heading font-bold text-slate-900">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ─── Table ───────────────────────────────────────────────────── */}
            <Card className="rounded-xl border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-slate-500">{search ? "No agents match your search." : "No agents yet. Invite your first agent above."}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50/80">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Agent</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Email</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Phone</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-600 text-xs uppercase tracking-wide text-center">Leads</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(agent => (
                                    <TableRow key={agent.user_id} className="hover:bg-slate-50/60 cursor-pointer transition-colors" onClick={() => openSheet(agent)}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                                    <AvatarFallback className={`text-sm font-bold ${agent.active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>
                                                        {initials(agent.display_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{agent.display_name}</p>
                                                    <p className="text-xs text-slate-400">Agent</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-slate-700">{agent.email || <span className="text-slate-400 italic">No email</span>}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-500">{agent.phone || "—"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={agent.active
                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                : "bg-slate-100 text-slate-500 border border-slate-200"}>
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${agent.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                {agent.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-bold text-slate-900">{agent.lead_count}</span>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="sm" className="h-8 text-xs text-primary hover:bg-primary/5" onClick={() => openSheet(agent)}>
                                                    Details <ChevronRight className="ml-1 h-3 w-3" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => openSheet(agent)}><User className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(agent)}><Power className="mr-2 h-4 w-4" />{agent.active ? "Deactivate" : "Activate"}</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => confirmDelete(agent)}><Trash2 className="mr-2 h-4 w-4" /> Delete Agent</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ─── Premium Agent Detail Sheet ───────────────────────────────── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-[460px] sm:w-[500px] p-0 overflow-y-auto">
                    {sheetAgent && (
                        <>
                            {/* Hero header */}
                            <div className="bg-gradient-to-br from-primary/5 via-blue-50 to-slate-50 p-6 border-b border-slate-100">
                                <div className="flex items-start justify-between mb-4">
                                    <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                                        <AvatarFallback className={`text-xl font-bold ${sheetAgent.active ? 'bg-primary text-white' : 'bg-slate-300 text-slate-600'}`}>
                                            {initials(sheetAgent.display_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Badge className={sheetAgent.active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${sheetAgent.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        {sheetAgent.active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <SheetTitle className="text-2xl font-heading font-bold text-slate-900">{sheetAgent.display_name}</SheetTitle>
                                <p className="text-slate-500 text-sm mt-0.5">University Agent</p>
                                <div className="flex gap-4 mt-4">
                                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-white shadow-sm">
                                        <p className="text-lg font-bold text-primary">{sheetAgent.lead_count}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Leads</p>
                                    </div>
                                    <div className="bg-white/80 rounded-lg px-3 py-2 text-center border border-white shadow-sm">
                                        <p className="text-lg font-bold text-slate-700">{sheetAgent.created_at ? new Date(sheetAgent.created_at).toLocaleDateString('en', { month: 'short', year: '2-digit' }) : 'N/A'}</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Joined</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Alerts */}
                                {sheetError && (
                                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />{sheetError}
                                    </div>
                                )}
                                {sheetSuccess && (
                                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 shrink-0" />{sheetSuccess}
                                    </div>
                                )}

                                {/* Contact Info */}
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-3">Contact Information</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="p-2 bg-blue-100 rounded-lg"><Mail className="h-4 w-4 text-blue-600" /></div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] text-slate-400 font-medium uppercase mb-0.5">Login Email</p>
                                                <p className="text-sm font-semibold text-slate-900 break-all">{sheetAgent.email || <span className="text-red-400 italic">Email not found — check RLS</span>}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="p-2 bg-purple-100 rounded-lg"><Phone className="h-4 w-4 text-purple-600" /></div>
                                            <div>
                                                <p className="text-[11px] text-slate-400 font-medium uppercase mb-0.5">Phone Number</p>
                                                <p className="text-sm font-semibold text-slate-900">{sheetAgent.phone || <span className="text-slate-400">Not set</span>}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="p-2 bg-amber-100 rounded-lg"><Lock className="h-4 w-4 text-amber-600" /></div>
                                            <div>
                                                <p className="text-[11px] text-slate-400 font-medium uppercase mb-0.5">Password</p>
                                                <p className="text-sm font-mono font-semibold text-slate-500">•••••••• (hashed, use reset below)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-slate-100" />

                                {/* Account Access */}
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-3">Account Access</p>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${sheetAgent.active ? 'bg-emerald-100' : 'bg-slate-200'}`}>
                                                <Shield className={`h-4 w-4 ${sheetAgent.active ? 'text-emerald-600' : 'text-slate-400'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{sheetAgent.active ? "Access Enabled" : "Access Disabled"}</p>
                                                <p className="text-xs text-slate-400">{sheetAgent.active ? "Can log in and view leads" : "Blocked from logging in"}</p>
                                            </div>
                                        </div>
                                        <Switch checked={sheetAgent.active} disabled={sheetLoading} onCheckedChange={() => handleToggleStatus(sheetAgent)} />
                                    </div>
                                </div>

                                <Separator className="bg-slate-100" />

                                {/* Reset Password */}
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-3">Reset Password</p>
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Input
                                                type={showResetPwd ? "text" : "password"}
                                                value={resetPwd} onChange={e => setResetPwd(e.target.value)}
                                                placeholder="New password (min 6 characters)" className="pr-10 font-mono"
                                            />
                                            <button type="button" onClick={() => setShowResetPwd(!showResetPwd)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                                {showResetPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <Button variant="outline" className="w-full border-slate-200" disabled={sheetLoading || !resetPwd || resetPwd.length < 6} onClick={handleResetPassword}>
                                            {sheetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                            Set New Password
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="bg-slate-100" />

                                {/* Danger Zone */}
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-red-400 tracking-widest mb-3">Danger Zone</p>
                                    <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors" onClick={() => confirmDelete(sheetAgent)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove Agent from Team
                                    </Button>
                                    <p className="text-xs text-slate-400 mt-2 text-center">Their leads will become unassigned. This cannot be undone.</p>
                                </div>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>

            {/* ─── Delete Confirm ───────────────────────────────────────────── */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Delete Agent</DialogTitle>
                        <DialogDescription>
                            Remove <strong>{agentToDelete?.display_name}</strong> from your team? Their {agentToDelete?.lead_count} assigned lead(s) will become unassigned. This <strong>cannot</strong> be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
