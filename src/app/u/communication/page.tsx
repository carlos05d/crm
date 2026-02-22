"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, MessageSquare, Link, CheckCircle2, AlertCircle } from "lucide-react"

export default function CommunicationSettingsPage() {
    return (
        <div className="space-y-6 font-sans">
            <div>
                <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Communication APIs</h2>
                <p className="text-slate-500 mt-1">Configure external senders for Email and WhatsApp Business communication.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Email Configuration */}
                <Card className="border-slate-200">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded shadow-sm border border-slate-200">
                                    <Mail className="h-5 w-5 text-slate-700" />
                                </div>
                                <CardTitle className="text-lg">SMTP Email Configuration</CardTitle>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 font-medium">
                                <CheckCircle2 className="h-4 w-4" /> Connected
                            </div>
                        </div>
                        <CardDescription className="pt-2">Route platform emails through your institution's secure outbound server.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="smtp-host">SMTP Host</Label>
                            <Input id="smtp-host" defaultValue="smtp.office365.com" className="bg-slate-50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="smtp-port">Port</Label>
                                <Input id="smtp-port" defaultValue="587" className="bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="smtp-auth">Security</Label>
                                <Input id="smtp-auth" defaultValue="STARTTLS" className="bg-slate-50" readOnly />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp-user">Username</Label>
                            <Input id="smtp-user" defaultValue="admissions@university.edu" className="bg-slate-50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtp-pass">Password</Label>
                            <Input id="smtp-pass" type="password" defaultValue="••••••••••••••••" className="bg-slate-50" />
                        </div>
                        <Button className="w-full mt-2">
                            Update Email Credentials
                        </Button>
                    </CardContent>
                </Card>

                {/* WhatsApp Configuration */}
                <Card className="border-slate-200">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded shadow-sm border border-slate-200">
                                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                                </div>
                                <CardTitle className="text-lg">WhatsApp Business API</CardTitle>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 font-medium">
                                <AlertCircle className="h-4 w-4" /> Disconnected
                            </div>
                        </div>
                        <CardDescription className="pt-2">Enable agents to message leads directly on WhatsApp with official templates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="wa-phone">Business Phone Number</Label>
                            <Input id="wa-phone" placeholder="e.g., +1 555 123 4567" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wa-id">WhatsApp Business Account ID</Label>
                            <Input id="wa-id" placeholder="Enter FB Business Manager ID" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wa-token">Permanent Access Token</Label>
                            <Input id="wa-token" type="password" placeholder="EAA..." />
                        </div>
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100 text-sm leading-relaxed mt-4">
                            <strong>Note:</strong> You must complete Meta business verification before the API can send messages outside of test numbers. <a href="#" className="font-semibold underline flex items-center gap-1 mt-1"><Link className="h-3 w-3" /> View documentation</a>
                        </div>
                        <Button variant="outline" className="w-full mt-2">
                            Verify & Connect WhatsApp
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
