"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ArrowUpRight, DollarSign, Users, Activity, Loader2 } from "lucide-react"

export default function SubscriptionsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const res = await fetch('/api/sa/subscriptions')
                const json = await res.json()
                if (res.ok) setData(json)
            } catch (err) {
                console.error(err)
            }
            setLoading(false)
        }
        load()
    }, [])

    return (
        <div className="space-y-6 font-sans">
            <div>
                <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Subscriptions & Billing</h2>
                <p className="text-slate-500 mt-1">Monitor tenant plans, usage metrics, and account statuses globally.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Total MRR</CardTitle>
                        <DollarSign className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : `$${(data?.metrics?.mrr || 0).toLocaleString()}`}
                        </div>
                        <p className="text-xs text-emerald-600 mt-1 flex items-center">
                            Estimated recurring revenue
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Active Tenants</CardTitle>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : data?.metrics?.activeTenants || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                            Total active universities
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Active Agents</CardTitle>
                        <Activity className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : data?.metrics?.activeAgents || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                            Total provisioned accounts
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pending Renewals</CardTitle>
                        <CreditCard className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin text-slate-400" /> : data?.metrics?.pendingRenewals || 0}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                            Estimated upcoming
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle>Recent Subscription Activity</CardTitle>
                    <CardDescription>
                        A log of recent plan changes and renewals from the database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {loading ? (
                            <div className="flex h-20 items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : !data?.activity || data.activity.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-4">No recent activity</div>
                        ) : (
                            data.activity.map((log: any, i: number) => (
                                <div key={i} className="flex items-center">
                                    <span className={`flex h-2 w-2 rounded-full ${log.bg} mr-4`}>
                                        <span className={`h-2 w-2 rounded-full ${log.color.replace('text', 'bg')}`}></span>
                                    </span>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{log.uni}</p>
                                        <p className={`text-sm ${log.color}`}>
                                            {log.action}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium text-slate-500 text-sm">{log.time}</div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
