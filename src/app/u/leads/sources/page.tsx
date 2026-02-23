"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from "recharts"
import {
    Search, Users, TrendingUp, Globe, Upload, Instagram,
    Facebook, Pencil, CheckCircle2, Loader2, Info, Link2
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

const SOURCE_LABELS: Record<string, string> = {
    agent_landing: "Agent Landing",
    website: "Website Form",
    csv_import: "CSV Import",
    instagram_ads: "Instagram Ads",
    facebook_ads: "Facebook Ads",
    manual: "Manual",
    other: "Other",
}

const SOURCE_COLORS: Record<string, string> = {
    agent_landing: "#6366f1",
    website: "#0ea5e9",
    csv_import: "#f59e0b",
    instagram_ads: "#ec4899",
    facebook_ads: "#3b82f6",
    manual: "#64748b",
    other: "#a0aec0",
}

const PIE_COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#ec4899", "#3b82f6", "#64748b"]

function SourceBadge({ type }: { type: string }) {
    const label = SOURCE_LABELS[type] || type
    const colors: Record<string, string> = {
        agent_landing: "bg-indigo-50 text-indigo-700 border-indigo-200",
        website: "bg-sky-50 text-sky-700 border-sky-200",
        csv_import: "bg-amber-50 text-amber-700 border-amber-200",
        instagram_ads: "bg-pink-50 text-pink-700 border-pink-200",
        facebook_ads: "bg-blue-50 text-blue-700 border-blue-200",
        manual: "bg-slate-100 text-slate-600 border-slate-200",
    }
    return (
        <Badge variant="outline" className={`text-xs font-medium ${colors[type] || "bg-slate-100 text-slate-600"}`}>
            {label}
        </Badge>
    )
}

export default function LeadOriginsPage() {
    const [leads, setLeads] = useState<any[]>([])
    const [charts, setCharts] = useState<any>(null)
    const [agents, setAgents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filterSource, setFilterSource] = useState("all")
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")

    // Detail sheet
    const [sheetOpen, setSheetOpen] = useState(false)
    const [activeLead, setActiveLead] = useState<any>(null)
    const [auditTrail, setAuditTrail] = useState<any[]>([])

    // Assign UI
    const [assignAgentId, setAssignAgentId] = useState("")
    const [assigning, setAssigning] = useState(false)
    const [assignSuccess, setAssignSuccess] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchData = useCallback(async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        const res = await fetch(`/api/u/leads/sources?${params}`)
        const data = await res.json()
        if (res.ok) {
            setLeads(data.leads || [])
            setCharts(data.charts || null)
        }
        setLoading(false)
    }, [from, to])

    useEffect(() => {
        fetchData()
        // Also fetch agents for assign dropdown
        fetch('/api/u/agents').then(r => r.json()).then(d => setAgents(d.agents || []))
    }, [fetchData])

    const openDetail = async (lead: any) => {
        setActiveLead(lead)
        setAssignAgentId("")
        setAssignSuccess("")
        setSheetOpen(true)
        // Fetch audit trail
        const { data } = await supabase
            .from('audit_logs')
            .select('action, created_at, metadata, actor_role')
            .eq('entity_id', lead.id)
            .eq('entity', 'leads')
            .order('created_at')
        setAuditTrail(data ?? [])
    }

    const handleAssign = async () => {
        if (!activeLead || !assignAgentId) return
        setAssigning(true)
        const res = await fetch(`/api/u/leads/${activeLead.id}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: assignAgentId })
        })
        const data = await res.json()
        if (res.ok) {
            setAssignSuccess(`Assigned to ${data.agentName}!`)
            setActiveLead((prev: any) => ({ ...prev, assigned_agent_id: assignAgentId, agents: { display_name: data.agentName } }))
            setLeads(prev => prev.map(l => l.id === activeLead.id ? { ...l, assigned_agent_id: assignAgentId, agents: { display_name: data.agentName } } : l))
        }
        setAssigning(false)
    }

    const filtered = leads.filter(l => {
        const name = `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase()
        const matchSearch = name.includes(search.toLowerCase())
        const matchSource = filterSource === 'all' || l.source_type === filterSource
        return matchSearch && matchSource
    })

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900">Lead Origins</h1>
                <p className="text-slate-500 mt-1">Track where every lead came from — agents, channels, campaigns.</p>
            </div>

            {/* Date range filter */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">From:</label>
                    <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-40 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-600">To:</label>
                    <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-40 text-sm" />
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>Apply Filter</Button>
                <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo("") }}>Clear</Button>
            </div>

            {/* Charts */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-56 rounded-xl" />)}
                </div>
            ) : charts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Leads by Source */}
                    <Card className="border-slate-200 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Leads by Source</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={charts.bySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={(props) => (SOURCE_LABELS as Record<string, string>)[props.name ?? ''] || props.name || ''}>
                                    {charts.bySource.map((entry: any, i: number) => (
                                        <Cell key={i} fill={(SOURCE_COLORS as Record<string, string>)[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any, name: any) => [v, (SOURCE_LABELS as Record<string, string>)[name] || name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Daily leads */}
                    <Card className="border-slate-200 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Daily Lead Volume (30d)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={charts.byDay}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.substring(5)} />
                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                <Tooltip />
                                {Object.keys(SOURCE_LABELS).map(src => (
                                    <Line key={src} type="monotone" dataKey={src} stroke={SOURCE_COLORS[src]} dot={false} strokeWidth={2} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Top Agents */}
                    <Card className="border-slate-200 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Top Agents by Landing Leads</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={charts.topAgents} layout="vertical">
                                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} />
                                <Tooltip />
                                <Bar dataKey="leads" fill="#6366f1" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Conversion by Source */}
                    <Card className="border-slate-200 rounded-xl p-4">
                        <h3 className="font-semibold text-slate-800 mb-4">Conversion Rate by Source (%)</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={charts.conversionBySrc}>
                                <XAxis dataKey="source" tick={{ fontSize: 10 }} tickFormatter={(v: string) => SOURCE_LABELS[v] || v} />
                                <YAxis tick={{ fontSize: 10 }} unit="%" />
                                <Tooltip formatter={(v: any) => [`${v}%`, "Conversion"]} labelFormatter={(l: any) => SOURCE_LABELS[l as keyof typeof SOURCE_LABELS] || String(l)} />
                                <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>
            ) : null}

            {/* Table */}
            <Card className="border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 bg-white" />
                    </div>
                    <Select value={filterSource} onValueChange={setFilterSource}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="All Sources" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
                                <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="text-xs uppercase text-slate-500">Student</TableHead>
                                    <TableHead className="text-xs uppercase text-slate-500">Source</TableHead>
                                    <TableHead className="text-xs uppercase text-slate-500">Program</TableHead>
                                    <TableHead className="text-xs uppercase text-slate-500">Stage</TableHead>
                                    <TableHead className="text-xs uppercase text-slate-500">Agent</TableHead>
                                    <TableHead className="text-xs uppercase text-slate-500">Date</TableHead>
                                    <TableHead className="text-right text-xs uppercase text-slate-500">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-slate-400">No leads found.</TableCell>
                                    </TableRow>
                                ) : filtered.map(lead => (
                                    <TableRow key={lead.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => openDetail(lead)}>
                                        <TableCell>
                                            <p className="font-medium text-slate-900">{lead.first_name} {lead.last_name}</p>
                                            <p className="text-xs text-slate-400">{lead.email}</p>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <SourceBadge type={lead.source_type || 'manual'} />
                                                {lead.source_label && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{lead.source_label}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600">{(lead.programs as any)?.name || "—"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600">{(lead.kanban_stages as any)?.name || "—"}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-slate-600">{(lead.agents as any)?.display_name || <span className="text-amber-500 italic text-xs">Unassigned</span>}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</span>
                                        </TableCell>
                                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => openDetail(lead)}>
                                                <Info className="mr-1 h-3 w-3" /> Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Lead Detail Sheet */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-[460px] sm:w-[500px] overflow-y-auto">
                    <SheetHeader className="mb-4">
                        <SheetTitle>{activeLead?.first_name} {activeLead?.last_name}</SheetTitle>
                        <SheetDescription>{activeLead?.email}</SheetDescription>
                    </SheetHeader>

                    {activeLead && (
                        <div className="space-y-5">
                            {/* Source Block */}
                            <div>
                                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-2">Lead Source</p>
                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <SourceBadge type={activeLead.source_type || 'manual'} />
                                        <span className="text-sm font-medium text-slate-700">{activeLead.source_label || "Manual entry"}</span>
                                    </div>
                                    {activeLead.lead_sources && (
                                        <div className="text-xs text-slate-500 space-y-1 pt-1">
                                            {activeLead.lead_sources.utm_source && <p>UTM Source: <strong>{activeLead.lead_sources.utm_source}</strong></p>}
                                            {activeLead.lead_sources.utm_medium && <p>UTM Medium: <strong>{activeLead.lead_sources.utm_medium}</strong></p>}
                                            {activeLead.lead_sources.utm_campaign && <p>Campaign: <strong>{activeLead.lead_sources.utm_campaign}</strong></p>}
                                            {activeLead.lead_sources.platform && <p>Platform: <strong>{activeLead.lead_sources.platform}</strong></p>}
                                            {activeLead.lead_sources.campaign && <p>Ad Campaign: <strong>{activeLead.lead_sources.campaign}</strong></p>}
                                            {activeLead.lead_sources.file_name && <p>CSV File: <strong>{activeLead.lead_sources.file_name}</strong></p>}
                                            {activeLead.lead_sources.ref_url && <p className="truncate">Referred from: <strong>{activeLead.lead_sources.ref_url}</strong></p>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Assign to Agent (if website lead + unassigned) */}
                            {(activeLead.source_type === 'website' || !activeLead.assigned_agent_id) && (
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-2">Assign to Agent</p>
                                    {assignSuccess ? (
                                        <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4" />{assignSuccess}
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Select value={assignAgentId} onValueChange={setAssignAgentId}>
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Select agent…" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {agents.map((a: any) => (
                                                        <SelectItem key={a.user_id} value={a.user_id}>{a.display_name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button size="sm" onClick={handleAssign} disabled={!assignAgentId || assigning}>
                                                {assigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Journey Timeline */}
                            {auditTrail.length > 0 && (
                                <div>
                                    <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-2">Journey Timeline</p>
                                    <div className="space-y-2">
                                        {auditTrail.map((entry, i) => (
                                            <div key={i} className="flex gap-3 items-start">
                                                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                                                    <p className="text-xs text-slate-400">{new Date(entry.created_at).toLocaleString()} · {entry.actor_role}</p>
                                                    {entry.metadata?.agent_name && (
                                                        <p className="text-xs text-slate-500">→ {entry.metadata.agent_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div>
                                <p className="text-[11px] uppercase font-bold text-slate-400 tracking-widest mb-2">Contact</p>
                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-2 text-sm">
                                    <p><span className="text-slate-400">Email:</span> <strong>{activeLead.email}</strong></p>
                                    <p><span className="text-slate-400">Phone:</span> <strong>{activeLead.phone || '—'}</strong></p>
                                    <p><span className="text-slate-400">Country/City:</span> <strong>{[activeLead.country, activeLead.city].filter(Boolean).join(', ') || '—'}</strong></p>
                                    <p><span className="text-slate-400">Stage:</span> <strong>{activeLead.kanban_stages?.name || '—'}</strong></p>
                                    <p><span className="text-slate-400">Agent:</span> <strong>{activeLead.agents?.display_name || 'Unassigned'}</strong></p>
                                </div>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}
