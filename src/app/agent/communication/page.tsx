"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, MessageSquare, CheckCircle2, Clock, Ban, Search, Plus, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createBrowserClient } from '@supabase/ssr'

const messages = [
    { id: "1", lead: "Emma Thompson", type: "WhatsApp", subject: "Application Deadline Reminder", status: "Delivered", time: "10 mins ago" },
    { id: "2", lead: "Sarah Chen", type: "Email", subject: "Welcome to Data Analytics MSc", status: "Read", time: "2 hours ago" },
    { id: "3", lead: "James Wilson", type: "Email", subject: "Missing Documents Required", status: "Sent", time: "Yesterday" },
]

export default function CommunicationCenterPage() {
    const [isSending, setIsSending] = useState(false)
    const [sendSuccess, setSendSuccess] = useState(false)
    const [sendError, setSendError] = useState("")

    const [channel, setChannel] = useState("email")
    const [to, setTo] = useState("")
    const [subject, setSubject] = useState("")
    const [content, setContent] = useState("")

    // Hardcoded demo lead ID since we aren't selecting from a DB list in this static mock
    const demoLeadId = "123e4567-e89b-12d3-a456-426614174000"

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        setSendError("")
        setSendSuccess(false)

        try {
            const endpoint = channel === "email" ? "sendEmail" : "sendWhatsApp"
            const payload = channel === "email"
                ? { to, subject, content, leadId: demoLeadId }
                : { to, content, leadId: demoLeadId }

            const { data, error } = await supabase.functions.invoke(endpoint, {
                body: payload
            })

            if (error) throw error

            setSendSuccess(true)
            setTimeout(() => {
                setSendSuccess(false)
                setTo("")
                setSubject("")
                setContent("")
            }, 3000)

        } catch (error: any) {
            setSendError(error.message || "Failed to dispatch message. Check API keys.")
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Communication Center</h2>
                    <p className="text-slate-500 mt-1">Review your outbound correspondence history across all channels.</p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Compose Message
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Send Message to Lead</DialogTitle>
                            <DialogDescription>
                                Dispatch an email or WhatsApp securely through the Tenant's configured outbound API.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendMessage}>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label>Select Channel</Label>
                                    <div className="flex gap-4">
                                        <div
                                            className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${channel === 'email' ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-200 text-slate-600'}`}
                                            onClick={() => setChannel('email')}
                                        >
                                            <Mail className="h-4 w-4" /> Email
                                        </div>
                                        <div
                                            className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center gap-2 ${channel === 'whatsapp' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}
                                            onClick={() => setChannel('whatsapp')}
                                        >
                                            <MessageSquare className="h-4 w-4" /> WhatsApp
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="to">Recipient (Email or Phone)</Label>
                                    <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} required placeholder={channel === 'email' ? "lead@example.com" : "+1 555 000 0000"} />
                                </div>
                                {channel === 'email' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject Line</Label>
                                        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Following up on your application" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="content">Message Body</Label>
                                    <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required className="h-32" placeholder="Write your message here..." />
                                </div>
                            </div>

                            {sendError && <p className="text-sm text-red-600 mb-4">{sendError}</p>}
                            {sendSuccess && (
                                <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center text-sm">
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Message dispatched securely to Edge network!
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={isSending}>
                                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : channel === 'email' ? <Mail className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                    Send via {channel === 'email' ? 'SMTP' : 'Meta API'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50 rounded-t-xl pb-0 px-4 pt-4 overflow-hidden">
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 px-2">
                            <TabsList className="bg-slate-200/50">
                                <TabsTrigger value="all" className="data-[state=active]:bg-white">All Messages</TabsTrigger>
                                <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white">
                                    <MessageSquare className="h-3 w-3 mr-2" /> WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="email" className="data-[state=active]:bg-white">
                                    <Mail className="h-3 w-3 mr-2" /> Emails
                                </TabsTrigger>
                            </TabsList>
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="search"
                                    placeholder="Search outbound logs..."
                                    className="pl-8 bg-white h-9 md:w-[250px]"
                                />
                            </div>
                        </div>

                        <TabsContent value="all" className="m-0 bg-white border-t border-slate-100">
                            <div className="divide-y divide-slate-100">
                                {messages.map((msg) => (
                                    <div key={msg.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex gap-4 items-start">
                                            <div className={`p-2 rounded-lg shrink-0 mt-1 ${msg.type === "WhatsApp" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-primary"}`}>
                                                {msg.type === "WhatsApp" ? <MessageSquare className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900 text-sm">{msg.subject}</h4>
                                                <p className="text-sm text-slate-500 mt-0.5">To: <span className="font-medium text-slate-700">{msg.lead}</span></p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-xs font-mono text-slate-400">{msg.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center sm:justify-end shrink-0">
                                            <Badge variant="outline" className={`
                                                ${msg.status === "Read" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}
                                                ${msg.status === "Delivered" ? "border-blue-200 text-blue-700 bg-blue-50" : ""}
                                                ${msg.status === "Sent" ? "border-slate-200 text-slate-600 bg-slate-50" : ""}
                                                ${msg.status === "Failed" ? "border-red-200 text-red-700 bg-red-50" : ""}
                                            `}>
                                                {msg.status === "Read" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                                {msg.status === "Delivered" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                                {msg.status === "Sent" && <Clock className="h-3 w-3 mr-1" />}
                                                {msg.status === "Failed" && <Ban className="h-3 w-3 mr-1" />}
                                                {msg.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    )
}
