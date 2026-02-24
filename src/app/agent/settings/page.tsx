"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { Save, Loader2, UserCircle, Mail, Bell } from "lucide-react"

export default function AgentSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<any>(null)
    const [universitySettings, setUniversitySettings] = useState<any>(null)
    const [customSenderEmail, setCustomSenderEmail] = useState("")
    const [notifyOnAssign, setNotifyOnAssign] = useState(true)
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: prof } = await supabase.from("profiles").select("*, universities(name)").eq("id", user.id).single()
            if (prof) {
                setProfile(prof)
                setFirstName(prof.first_name || "")
                setLastName(prof.last_name || "")
            }
            if (prof?.university_id) {
                const { data } = await supabase.from("settings").select("allow_agent_custom_sender_email, communication").eq("university_id", prof.university_id).limit(1)
                setUniversitySettings(data?.[0] || null)
            }
            setLoading(false)
        }
        init()
    }, [])

    const handleSave = async () => {
        if (!profile) return
        setSaving(true)
        await supabase.from("profiles").update({ first_name: firstName, last_name: lastName }).eq("id", profile.id)
        setSaving(false)
        alert("Profile updated!")
    }

    if (loading) return <div className="space-y-4">{[1, 2].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}</div>

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">My Settings</h1>
                <p className="text-slate-500 mt-1">Manage your agent profile and personal preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="font-heading text-lg flex items-center gap-2"><UserCircle className="h-4 w-4" /> Profile Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>First Name</Label>
                                    <Input value={firstName} onChange={e => setFirstName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Last Name</Label>
                                    <Input value={lastName} onChange={e => setLastName(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input value={profile?.email || ""} disabled className="bg-slate-50 text-slate-500" />
                                <p className="text-xs text-slate-400">Email cannot be changed from here. Contact your admin.</p>
                            </div>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Profile
                            </Button>
                        </CardContent>
                    </Card>

                    {universitySettings?.allow_agent_custom_sender_email && (
                        <Card className="rounded-xl border-slate-200">
                            <CardHeader>
                                <CardTitle className="font-heading text-lg flex items-center gap-2"><Mail className="h-4 w-4" /> Custom Sender Email</CardTitle>
                                <CardDescription>Your admin has enabled custom sender emails. You can override the default sender for outbound emails.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Sender Email</Label>
                                    <Input type="email" value={customSenderEmail} onChange={e => setCustomSenderEmail(e.target.value)} placeholder="yourname@university.edu" />
                                </div>
                                <Button variant="outline" size="sm">
                                    <Save className="mr-2 h-4 w-4" /> Save Sender Email
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="rounded-xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="font-heading text-lg flex items-center gap-2"><Bell className="h-4 w-4" /> Notifications</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Notify when lead is assigned to me</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Receive a notification when admin assigns you a new lead.</p>
                                </div>
                                <Switch checked={notifyOnAssign} onCheckedChange={setNotifyOnAssign} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="rounded-xl border-slate-200 h-fit">
                    <CardHeader>
                        <CardTitle className="font-heading text-base">My Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Role</span>
                            <Badge variant="outline">Agent</Badge>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-slate-500">University</span>
                            <span className="text-slate-900 font-medium text-right">{profile?.universities?.name || "—"}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-slate-500">Lead Scope</span>
                            <Badge variant="outline" className="text-xs">
                                {universitySettings?.agent_scope === "all_leads" ? "All Leads" : "Assigned Only"}
                            </Badge>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <span className="text-slate-500">Custom Sender</span>
                            <Badge variant="outline" className="text-xs">
                                {universitySettings?.allow_agent_custom_sender_email ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
