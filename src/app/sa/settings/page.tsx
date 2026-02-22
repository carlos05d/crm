"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Save, Globe, Shield, Bell, Database } from "lucide-react"

export default function GlobalSettingsPage() {
    const [saving, setSaving] = useState(false)
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [allowNewSignups, setAllowNewSignups] = useState(true)
    const [platformName, setPlatformName] = useState("UniCRM Platform")
    const [supportEmail, setSupportEmail] = useState("support@unicrm.io")

    const handleSave = async () => {
        setSaving(true)
        await new Promise(r => setTimeout(r, 800)) // mock async
        setSaving(false)
        alert("Settings saved successfully!")
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Global Settings</h1>
                <p className="text-slate-500 mt-1">Platform-wide configuration. Changes affect all tenants.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="font-heading text-lg flex items-center gap-2"><Globe className="h-4 w-4" /> Platform Identity</CardTitle>
                            <CardDescription>Branding and contact information for the SaaS platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="platform-name">Platform Name</Label>
                                <Input id="platform-name" value={platformName} onChange={e => setPlatformName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="support-email">Support Email</Label>
                                <Input id="support-email" type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="root-domain">Root Domain</Label>
                                <Input id="root-domain" defaultValue="unicrm.io" placeholder="yourdomain.com" />
                                <p className="text-xs text-slate-500">Tenant subdomains will be: <code className="bg-slate-100 px-1 rounded">tenant.yourdomain.com</code></p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="font-heading text-lg flex items-center gap-2"><Shield className="h-4 w-4" /> Access Control</CardTitle>
                            <CardDescription>Control platform availability and signup access.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Maintenance Mode</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Block all non-super_admin access to the platform.</p>
                                </div>
                                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-900">Allow New University Signups</p>
                                    <p className="text-xs text-slate-500 mt-0.5">When off, only invited universities can onboard.</p>
                                </div>
                                <Switch checked={allowNewSignups} onCheckedChange={setAllowNewSignups} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="font-heading text-lg flex items-center gap-2"><Bell className="h-4 w-4" /> Notification Defaults</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="admin-notify-email">Admin Alert Email</Label>
                                <Input id="admin-notify-email" type="email" defaultValue="alerts@unicrm.io" />
                                <p className="text-xs text-slate-500">Receives critical platform alerts (failed Edge Functions, RLS violations, etc.).</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="rounded-xl border-slate-200">
                        <CardHeader>
                            <CardTitle className="font-heading text-base flex items-center gap-2"><Database className="h-4 w-4" /> Platform Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {[
                                { label: "Version", value: "2.0.0" },
                                { label: "Edge Functions", value: "3 Deployed" },
                                { label: "DB Tables", value: "12 Active" },
                                { label: "RLS Policies", value: "Enforced" },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center">
                                    <span className="text-slate-500">{item.label}</span>
                                    <Badge variant="outline" className="text-xs">{item.value}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="sticky top-20">
                        <Button className="w-full" onClick={handleSave} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Saving..." : "Save Settings"}
                        </Button>
                        {maintenanceMode && (
                            <p className="text-xs text-amber-600 text-center mt-2 font-medium">⚠️ Maintenance mode is ON</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
