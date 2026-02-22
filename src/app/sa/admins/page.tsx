"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Search, Plus, Mail, ShieldAlert, Building2, MoreHorizontal, Loader2,
    Trash2, UserCheck, UserX, Send,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

type AdminProfile = {
    id: string
    email: string
    role: string
    university_id: string | null
    uni_name?: string
    created_at?: string
}

type University = { id: string; name: string }

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return "just now"
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlatformAdminsPage() {
    const [admins, setAdmins] = useState<AdminProfile[]>([])
    const [universities, setUniversities] = useState<University[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Invite modal state
    const [showInvite, setShowInvite] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteUniId, setInviteUniId] = useState("")
    const [inviteLoading, setInviteLoading] = useState(false)
    const [inviteResult, setInviteResult] = useState<{ type: "success" | "error"; msg: string } | null>(null)

    // Manual create modal state
    const [showCreate, setShowCreate] = useState(false)
    const [createEmail, setCreateEmail] = useState("")
    const [createPassword, setCreatePassword] = useState("")
    const [createUniId, setCreateUniId] = useState("")
    const [createRole, setCreateRole] = useState<"university_admin" | "agent">("university_admin")
    const [createLoading, setCreateLoading] = useState(false)
    const [createResult, setCreateResult] = useState<{ type: "success" | "error"; msg: string } | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchData = useCallback(async () => {
        setLoading(true)
        const [
            { data: unis },
            { data: profiles },
        ] = await Promise.all([
            supabase.from("universities").select("id, name").order("name"),
            supabase.from("profiles").select("id, email, role, university_id, created_at")
                .in("role", ["super_admin", "university_admin"])
                .order("created_at", { ascending: false }),
        ])

        setUniversities(unis ?? [])

        // Enrich profiles with university name
        const enriched = (profiles ?? []).map((p: any) => ({
            ...p,
            uni_name: unis?.find((u: University) => u.id === p.university_id)?.name ?? "Platform",
        }))
        setAdmins(enriched)
        setLoading(false)
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Deactivate / remove admin ─────────────────────────────────────────────
    const deactivateAdmin = async (admin: AdminProfile) => {
        if (!confirm(`Remove admin access for ${admin.email}? This changes their role to 'agent'.`)) return
        setActionLoading(admin.id)
        await supabase.from("profiles").update({ role: "agent" }).eq("id", admin.id)
        setAdmins(prev => prev.filter(a => a.id !== admin.id))
        setActionLoading(null)
    }

    // ── Invite: send magic link via Supabase Auth ─────────────────────────────
    const handleInvite = async () => {
        setInviteResult(null)
        if (!inviteEmail.trim()) { setInviteResult({ type: "error", msg: "Email is required." }); return }
        setInviteLoading(true)

        // Use the Supabase admin API via service-role edge function, or use signInWithOtp (magic link)
        // We use an edge-function style call using the REST API with service role to invite
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/invite`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
                },
                body: JSON.stringify({ email: inviteEmail.trim() }),
            })

            if (!res.ok) {
                // Fallback: use magic link OTP (works with anon key)
                const { error } = await supabase.auth.signInWithOtp({
                    email: inviteEmail.trim(),
                    options: {
                        shouldCreateUser: true,
                        emailRedirectTo: `${window.location.origin}/login`,
                    },
                })
                if (error) throw error
            }

            // Create / update the profile row for this university
            if (inviteUniId) {
                await supabase.from("profiles").upsert({
                    email: inviteEmail.trim(),
                    role: "university_admin",
                    university_id: inviteUniId,
                }, { onConflict: "email" })
            }

            setInviteResult({ type: "success", msg: `Magic link sent to ${inviteEmail}. They'll land on /login to set their password.` })
            setInviteEmail("")
            setInviteUniId("")
            fetchData()
        } catch (err: any) {
            setInviteResult({ type: "error", msg: err.message ?? "Failed to send invite." })
        }
        setInviteLoading(false)
    }

    // ── Manual create ─────────────────────────────────────────────────────────
    const handleCreate = async () => {
        setCreateResult(null)
        if (!createEmail.trim() || createPassword.length < 8) {
            setCreateResult({ type: "error", msg: "Email required. Password must be at least 8 characters." })
            return
        }
        setCreateLoading(true)

        try {
            // Sign up the new user (in a real app this would go through a service-role edge function)
            const { data, error } = await supabase.auth.signUp({
                email: createEmail.trim(),
                password: createPassword,
                options: { emailRedirectTo: `${window.location.origin}/login` },
            })
            if (error) throw error

            // The trigger creates the profile — but we can also upsert to set university + role immediately
            if (data.user) {
                await supabase.from("profiles").upsert({
                    id: data.user.id,
                    email: createEmail.trim(),
                    role: createRole,
                    university_id: createUniId || null,
                }, { onConflict: "id" })
            }

            setCreateResult({ type: "success", msg: `Account created for ${createEmail}. They may need to confirm their email.` })
            setCreateEmail("")
            setCreatePassword("")
            setCreateUniId("")
            fetchData()
        } catch (err: any) {
            setCreateResult({ type: "error", msg: err.message ?? "Failed to create account." })
        }
        setCreateLoading(false)
    }

    const filtered = admins.filter(a =>
        a.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.uni_name?.toLowerCase().includes(search.toLowerCase())
    )

    const superAdmins = admins.filter(a => a.role === "super_admin")
    const uniAdmins = admins.filter(a => a.role === "university_admin")

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Platform Administrators</h2>
                    <p className="text-slate-500 mt-1">Manage Super Admins and University Admins across all tenants.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search admins…"
                            className="pl-8 w-[220px] bg-white"
                        />
                    </div>
                    <Button variant="outline" className="bg-white" onClick={() => { setShowInvite(true); setInviteResult(null) }}>
                        <Send className="mr-2 h-4 w-4" /> Send Invite
                    </Button>
                    <Button onClick={() => { setShowCreate(true); setCreateResult(null) }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Admin
                    </Button>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Admin table */}
                <Card className="col-span-2 rounded-xl border-slate-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Administrator Directory</CardTitle>
                        <CardDescription>All users with elevated system access (live from Supabase).</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700 pl-6">User</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Tenant</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Added</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-slate-400">
                                            No admins found.
                                        </TableCell>
                                    </TableRow>
                                ) : filtered.map((admin) => (
                                    <TableRow key={admin.id} className="hover:bg-slate-50/50">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {admin.email?.substring(0, 2).toUpperCase() ?? "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <p className="text-sm font-medium text-slate-900 truncate max-w-[160px]">{admin.email}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate max-w-[120px]">{admin.uni_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={
                                                admin.role === "super_admin"
                                                    ? "bg-purple-100 text-purple-700 border-purple-200"
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                            }>
                                                {admin.role === "super_admin" && <ShieldAlert className="w-3 h-3 mr-1" />}
                                                {admin.role === "super_admin" ? "Super Admin" : "Uni Admin"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {admin.created_at ? timeAgo(admin.created_at) : "—"}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            {admin.role !== "super_admin" && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            {actionLoading === admin.id
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                            }
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem
                                                            className="text-red-600 cursor-pointer"
                                                            onClick={() => deactivateAdmin(admin)}
                                                        >
                                                            <UserX className="mr-2 h-4 w-4" /> Remove Admin
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Stats sidebar */}
                <Card className="bg-slate-50 border-slate-200 rounded-xl h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Security Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-medium text-slate-500">Super Admins</h4>
                            <p className="text-3xl font-heading font-bold text-slate-900 mt-1">
                                {loading ? <Skeleton className="h-8 w-12" /> : superAdmins.length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-medium text-slate-500">University Admins</h4>
                            <p className="text-3xl font-heading font-bold text-slate-900 mt-1">
                                {loading ? <Skeleton className="h-8 w-12" /> : uniAdmins.length}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h4 className="text-sm font-medium text-slate-500">Total Tenants</h4>
                            <p className="text-3xl font-heading font-bold text-slate-900 mt-1">
                                {loading ? <Skeleton className="h-8 w-12" /> : universities.length}
                            </p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            University Admins can only access data scoped to their <code>university_id</code> via Row Level Security.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* ── Invite Modal ───────────────────────────────────────────────── */}
            <Dialog open={showInvite} onOpenChange={open => { setShowInvite(open); if (!open) setInviteResult(null) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5 text-primary" /> Send Admin Invite
                        </DialogTitle>
                        <DialogDescription>
                            Send a magic-link email. The invitee clicks it to log in and gets the University Admin role.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Email Address *</Label>
                            <Input
                                type="email"
                                value={inviteEmail}
                                onChange={e => setInviteEmail(e.target.value)}
                                placeholder="admin@university.edu"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Assign to University</Label>
                            <select
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={inviteUniId}
                                onChange={e => setInviteUniId(e.target.value)}
                            >
                                <option value="">— Select university (optional) —</option>
                                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        {inviteResult && (
                            <div className={`text-xs rounded px-3 py-2 border ${inviteResult.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                                {inviteResult.msg}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                        <Button onClick={handleInvite} disabled={inviteLoading}>
                            {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Mail className="mr-2 h-4 w-4" /> Send Invite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Manual Create Modal ────────────────────────────────────────── */}
            <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); if (!open) setCreateResult(null) }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-primary" /> Create Admin Account
                        </DialogTitle>
                        <DialogDescription>
                            Manually provision a new admin account with email + password. The user can then log in immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Email Address *</Label>
                            <Input
                                type="email"
                                value={createEmail}
                                onChange={e => setCreateEmail(e.target.value)}
                                placeholder="admin@university.edu"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Password * (min 8 chars)</Label>
                            <Input
                                type="password"
                                value={createPassword}
                                onChange={e => setCreatePassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Assign to University</Label>
                            <select
                                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                value={createUniId}
                                onChange={e => setCreateUniId(e.target.value)}
                            >
                                <option value="">— Select university —</option>
                                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Role</Label>
                            <div className="flex gap-2">
                                {[
                                    { value: "university_admin", label: "University Admin" },
                                    { value: "agent", label: "Agent" },
                                ].map(r => (
                                    <button
                                        key={r.value}
                                        type="button"
                                        onClick={() => setCreateRole(r.value as any)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${createRole === r.value ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                                    >
                                        {r.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {createResult && (
                            <div className={`text-xs rounded px-3 py-2 border ${createResult.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
                                {createResult.msg}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={createLoading}>
                            {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" /> Create Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
