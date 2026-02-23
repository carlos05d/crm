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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import {
    Search, Plus, MoreHorizontal, Mail, Loader2, CheckCircle2, Users, Pencil,
    Power, Trash2, KeyRound, Eye, EyeOff, Phone, User, Activity, Shield, AlertTriangle
} from "lucide-react"
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

const getEmail = (a: Agent) => a.profiles?.[0]?.email ?? "—"

export default function TenantAgentManagementPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [universityId, setUniversityId] = useState<string | null>(null)

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
    const [showPassword, setShowPassword] = useState(false)

    // Detail sheet
    const [sheetOpen, setSheetOpen] = useState(false)
    const [sheetAgent, setSheetAgent] = useState<Agent | null>(null)
    const [sheetLoading, setSheetLoading] = useState(false)
    const [sheetError, setSheetError] = useState("")
    const [sheetSuccess, setSheetSuccess] = useState("")

    // Reset password state in sheet
    const [resetPwd, setResetPwd] = useState("")
    const [showResetPwd, setShowResetPwd] = useState(false)

    // Delete confirm dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchAgents = useCallback(async (uid: string) => {
        const { data } = await supabase
            .from("agents")
            .select("user_id, display_name, active, phone, university_id, profiles(email)")
            .eq("university_id", uid)
            .order("display_name")

        if (!data) { setAgents([]); return }

        const withCounts = await Promise.all(data.map(async (a) => {
            const { count } = await supabase.from("leads")
                .select("*", { count: "exact", head: true })
                .eq("assigned_agent_id", a.user_id)
            return { ...a, _lead_count: count ?? 0 }
        }))
        setAgents(withCounts)
    }, [supabase])

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
            if (!profile?.university_id) return
            setUniversityId(profile.university_id)
            await fetchAgents(profile.university_id)
            setLoading(false)
        }
        init()
    }, [fetchAgents, supabase])

    // ─── Provision Agent ────────────────────────────────────────────────────
    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsInviting(true)
        setInviteError("")
        setInviteSuccess(false)
        try {
            const res = await fetch("/api/agents/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, phone, password: provisionMode === 'manual' ? password : "", mode: provisionMode })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to provision agent")
            setInviteSuccess(true)
            if (universityId) await fetchAgents(universityId)
            setTimeout(() => {
                setInviteSuccess(false)
                setName(""); setEmail(""); setPhone(""); setPassword("")
                setDialogOpen(false)
            }, 2000)
        } catch (err: any) {
            setInviteError(err.message || "Failed to provision agent.")
        } finally {
            setIsInviting(false)
        }
    }

    // ─── Open Detail Sheet ───────────────────────────────────────────────────
    const openSheet = (agent: Agent) => {
        setSheetAgent(agent)
        setResetPwd("")
        setSheetError("")
        setSheetSuccess("")
        setSheetOpen(true)
    }

    // ─── Toggle Active / Inactive ────────────────────────────────────────────
    const handleToggleStatus = async (agent: Agent) => {
        const newStatus = !agent.active
        setSheetLoading(true)
        setSheetError("")
        const { error } = await supabase.from("agents").update({ active: newStatus }).eq("user_id", agent.user_id)
        if (error) {
            setSheetError("Failed to update status: " + error.message)
        } else {
            setAgents(prev => prev.map(a => a.user_id === agent.user_id ? { ...a, active: newStatus } : a))
            setSheetAgent(prev => prev ? { ...prev, active: newStatus } : prev)
            setSheetSuccess(newStatus ? "Agent activated successfully." : "Agent deactivated.")
            setTimeout(() => setSheetSuccess(""), 3000)
        }
        setSheetLoading(false)
    }

    // ─── Reset Password ──────────────────────────────────────────────────────
    const handleResetPassword = async () => {
        if (!sheetAgent || !resetPwd || resetPwd.length < 6) {
            setSheetError("Password must be at least 6 characters.")
            return
        }
        setSheetLoading(true)
        setSheetError("")
        try {
            const res = await fetch("/api/agents/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agentId: sheetAgent.user_id, password: resetPwd })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setResetPwd("")
            setSheetSuccess("Password reset successfully!")
            setTimeout(() => setSheetSuccess(""), 3000)
        } catch (err: any) {
            setSheetError(err.message || "Password reset failed.")
        } finally {
            setSheetLoading(false)
        }
    }

    // ─── Delete Agent ────────────────────────────────────────────────────────
    const confirmDelete = (agent: Agent) => {
        setAgentToDelete(agent)
        setDeleteDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!agentToDelete) return
        setDeleteLoading(true)
        // Delete agent row (profile stays; auth user stays unless you also call /api/agents/delete)
        const { error } = await supabase.from("agents").delete().eq("user_id", agentToDelete.user_id)
        if (!error) {
            setAgents(prev => prev.filter(a => a.user_id !== agentToDelete.user_id))
            if (sheetAgent?.user_id === agentToDelete.user_id) setSheetOpen(false)
        }
        setDeleteLoading(false)
        setDeleteDialogOpen(false)
        setAgentToDelete(null)
    }

    const filtered = agents.filter(a =>
        `${a.display_name} ${getEmail(a)}`.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Agent Management</h2>
                    <p className="text-slate-500 mt-1">Onboard, configure and manage your conversion agents.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search" placeholder="Search agents..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="pl-8 w-[240px] bg-white border-slate-200"
                        />
                    </div>
                    {/* Provision Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open)
                        if (open) { setName(""); setEmail(""); setPhone(""); setPassword(""); setInviteError("") }
                    }}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> Invite Agent</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Provision New Agent</DialogTitle>
                                <DialogDescription>
                                    {provisionMode === "invite"
                                        ? "Send a magic link — agent sets their own password."
                                        : "Manually create the account with a known password."}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite}>
                                <div className="grid gap-4 py-4">
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        <button type="button" onClick={() => setProvisionMode("invite")}
                                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${provisionMode === "invite" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
                                            Send Email Invite
                                        </button>
                                        <button type="button" onClick={() => setProvisionMode("manual")}
                                            className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-all ${provisionMode === "manual" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
                                            Set Password Manually
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Work Email</Label>
                                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@university.edu" />
                                    </div>
                                    {provisionMode === "manual" && (
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Phone (Optional)</Label>
                                        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                                {inviteError && <p className="text-sm text-red-600 mb-4">{inviteError}</p>}
                                {inviteSuccess && (
                                    <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center text-sm">
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Agent provisioned successfully!
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

            {/* Table */}
            <Card className="rounded-xl border-slate-200">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400">
                            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium text-slate-500">{search ? "No agents match your search." : "No agents yet. Invite your first agent above."}</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700">Agent</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Phone</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                    <TableHead className="font-semibold text-slate-700 text-center">Leads</TableHead>
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
                                                        {agent.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <p className="font-medium text-slate-900">{agent.display_name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600 flex items-center gap-1.5">
                                                <Mail className="h-3.5 w-3.5 text-slate-400" />{getEmail(agent)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-500">{agent.phone || "—"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={agent.active
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
                                                : "bg-slate-100 text-slate-500 border-slate-200"}>
                                                {agent.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-medium text-slate-900">{agent._lead_count}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {/* View Details */}
                                                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openSheet(agent)}>
                                                    View Details
                                                </Button>
                                                {/* Quick Actions */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => { openSheet(agent) }}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit / Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(agent)}>
                                                            <Power className="mr-2 h-4 w-4" />
                                                            {agent.active ? "Deactivate" : "Activate"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => confirmDelete(agent)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Agent
                                                        </DropdownMenuItem>
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

            {/* ─── Agent Detail Sheet ──────────────────────────────────────────── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-slate-200">
                                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                                    {sheetAgent?.display_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <SheetTitle className="text-lg">{sheetAgent?.display_name}</SheetTitle>
                                <SheetDescription>{getEmail(sheetAgent as Agent)}</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    {sheetError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />{sheetError}
                        </div>
                    )}
                    {sheetSuccess && (
                        <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />{sheetSuccess}
                        </div>
                    )}

                    {sheetAgent && (
                        <div className="space-y-5">
                            {/* Profile Info */}
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Profile Information</p>
                                <div className="space-y-3 bg-slate-50 rounded-xl p-4">
                                    <div className="flex items-center gap-3">
                                        <User className="h-4 w-4 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400">Full Name</p>
                                            <p className="text-sm font-semibold text-slate-900">{sheetAgent.display_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400">Email (Login)</p>
                                            <p className="text-sm font-semibold text-slate-900">{getEmail(sheetAgent)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400">Phone</p>
                                            <p className="text-sm font-semibold text-slate-900">{sheetAgent.phone || "Not set"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Activity className="h-4 w-4 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-400">Active Leads</p>
                                            <p className="text-sm font-bold text-primary">{sheetAgent._lead_count ?? 0} leads assigned</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Account Status */}
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Account Status</p>
                                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Shield className={`h-5 w-5 ${sheetAgent.active ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {sheetAgent.active ? "Access Enabled" : "Access Disabled"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {sheetAgent.active ? "Agent can log in and see assigned leads" : "Agent is blocked from logging in"}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={sheetAgent.active}
                                        disabled={sheetLoading}
                                        onCheckedChange={() => handleToggleStatus(sheetAgent)}
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Reset Password */}
                            <div>
                                <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Reset Password</p>
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Input
                                            type={showResetPwd ? "text" : "password"}
                                            value={resetPwd}
                                            onChange={e => setResetPwd(e.target.value)}
                                            placeholder="Enter new password (min 6 chars)"
                                            className="pr-10"
                                        />
                                        <button type="button" onClick={() => setShowResetPwd(!showResetPwd)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                            {showResetPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <Button
                                        variant="outline" className="w-full" disabled={sheetLoading || !resetPwd}
                                        onClick={handleResetPassword}
                                    >
                                        {sheetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                        Reset Password
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Danger Zone */}
                            <div>
                                <p className="text-xs uppercase font-bold text-red-400 tracking-wider mb-3">Danger Zone</p>
                                <Button
                                    variant="outline"
                                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                    onClick={() => confirmDelete(sheetAgent)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete This Agent
                                </Button>
                                <p className="text-xs text-slate-400 mt-2 text-center">
                                    This removes the agent from your team. Their leads stay in the system.
                                </p>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* ─── Delete Confirm Dialog ───────────────────────────────────────── */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Delete Agent
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{agentToDelete?.display_name}</strong> from your team?
                            Their assigned leads will become unassigned. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
                            {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
