"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ArrowUpRight, DollarSign, Users, Activity } from "lucide-react"

export default function SubscriptionsPage() {
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
                        <div className="text-2xl font-bold text-slate-900">$45,231.89</div>
                        <p className="text-xs text-emerald-600 mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> +20.1% from last month
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Active Tenants</CardTitle>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">+2350</div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                            Across 12 global regions
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Active Agents</CardTitle>
                        <Activity className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">+12,234</div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center">
                            Actively engaging with leads
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-slate-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Pending Renewals</CardTitle>
                        <CreditCard className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">12</div>
                        <p className="text-xs text-orange-600 mt-1 flex items-center">
                            Requires attention this week
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle>Recent Subscription Activity</CardTitle>
                    <CardDescription>
                        A log of recent plan changes and renewals.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {/* Fake audit loop for UI demonstration */}
                        {[
                            { uni: "Harvard University", action: "Upgraded to Enterprise", time: "2 hours ago", color: "text-emerald-600", bg: "bg-emerald-50" },
                            { uni: "Local College", action: "Payment Failed", time: "5 hours ago", color: "text-red-600", bg: "bg-red-50" },
                            { uni: "MIT", action: "Renewed Enterprise Plan", time: "1 day ago", color: "text-blue-600", bg: "bg-blue-50" },
                        ].map((log, i) => (
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
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
