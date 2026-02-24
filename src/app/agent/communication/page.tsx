"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, MessageSquare, CheckCircle2, Clock, Ban, Search, Plus, Loader2, XCircle } from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { createBrowserClient } from '@supabase/ssr'

interface Message {
    id: string
    channel: 'email' | 'whatsapp'
    recipient: string
    subject: string | null
    body: string
    status: 'sent' | 'delivered' | 'failed'
    created_at: string
    leads?: { first_name: string; last_name: string } | null
}

interface Lead {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
}

export default function CommunicationCenterPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [loadingMessages, setLoadingMessages] = useState(true)
    const [search, setSearch] = useState("")

    const [isSending, setIsSending] = useState(false)
    const [sendSuccess, setSendSuccess] = useState(false)
    const [sendError, setSendError] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)

    const [channel, setChannel] = useState("email")
    const [to, setTo] = useState("")
    const [subject, setSubject] = useState("")
    const [content, setContent] = useState("")
    const [selectedLeadId, setSelectedLeadId] = useState("")
    const [leadSearch, setLeadSearch] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchMessages = useCallback(async () => {
        setLoadingMessages(true)
        try {
            const { data } = await supabase
                .from('messages')
                .select('id, channel, recipient, subject, body, status, created_at, leads(first_name, last_name)')
                .order('created_at', { ascending: false })
                .limit(50)
            setMessages((data as any as Message[]) || [])
        } catch {
            // silently fail — page still shows
        } finally {
            setLoadingMessages(false)
        }
    }, [supabase])

    const fetchLeads = useCallback(async () => {
        const { data } = await supabase
            .from('leads')
            .select('id, first_name, last_name, email, phone')
            .order('first_name')
        setLeads((data as Lead[]) || [])
    }, [supabase])

    useEffect(() => {
        fetchMessages()
        fetchLeads()
    }, [fetchMessages, fetchLeads])

    const filteredLeads = leads.filter(l =>
        `${l.first_name} ${l.last_name} ${l.email}`.toLowerCase().includes(leadSearch.toLowerCase())
    )

    const selectLead = (lead: Lead) => {
        setSelectedLeadId(lead.id)
        setTo(channel === 'email' ? lead.email : lead.phone || '')
        setLeadSearch(`${lead.first_name} ${lead.last_name}`)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        setSendError("")
        setSendSuccess(false)

        try {
            const res = await fetch('/api/comms/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel,
                    to,
                    subject: channel === 'email' ? subject : undefined,
                    content,
                    lead_id: selectedLeadId || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Dispatch failed")

            setSendSuccess(true)
            await fetchMessages()
            setTimeout(() => {
                setSendSuccess(false)
                setTo(""); setSubject(""); setContent(""); setSelectedLeadId(""); setLeadSearch("")
                setDialogOpen(false)
            }, 2500)
        } catch (error: any) {
            setSendError(error.message || "Failed to dispatch message. Check API credentials.")
        } finally {
            setIsSending(false)
        }
    }

    const filteredMessages = messages.filter(m => {
        const q = search.toLowerCase()
        return m.recipient.toLowerCase().includes(q) || (m.subject || '').toLowerCase().includes(q) || (m.leads?.first_name || '').toLowerCase().includes(q)
    })

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Communication Center</h2>
                    <p className="text-slate-500 mt-1">Review and dispatch messages across all channels.</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setSendError(""); setSendSuccess(false) } }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Compose Message</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[520px]">
                        <DialogHeader>
                            <DialogTitle>Send Message to Lead</DialogTitle>
                            <DialogDescription>
                                Dispatch via Email (Resend) or WhatsApp (Meta Cloud API). Message will be logged automatically.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSendMessage}>
                            <div className="grid gap-4 py-4">
                                {/* Channel selector */}
                                <div className="space-y-2">
                                    <Label>Channel</Label>
                                    <div className="flex gap-3">
                                        <div onClick={() => setChannel('email')}
                                            className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center gap-2 transition-colors ${channel === 'email' ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                            <Mail className="h-4 w-4" /> Email
                                        </div>
                                        <div onClick={() => setChannel('whatsapp')}
                                            className={`flex-1 border rounded-lg p-3 cursor-pointer flex items-center gap-2 transition-colors ${channel === 'whatsapp' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                            <MessageSquare className="h-4 w-4" /> WhatsApp
                                        </div>
                                    </div>
                                </div>

                                {/* Lead search */}
                                <div className="space-y-2">
                                    <Label>Find Lead (optional)</Label>
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={leadSearch}
                                        onChange={e => { setLeadSearch(e.target.value); setSelectedLeadId("") }}
                                    />
                                    {leadSearch && !selectedLeadId && filteredLeads.length > 0 && (
                                        <div className="border border-slate-200 rounded-lg bg-white shadow-sm max-h-36 overflow-auto">
                                            {filteredLeads.slice(0, 5).map(l => (
                                                <button key={l.id} type="button" onClick={() => selectLead(l)}
                                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm">
                                                    <span className="font-medium">{l.first_name} {l.last_name}</span>
                                                    <span className="text-slate-400 ml-2">{l.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="to">Recipient ({channel === 'email' ? 'Email' : 'Phone'})</Label>
                                    <Input
                                        id="to" value={to} onChange={(e) => setTo(e.target.value)} required
                                        placeholder={channel === 'email' ? "lead@example.com" : "+1 555 000 0000"}
                                    />
                                </div>

                                {channel === 'email' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Following up on your application" />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="content">Message</Label>
                                    <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} required className="h-28" placeholder="Write your message here..." />
                                </div>
                            </div>

                            {sendError && (
                                <div className="p-3 mb-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center text-sm">
                                    <XCircle className="h-4 w-4 mr-2 shrink-0" />{sendError}
                                </div>
                            )}
                            {sendSuccess && (
                                <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center text-sm">
                                    <CheckCircle2 className="h-4 w-4 mr-2" /> Message dispatched successfully!
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={isSending}>
                                    {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : channel === 'email' ? <Mail className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
                                    Send via {channel === 'email' ? 'Email' : 'WhatsApp'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50 rounded-t-xl pb-0 px-4 pt-4">
                    <Tabs defaultValue="all" className="w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 px-2">
                            <TabsList className="bg-slate-200/50">
                                <TabsTrigger value="all" className="data-[state=active]:bg-white">All Messages</TabsTrigger>
                                <TabsTrigger value="whatsapp" className="data-[state=active]:bg-white">
                                    <MessageSquare className="h-3 w-3 mr-2" /> WhatsApp
                                </TabsTrigger>
                                <TabsTrigger value="email" className="data-[state=active]:bg-white">
                                    <Mail className="h-3 w-3 mr-2" /> Email
                                </TabsTrigger>
                            </TabsList>
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="search" placeholder="Search messages..."
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    className="pl-8 bg-white h-9 md:w-[250px]"
                                />
                            </div>
                        </div>

                        {["all", "whatsapp", "email"].map(tab => (
                            <TabsContent key={tab} value={tab} className="m-0 bg-white border-t border-slate-100">
                                {loadingMessages ? (
                                    <div className="p-4 space-y-3">
                                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {filteredMessages
                                            .filter(m => tab === 'all' || m.channel === tab)
                                            .map(msg => (
                                                <div key={msg.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex gap-4 items-start">
                                                        <div className={`p-2 rounded-lg shrink-0 mt-1 ${msg.channel === "whatsapp" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-primary"}`}>
                                                            {msg.channel === "whatsapp" ? <MessageSquare className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-slate-900 text-sm">{msg.subject || "WhatsApp Message"}</h4>
                                                            <p className="text-sm text-slate-500 mt-0.5">
                                                                To: <span className="font-medium text-slate-700">
                                                                    {msg.leads ? `${msg.leads.first_name} ${msg.leads.last_name}` : msg.recipient}
                                                                </span>
                                                            </p>
                                                            <span className="text-xs font-mono text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 sm:text-right">
                                                        <Badge variant="outline" className={`
                                                            ${msg.status === "delivered" ? "border-emerald-200 text-emerald-700 bg-emerald-50" : ""}
                                                            ${msg.status === "sent" ? "border-slate-200 text-slate-600 bg-slate-50" : ""}
                                                            ${msg.status === "failed" ? "border-red-200 text-red-700 bg-red-50" : ""}
                                                        `}>
                                                            {msg.status === "delivered" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                                            {msg.status === "sent" && <Clock className="h-3 w-3 mr-1" />}
                                                            {msg.status === "failed" && <Ban className="h-3 w-3 mr-1" />}
                                                            {msg.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        {filteredMessages.filter(m => tab === 'all' || m.channel === tab).length === 0 && (
                                            <div className="text-center py-12 text-slate-400">
                                                <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                                <p className="text-sm">No messages yet. Compose your first message above.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        ))}
                    </Tabs>
                </CardHeader>
            </Card>
        </div>
    )
}
