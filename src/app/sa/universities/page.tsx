"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Search, Plus, MoreHorizontal, Building2, CheckCircle2, Ban, Eye,
    Users, Globe, Calendar, ShieldOff, ShieldCheck, Loader2, X,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

type University = {
    id: string
    name: string
    subdomain: string
    plan_type: string | null
    status: string | null
    created_at: string
    admin_count?: number
    lead_count?: number
    agent_count?: number
}

const PLAN_COLORS: Record<string, string> = {
    basic: "bg-slate-100 text-slate-700",
    premium: "bg-blue-50 text-blue-700",
    enterprise: "bg-purple-50 text-purple-700",
}

export default function UniversitiesManagementPage() {
    const [universities, setUniversities] = useState<University[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    // Modals
    const [detailUni, setDetailUni] = useState<(University & { admins?: any[] }) | null>(null)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [newUni, setNewUni] = useState({ name: "", slug: "", plan: "basic", adminEmail: "", adminPassword: "" })
    const [addLoading, setAddLoading] = useState(false)
    const [addError, setAddError] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchUniversities = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/sa/universities')
            const data = await res.json()
            if (res.ok) {
                setUniversities(data.unis || [])
            }
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }, [])

    useEffect(() => { fetchUniversities() }, [fetchUniversities])

    // ── Toggle active / suspended ──────────────────────────────────────────────
    const toggleStatus = async (uni: University) => {
        const newStatus = uni.status === "active" ? "suspended" : "active"
        setActionLoading(uni.id)
        await supabase.from("universities").update({ status: newStatus }).eq("id", uni.id)
        setUniversities(prev => prev.map(u => u.id === uni.id ? { ...u, status: newStatus } : u))
        if (detailUni?.id === uni.id) setDetailUni(d => d ? { ...d, status: newStatus } : d)
        setActionLoading(null)
    }

    // ── View detail ────────────────────────────────────────────────────────────
    const viewDetail = async (uni: University) => {
        setDetailUni({ ...uni })
        const { data: admins } = await supabase
            .from("profiles")
            .select("id, email, role")
            .eq("university_id", uni.id)
            .in("role", ["university_admin", "agent"])
        setDetailUni({ ...uni, admins: admins ?? [] })
    }

    // ── Add university ────────────────────────────────────────────────────────
    const handleAddUniversity = async () => {
        setAddError("")
        if (!newUni.name.trim() || !newUni.slug.trim()) {
            setAddError("University name and slug are required.")
            return
        }
        setAddLoading(true)
        const { data: uniRow, error: uniErr } = await supabase
            .from("universities")
            .insert({ name: newUni.name.trim(), subdomain: newUni.slug.trim().toLowerCase(), plan_type: newUni.plan, status: "active" })
            .select("id")
            .single()

        if (uniErr) { setAddError(uniErr.message); setAddLoading(false); return }

        setAddLoading(false)
        setShowAddDialog(false)
        setNewUni({ name: "", slug: "", plan: "basic", adminEmail: "", adminPassword: "" })
        fetchUniversities()
    }

    const filtered = universities.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        (u.subdomain ?? "").toLowerCase().includes(search.toLowerCase())
    )

    const isActive = (u: University) =>
        u.status === "active" || u.status == null

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">University Tenants</h2>
                    <p className="text-slate-500 mt-1">Manage, activate, or suspend institutional tenants.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search universities…"
                            className="pl-8 w-[240px] bg-white"
                        />
                    </div>
                    <Button onClick={() => setShowAddDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add University
                    </Button>
                </div>
            </div>

            {/* Stats pills */}
            <div className="flex gap-4 flex-wrap">
                <div className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-700">
                    <span className="font-bold text-slate-900">{universities.length}</span> Total
                </div>
                <div className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-medium text-emerald-700">
                    <span className="font-bold">{universities.filter(u => isActive(u)).length}</span> Active
                </div>
                <div className="px-4 py-2 rounded-full bg-red-50 border border-red-200 text-sm font-medium text-red-700">
                    <span className="font-bold">{universities.filter(u => !isActive(u)).length}</span> Suspended
                </div>
            </div>

            {/* Table */}
            <Card className="rounded-xl border-slate-200">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700 pl-6">Institution</TableHead>
                                <TableHead className="font-semibold text-slate-700">Slug</TableHead>
                                <TableHead className="font-semibold text-slate-700">Plan</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center">Admins</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center">Leads</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700">Created</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        {Array.from({ length: 8 }).map((_, j) => (
                                            <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        No universities found.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((uni) => (
                                <TableRow key={uni.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-blue-50 text-primary flex items-center justify-center border border-blue-100 shrink-0">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-slate-900">{uni.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200">
                                            {uni.subdomain}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`capitalize font-medium ${PLAN_COLORS[uni.plan_type?.toLowerCase() ?? "basic"] ?? "bg-slate-100 text-slate-700"}`}>
                                            {uni.plan_type ?? "Basic"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-slate-700 font-medium">{uni.admin_count}</TableCell>
                                    <TableCell className="text-center text-slate-700 font-medium">{uni.lead_count}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            {isActive(uni) ? (
                                                <><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-sm font-medium text-emerald-700">Active</span></>
                                            ) : (
                                                <><Ban className="h-4 w-4 text-red-500" /><span className="text-sm font-medium text-red-700">Suspended</span></>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {new Date(uni.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    {actionLoading === uni.id
                                                        ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                                        : <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                    }
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-52">
                                                <DropdownMenuItem onClick={() => viewDetail(uni)} className="cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {isActive(uni) ? (
                                                    <DropdownMenuItem
                                                        onClick={() => toggleStatus(uni)}
                                                        className="text-orange-600 focus:text-orange-700 cursor-pointer"
                                                    >
                                                        <ShieldOff className="mr-2 h-4 w-4" /> Suspend (Unpaid)
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        onClick={() => toggleStatus(uni)}
                                                        className="text-emerald-600 focus:text-emerald-700 cursor-pointer"
                                                    >
                                                        <ShieldCheck className="mr-2 h-4 w-4" /> Reactivate
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ── Detail Modal ───────────────────────────────────────────────── */}
            <Dialog open={!!detailUni} onOpenChange={open => !open && setDetailUni(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            {detailUni?.name}
                        </DialogTitle>
                        <DialogDescription>Full details and quick actions for this tenant.</DialogDescription>
                    </DialogHeader>
                    {detailUni && (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Subdomain", value: detailUni.subdomain, mono: true },
                                    { label: "Plan", value: detailUni.plan_type ?? "Basic", mono: false },
                                    { label: "Admins", value: detailUni.admin_count ?? "…", mono: false },
                                    { label: "Leads", value: detailUni.lead_count ?? "…", mono: false },
                                    { label: "Since", value: new Date(detailUni.created_at).toLocaleDateString(), mono: false },
                                    {
                                        label: "Status",
                                        value: isActive(detailUni) ? "✅ Active" : "🚫 Suspended",
                                        mono: false,
                                    },
                                ].map(({ label, value, mono }) => (
                                    <div key={label} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                                        <p className={`text-sm font-semibold text-slate-900 ${mono ? "font-mono" : ""}`}>{value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Users at this university */}
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Users</p>
                                {detailUni.admins === undefined ? (
                                    <Skeleton className="h-20 w-full" />
                                ) : detailUni.admins.length === 0 ? (
                                    <p className="text-xs text-slate-400">No users found for this university.</p>
                                ) : (
                                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                        {detailUni.admins.map((a: any) => (
                                            <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100">
                                                <span className="text-sm text-slate-800">{a.email}</span>
                                                <Badge variant="secondary" className="text-xs capitalize">{a.role}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDetailUni(null)}>Close</Button>
                        {detailUni && (
                            <Button
                                variant={isActive(detailUni) ? "destructive" : "default"}
                                onClick={() => { toggleStatus(detailUni!); setDetailUni(null) }}
                                disabled={actionLoading === detailUni?.id}
                            >
                                {actionLoading === detailUni?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isActive(detailUni) ? "Suspend (Unpaid)" : "Reactivate"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Add University Modal ───────────────────────────────────────── */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New University</DialogTitle>
                        <DialogDescription>Create a new tenant. The university will be active immediately.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>University Name *</Label>
                            <Input
                                value={newUni.name}
                                onChange={e => setNewUni(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g. Sorbonne University"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Slug (URL key) *</Label>
                            <Input
                                value={newUni.slug}
                                onChange={e => setNewUni(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") }))}
                                placeholder="e.g. sorbonne"
                                className="font-mono"
                            />
                            <p className="text-xs text-slate-400">Used in form URLs. Lowercase, no spaces.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Subscription Plan</Label>
                            <div className="flex gap-2">
                                {["basic", "premium", "enterprise"].map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setNewUni(prev => ({ ...prev, plan: p }))}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-all ${newUni.plan === p ? "bg-primary text-white border-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {addError && (
                            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{addError}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowAddDialog(false); setAddError("") }}>Cancel</Button>
                        <Button onClick={handleAddUniversity} disabled={addLoading}>
                            {addLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create University
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
