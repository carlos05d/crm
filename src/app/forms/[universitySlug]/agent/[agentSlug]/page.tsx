"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle2, Loader2, Phone, Mail, Globe, MapPin, AlertTriangle } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

interface AgentInfo {
    display_name: string
    phone: string | null
    bio: string | null
    email?: string
}

interface Program {
    id: string
    name: string
}

export default function AgentLandingPage() {
    const params = useParams()
    const agentSlug = params.agentSlug as string
    const universitySlug = params.universitySlug as string

    const [agent, setAgent] = useState<AgentInfo | null>(null)
    const [programs, setPrograms] = useState<Program[]>([])
    const [uniName, setUniName] = useState("")
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    // Form state
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [country, setCountry] = useState("")
    const [city, setCity] = useState("")
    const [program, setProgram] = useState("")
    const [message, setMessage] = useState("")
    const [hpName, setHpName] = useState("") // honeypot

    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submitError, setSubmitError] = useState("")
    const [trackingId, setTrackingId] = useState("")

    useEffect(() => {
        const load = async () => {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )

            // Lookup university by slug
            const { data: uni } = await supabase
                .from('universities')
                .select('id, name')
                .eq('slug', universitySlug)
                .single()

            if (!uni) { setNotFound(true); setLoading(false); return }
            setUniName(uni.name)

            // Lookup agent by slug
            const { data: agentData } = await supabase
                .from('agents')
                .select('display_name, phone, bio, university_id')
                .eq('public_slug', agentSlug)
                .eq('university_id', uni.id)
                .eq('active', true)
                .single()

            if (!agentData) { setNotFound(true); setLoading(false); return }
            setAgent(agentData)

            // Load programs
            const { data: progs } = await supabase
                .from('programs')
                .select('id, name')
                .eq('university_id', uni.id)
                .order('name')
            setPrograms(progs ?? [])

            setLoading(false)
        }
        load()
    }, [agentSlug, universitySlug])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!firstName.trim() || !lastName.trim() || !email.trim()) {
            setSubmitError("Please fill in all required fields.")
            return
        }
        setSubmitting(true)
        setSubmitError("")

        // Read UTM params from URL
        const urlParams = new URLSearchParams(window.location.search)

        try {
            const res = await fetch('/api/public/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    phone,
                    country,
                    city,
                    message,
                    program_interest: program || undefined,
                    agent_slug: agentSlug,
                    utm_source: urlParams.get('utm_source') || undefined,
                    utm_medium: urlParams.get('utm_medium') || undefined,
                    utm_campaign: urlParams.get('utm_campaign') || undefined,
                    utm_content: urlParams.get('utm_content') || undefined,
                    ref_url: document.referrer || undefined,
                    _hp_name: hpName,
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setTrackingId(data.trackingId)
            setSubmitted(true)
        } catch (err: any) {
            setSubmitError(err.message || "Submission failed. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    const initials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
                    <p className="text-slate-500 mt-2">This agent link is invalid or has been deactivated.</p>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-3">Application Submitted!</h1>
                    <p className="text-slate-500 mb-4">
                        Thank you! <strong>{agent?.display_name}</strong> from <strong>{uniName}</strong> will contact you soon.
                    </p>
                    {trackingId && trackingId !== 'bot' && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-500">
                            <p className="font-medium text-slate-700 mb-1">Your reference ID:</p>
                            <code className="font-mono text-xs text-primary break-all">{trackingId}</code>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 font-sans">
            <div className="max-w-2xl mx-auto py-10 px-4">

                {/* Agent Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-4 border-primary/10 shadow-md">
                            <AvatarFallback className="bg-primary text-white text-xl font-bold">
                                {initials(agent!.display_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-0.5">{uniName}</p>
                            <h1 className="text-2xl font-bold text-slate-900">{agent!.display_name}</h1>
                            <p className="text-sm text-slate-500">Admissions Advisor</p>
                        </div>
                    </div>
                    {agent!.bio && (
                        <p className="mt-4 text-slate-600 text-sm leading-relaxed">{agent!.bio}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-3">
                        {agent!.phone && (
                            <span className="flex items-center gap-1.5 text-sm text-slate-500">
                                <Phone className="h-3.5 w-3.5 text-primary" />{agent!.phone}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Globe className="h-3.5 w-3.5 text-primary" />{uniName}
                        </span>
                    </div>
                </div>

                {/* Lead Capture Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Request Information</h2>
                    <p className="text-slate-500 text-sm mb-6">Fill in your details and {agent!.display_name} will get back to you shortly.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Honeypot — hidden from real users */}
                        <input
                            type="text"
                            name="_hp_name"
                            value={hpName}
                            onChange={e => setHpName(e.target.value)}
                            tabIndex={-1}
                            autoComplete="off"
                            style={{ display: 'none' }}
                            aria-hidden="true"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>First Name <span className="text-red-500">*</span></Label>
                                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" required />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Last Name <span className="text-red-500">*</span></Label>
                                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Email Address <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="pl-9" required />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="pl-9" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Country</Label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="France" className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>City</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Paris" className="pl-9" />
                                </div>
                            </div>
                        </div>

                        {programs.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Program Interest</Label>
                                <Select value={program} onValueChange={setProgram}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a program (optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {programs.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Message</Label>
                            <Textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Any questions or additional information..."
                                className="resize-none"
                                rows={3}
                            />
                        </div>

                        {submitError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0" />{submitError}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md" disabled={submitting}>
                            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {submitting ? "Submitting..." : "Submit Request"}
                        </Button>

                        <p className="text-xs text-center text-slate-400">
                            Your information is private and will only be shared with {agent!.display_name}.
                        </p>
                    </form>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    Powered by University CRM — {uniName}
                </p>
            </div>
        </div>
    )
}
