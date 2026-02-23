"use client"

import React, { useState, useEffect } from "react"
import dynamic from "next/dynamic"

// Must be client-only — SSR generates different SVG IDs causing hydration mismatch
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false })
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import {
    Copy, Check, ExternalLink, Loader2, Activity,
    Users, TrendingUp, Calendar, Link2, QrCode, RefreshCw
} from "lucide-react"

interface LandingStats {
    total: number
    last7: number
    last30: number
    conversionRate: number
}

interface AgentInfo {
    user_id: string
    display_name: string
    public_slug: string | null
}

export default function AgentLandingPortalPage() {
    const [agent, setAgent] = useState<AgentInfo | null>(null)
    const [landingUrl, setLandingUrl] = useState<string | null>(null)
    const [stats, setStats] = useState<LandingStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [showQR, setShowQR] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        try {
            const res = await fetch('/api/agent/landing-stats')
            const data = await res.json()
            if (res.ok) {
                setAgent(data.agent)
                setLandingUrl(data.landing_url)
                setStats(data.stats)
            }
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const copyLink = () => {
        if (!landingUrl) return
        navigator.clipboard.writeText(landingUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <Card className="border-slate-200 rounded-xl">
            <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-heading font-bold text-slate-900">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-48 w-full rounded-xl" />
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900">Your Landing Page</h1>
                    <p className="text-slate-500 mt-1">Share your personal link to capture new leads directly.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                </Button>
            </div>

            {/* Landing Link Card */}
            {agent?.public_slug && landingUrl ? (
                <Card className="border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-primary/5 via-blue-50 to-slate-50 p-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Link2 className="h-5 w-5 text-primary" />
                            <p className="font-semibold text-slate-900">Your Personal Admission Link</p>
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 ml-auto">Active</Badge>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
                            <code className="text-sm text-primary font-mono flex-1 truncate">{landingUrl}</code>
                            <div className="flex gap-2 shrink-0">
                                <Button size="sm" variant="outline" onClick={copyLink}>
                                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                    {copied ? "Copied!" : "Copy"}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => window.open(landingUrl, '_blank')}>
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setShowQR(!showQR)}>
                                    <QrCode className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {showQR && (
                        <div className="p-6 flex flex-col items-center gap-4 bg-white">
                            <p className="text-sm font-semibold text-slate-700">QR Code — print or share digitally</p>
                            <div className="p-4 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                                <QRCodeSVG value={landingUrl} size={200} level="H" />
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                                const svg = document.querySelector('#agent-qr svg') as SVGSVGElement
                                if (!svg) return
                                const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
                                const a = document.createElement('a')
                                a.href = URL.createObjectURL(blob)
                                a.download = `agent-landing-qr.svg`
                                a.click()
                            }}>
                                Download QR Code
                            </Button>
                            <div id="agent-qr" className="hidden">
                                <QRCodeSVG value={landingUrl} size={400} level="H" />
                            </div>
                        </div>
                    )}
                </Card>
            ) : (
                <Card className="border-slate-200 rounded-2xl p-8 text-center">
                    <Link2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-slate-700">No Landing Link Yet</h3>
                    <p className="text-slate-500 text-sm mt-2">
                        Your link will be generated automatically. Ask your university admin to refresh your agent profile.
                    </p>
                </Card>
            )}

            {/* Stats */}
            {stats && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Total Leads" value={stats.total} color="bg-blue-100 text-blue-600" />
                        <StatCard icon={Calendar} label="Last 7 Days" value={stats.last7} color="bg-purple-100 text-purple-600" />
                        <StatCard icon={Activity} label="Last 30 Days" value={stats.last30} color="bg-amber-100 text-amber-600" />
                        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats.conversionRate}%`} color="bg-emerald-100 text-emerald-600" />
                    </div>

                    {/* Usage Tips */}
                    <Card className="border-slate-200 rounded-xl">
                        <CardContent className="p-5">
                            <h3 className="font-semibold text-slate-800 mb-3">📌 How to use your link</h3>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li className="flex gap-2"><span className="text-primary font-bold">1.</span> Copy your link and share it in WhatsApp, Email, or Instagram bio</li>
                                <li className="flex gap-2"><span className="text-primary font-bold">2.</span> Print the QR code and hand it to prospects at events</li>
                                <li className="flex gap-2"><span className="text-primary font-bold">3.</span> Add UTM parameters to track campaigns: <code className="bg-slate-100 px-1 rounded text-xs">?utm_source=instagram&utm_campaign=spring2026</code></li>
                                <li className="flex gap-2"><span className="text-primary font-bold">4.</span> Every submission lands directly in your Kanban pipeline</li>
                            </ul>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
