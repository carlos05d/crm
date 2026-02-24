"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TrendingUp, Users, Target, Building2, Loader2 } from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts"

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

interface AnalyticsData {
    leadsByStage: { name: string; count: number }[]
    uniGrowth: { month: string; count: number }[]
    scoreDistribution: { range: string; count: number }[]
    planDistribution: { name: string; value: number }[]
    conversionRate: number
    totalLeads: number
    admittedLeads: number
}

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [statsLoading, setStatsLoading] = useState(false)

    // Global counts (unchanged — still using anon direct queries via client)
    const [counts, setCounts] = useState({ universities: 0, leads: 0, agents: 0, programs: 0 })

    const fetchAnalytics = async (from?: string, to?: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (from) params.set('from', from)
            if (to) params.set('to', to)
            const res = await fetch(`/api/sa/analytics?${params}`)
            if (res.ok) setData(await res.json())
        } catch { /* silent */ } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchAnalytics() }, [])

    const handleFilter = () => fetchAnalytics(dateFrom, dateTo)

    if (loading && !data) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-72 rounded-xl" />
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            </div>
        )
    }

    const statCards = [
        { label: "Conversion Rate", value: `${data?.conversionRate ?? 0}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total Leads", value: data?.totalLeads ?? 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Admitted Leads", value: data?.admittedLeads ?? 0, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Universities", value: data?.uniGrowth?.reduce((acc, m) => acc + m.count, 0) ?? 0, icon: Building2, color: "text-amber-600", bg: "bg-amber-50" },
    ]

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Platform Analytics</h2>
                    <p className="text-slate-500 mt-1">Real-time insights across all university tenants.</p>
                </div>
                {/* Date Range Filter */}
                <div className="flex items-end gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-500">From</Label>
                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 text-sm" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-slate-500">To</Label>
                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 text-sm" />
                    </div>
                    <button onClick={handleFilter}
                        className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 h-10">
                        Apply
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(s => (
                    <Card key={s.label} className="border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}>
                                <s.icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-heading font-bold text-slate-900">{s.value}</p>
                            <p className="text-sm text-slate-500">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-base">Leads by Stage</CardTitle>
                        <CardDescription>Distribution across the funnel</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data?.leadsByStage || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-base">Lead Score Distribution</CardTitle>
                        <CardDescription>Quality breakdown across all tenants</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={data?.scoreDistribution || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {(data?.scoreDistribution || []).map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-slate-200 rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-base">University Growth</CardTitle>
                        <CardDescription>New tenants onboarded per month</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data?.uniGrowth || []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                                <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-base">Subscription Plans</CardTitle>
                        <CardDescription>Plan type distribution across tenants</CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={data?.planDistribution || []}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`}
                                    labelLine={false}
                                >
                                    {(data?.planDistribution || []).map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
