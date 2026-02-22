"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { createBrowserClient } from "@supabase/ssr"
import { ArrowLeft, Building2, Users, CreditCard, Globe, Calendar, ToggleLeft, ToggleRight } from "lucide-react"

export default function UniversityDetailPage() {
    const params = useParams()
    const router = useRouter()
    const universityId = params.id as string
    const [university, setUniversity] = useState<any>(null)
    const [admins, setAdmins] = useState<any[]>([])
    const [agentCount, setAgentCount] = useState(0)
    const [leadCount, setLeadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchData()
    }, [universityId])

    const fetchData = async () => {
        setLoading(true)
        const [{ data: uni }, { data: adminProfiles }, { count: agents }, { count: leads }] = await Promise.all([
            supabase.from("universities").select("*").eq("id", universityId).single(),
            supabase.from("profiles").select("id, email, first_name, last_name, created_at, status").eq("university_id", universityId).eq("role", "university_admin"),
            supabase.from("agents").select("*", { count: "exact", head: true }).eq("university_id", universityId),
            supabase.from("leads").select("*", { count: "exact", head: true }).eq("university_id", universityId),
        ])
        setUniversity(uni)
        setAdmins(adminProfiles ?? [])
        setAgentCount(agents ?? 0)
        setLeadCount(leads ?? 0)
        setLoading(false)
    }

    const toggleStatus = async () => {
        if (!university) return
        setToggling(true)
        const newStatus = university.status === "active" ? "inactive" : "active"
        await supabase.from("universities").update({ status: newStatus }).eq("id", universityId)
        setUniversity((prev: any) => ({ ...prev, status: newStatus }))
        setToggling(false)
    }

    if (loading) return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-4 gap-6">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div>
            <Skeleton className="h-64" />
        </div>
    )

    if (!university) return (
        <div className="text-center py-20 text-slate-500">University not found.</div>
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <div>
                    <h1 className="text-2xl font-heading font-bold text-slate-900">{university.name}</h1>
                    <p className="text-sm text-slate-500 font-mono">{university.subdomain}.platform.com</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                    <Badge variant="outline" className={university.status === "active" ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-red-300 text-red-600 bg-red-50"}>
                        {university.status ?? "active"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={toggleStatus} disabled={toggling}>
                        {university.status === "active" ? <ToggleLeft className="h-4 w-4 mr-2 text-slate-400" /> : <ToggleRight className="h-4 w-4 mr-2 text-emerald-500" />}
                        {university.status === "active" ? "Deactivate" : "Activate"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Plan", value: university.plan_type || "Normal", icon: <CreditCard className="h-4 w-4" /> },
                    { label: "Agents", value: agentCount, icon: <Users className="h-4 w-4" /> },
                    { label: "Total Leads", value: leadCount, icon: <Globe className="h-4 w-4" /> },
                    { label: "Created", value: new Date(university.created_at).toLocaleDateString(), icon: <Calendar className="h-4 w-4" /> },
                ].map((stat) => (
                    <Card key={stat.label} className="rounded-xl border-slate-200">
                        <CardHeader className="pb-1 flex flex-row items-center justify-between">
                            <CardTitle className="text-xs text-slate-500 font-medium">{stat.label}</CardTitle>
                            <div className="text-slate-400">{stat.icon}</div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-heading font-bold text-slate-900">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="rounded-xl border-slate-200">
                <CardHeader>
                    <CardTitle className="font-heading text-lg">University Admins</CardTitle>
                    <CardDescription>Admins with access to this tenant's dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    {admins.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No admins assigned. Go to <a href="/sa/admins" className="text-primary underline">Admins</a> to invite one.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {admins.map((admin) => (
                                <div key={admin.id} className="py-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                            {(admin.first_name || admin.email).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{admin.first_name} {admin.last_name}</p>
                                            <p className="text-xs text-slate-500">{admin.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={admin.status !== "inactive" ? "text-emerald-700 bg-emerald-50 border-emerald-200 text-xs" : "text-red-600 bg-red-50 border-red-200 text-xs"}>
                                        {admin.status ?? "active"}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
