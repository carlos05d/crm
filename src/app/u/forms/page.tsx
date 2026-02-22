"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ExternalLink, Settings2, MoreHorizontal, LayoutTemplate, Link as LinkIcon, Trash2, Eye, Copy, Loader2, CheckCircle2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from '@supabase/ssr'

export default function TenantFormsManagementPage() {
    const [forms, setForms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [tenantProfile, setTenantProfile] = useState<any>(null)
    const [tenantSubdomain, setTenantSubdomain] = useState("")

    const [newTitle, setNewTitle] = useState("")
    const [newSlug, setNewSlug] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from('profiles').select('university_id').eq('id', user.id).single()
        if (profile) {
            setTenantProfile(profile)

            // Get subdomain for links
            const { data: uni } = await supabase.from('universities').select('subdomain').eq('id', profile.university_id).single()
            if (uni) setTenantSubdomain(uni.subdomain)

            // Get forms
            const { data: formsData } = await supabase.from('forms').select('*').eq('university_id', profile.university_id).order('created_at', { ascending: false })
            if (formsData) setForms(formsData)
        }
        setIsLoading(false)
    }

    const generateSlug = (text: string) => {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTitle(e.target.value)
        setNewSlug(generateSlug(e.target.value))
    }

    const handleCreateForm = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tenantProfile) return

        setIsSaving(true)
        try {
            const { error } = await supabase.from('forms').insert({
                university_id: tenantProfile.university_id,
                title: newTitle,
                slug: newSlug,
                active: true
            })
            if (!error) {
                setNewTitle("")
                setNewSlug("")
                await fetchData()
            }
        } finally {
            setIsSaving(false)
        }
    }

    const copyToClipboard = (slug: string) => {
        const url = `${window.location.protocol}//${window.location.host}/forms/${tenantSubdomain}/${slug}`
        navigator.clipboard.writeText(url)
        alert('URL Copied to clipboard!')
    }

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Lead Forms</h2>
                    <p className="text-slate-500 mt-1">Design and publish public-facing landing pages to capture incoming leads.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Create Form
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Create New Form</DialogTitle>
                                <DialogDescription>
                                    Create a hosted public page that flows directly into your pipeline.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateForm}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Form Title</Label>
                                        <Input id="title" value={newTitle} onChange={handleTitleChange} required placeholder="Fall 2025 Admissions Request" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">URL Slug</Label>
                                        <Input id="slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required placeholder="fall-2025-admissions-request" />
                                        <p className="text-xs text-slate-500 font-mono mt-1 break-all">
                                            {tenantSubdomain ? `/forms/${tenantSubdomain}/${newSlug || '...'}` : 'Loading...'}
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save & Publish
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : forms.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 border-dashed text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <LayoutTemplate className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-slate-900 mb-1">No Forms Published Yet</h3>
                    <p className="text-slate-500 max-w-sm mb-4 text-sm">Create your first public-facing lead capture form to start routing inquiries into your pipeline.</p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> Add Form
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Form</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateForm}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Form Title</Label>
                                        <Input id="title" value={newTitle} onChange={handleTitleChange} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">URL Slug</Label>
                                        <Input id="slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map((form) => (
                        <Card key={form.id} className="rounded-xl border-slate-200 hover:border-slate-300 transition-colors group">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <LayoutTemplate className="h-5 w-5 text-primary" />
                                    </div>
                                    <Badge variant="outline" className={form.active ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-slate-500 bg-slate-50 border-slate-200"}>
                                        {form.active ? "Published" : "Draft"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-lg text-slate-900">{form.title}</CardTitle>
                                <CardDescription className="text-sm font-mono truncate bg-slate-50 p-1.5 rounded text-slate-500 mt-2 flex items-center">
                                    <LinkIcon className="h-3 w-3 mr-1.5 shrink-0" />
                                    /forms/{tenantSubdomain}/{form.slug}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="flex gap-4 text-sm text-slate-500 mb-2">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900">12</span>
                                        <span className="text-xs">Submissions</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-slate-900">4.8%</span>
                                        <span className="text-xs">Conv. Rate</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-3 border-t border-slate-100 flex justify-between bg-slate-50/50 rounded-b-xl gap-2">
                                <Button variant="outline" size="sm" className="w-full bg-white text-slate-700 hover:text-primary hover:bg-primary/5" onClick={() => copyToClipboard(form.slug)}>
                                    <Copy className="h-4 w-4 mr-2" /> Copy Link
                                </Button>
                                <Button variant="outline" size="icon" className="shrink-0 bg-white" title="Settings">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
