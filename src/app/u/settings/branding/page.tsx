"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { Palette, Save, Loader2, Eye } from "lucide-react"

export default function BrandingSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [universityId, setUniversityId] = useState<string | null>(null)
    const [primaryColor, setPrimaryColor] = useState("#1E3A5F")
    const [accentColor, setAccentColor] = useState("#F26522")
    const [agentScope, setAgentScope] = useState<"assigned_only" | "all_leads">("assigned_only")
    const [allowCustomSender, setAllowCustomSender] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
            if (!profile?.university_id) return
            setUniversityId(profile.university_id)

            const { data: settings } = await supabase.from("settings").select("branding, agent_scope, allow_agent_custom_sender_email").eq("university_id", profile.university_id).single()
            if (settings) {
                setPrimaryColor(settings.branding?.colors?.primary || "#1E3A5F")
                setAccentColor(settings.branding?.colors?.accent || "#F26522")
                setAgentScope(settings.agent_scope || "assigned_only")
                setAllowCustomSender(settings.allow_agent_custom_sender_email || false)
            }
            setLoading(false)
        }
        init()
    }, [])

    const handleSave = async () => {
        if (!universityId) return
        setSaving(true)
        await supabase.from("settings").upsert({
            university_id: universityId,
            branding: { colors: { primary: primaryColor, accent: accentColor } },
            agent_scope: agentScope,
            allow_agent_custom_sender_email: allowCustomSender,
        })
        setSaving(false)
        alert("Branding settings saved!")
    }

    if (loading) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Branding & Settings</h1>
                    <p className="text-slate-500 mt-1">Customize the look and access rules for your institution.</p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="rounded-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg flex items-center gap-2"><Palette className="h-4 w-4" /> Color Palette</CardTitle>
                        <CardDescription>Colors used in your public forms and portals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="primary">Primary Color (Headings, Buttons)</Label>
                            <div className="flex gap-3 items-center">
                                <input type="color" id="primary" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-10 w-16 rounded-md border border-slate-200 cursor-pointer" />
                                <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="font-mono text-sm uppercase" maxLength={7} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accent">Accent Color (Highlights, CTAs)</Label>
                            <div className="flex gap-3 items-center">
                                <input type="color" id="accent" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="h-10 w-16 rounded-md border border-slate-200 cursor-pointer" />
                                <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="font-mono text-sm uppercase" maxLength={7} />
                            </div>
                        </div>
                        <div className="rounded-xl border-4 p-4 transition-all" style={{ borderColor: primaryColor }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="h-4 w-4" style={{ color: primaryColor }} />
                                <p className="text-sm font-semibold" style={{ color: primaryColor }}>Preview</p>
                            </div>
                            <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
                                Primary Button
                            </button>
                            <button className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
                                Accent Button
                            </button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Agent Access Policy</CardTitle>
                        <CardDescription>Control what agents can see and do within the platform.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Lead Visibility Scope</Label>
                            <div className="space-y-2">
                                {[
                                    { value: "assigned_only", label: "Assigned Only", desc: "Agents see only leads assigned to them." },
                                    { value: "all_leads", label: "All University Leads", desc: "All agents see all leads in the university." },
                                ].map(option => (
                                    <div
                                        key={option.value}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${agentScope === option.value ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"}`}
                                        onClick={() => setAgentScope(option.value as any)}
                                    >
                                        <p className={`text-sm font-medium ${agentScope === option.value ? "text-primary" : "text-slate-900"}`}>{option.label}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-900">Allow Custom Sender Email</p>
                                <p className="text-xs text-slate-500 mt-0.5">Let agents override the sender email in outbound messages.</p>
                            </div>
                            <Switch checked={allowCustomSender} onCheckedChange={setAllowCustomSender} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
