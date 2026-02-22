"use client"

import React, { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Copy, CheckCheck, ClipboardList } from "lucide-react"

interface Form {
    id: string
    name: string
    slug: string
    description: string | null
    active: boolean
    fields: Record<string, unknown>[] | null
    created_at: string
}

interface University {
    slug: string
}

export default function AgentFormsPage() {
    const [forms, setForms] = useState<Form[]>([])
    const [university, setUniversity] = useState<University | null>(null)
    const [loading, setLoading] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from("profiles")
                .select("university_id")
                .eq("id", user.id)
                .single()

            if (!profile?.university_id) return

            const [{ data: formsData }, { data: uniData }] = await Promise.all([
                supabase
                    .from("forms")
                    .select("id, name, slug, description, active, fields, created_at")
                    .eq("university_id", profile.university_id)
                    .order("created_at", { ascending: false }),
                supabase
                    .from("universities")
                    .select("slug")
                    .eq("id", profile.university_id)
                    .single(),
            ])

            setForms(formsData ?? [])
            setUniversity(uniData)
            setLoading(false)
        }
        init()
    }, [])

    const getPublicUrl = (formSlug: string) => {
        const uniSlug = university?.slug ?? "university"
        return `${window.location.origin}/forms/${uniSlug}/${formSlug}`
    }

    const handleCopy = async (formId: string, formSlug: string) => {
        await navigator.clipboard.writeText(getPublicUrl(formSlug))
        setCopiedId(formId)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Intake Forms</h1>
                <p className="text-slate-500 mt-1">
                    Active forms available at your university. Share these links with prospective students.
                </p>
            </div>

            {forms.length === 0 ? (
                <Card className="rounded-xl border-slate-200">
                    <CardContent className="py-16 text-center">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium text-slate-500">No forms yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                            Your university admin hasn't created any intake forms. Check back later.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {forms.map(form => {
                        const fieldCount = Array.isArray(form.fields) ? form.fields.length : 0
                        const isCopied = copiedId === form.id
                        return (
                            <Card key={form.id} className="rounded-xl border-slate-200 hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0 mt-0.5">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-semibold text-slate-900">{form.name}</h3>
                                                    <Badge
                                                        variant="secondary"
                                                        className={form.active
                                                            ? "bg-emerald-50 text-emerald-700 border-none"
                                                            : "bg-slate-100 text-slate-500 border-none"}
                                                    >
                                                        {form.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </div>
                                                {form.description && (
                                                    <p className="text-sm text-slate-500 mt-1">{form.description}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                    <span>{fieldCount} field{fieldCount !== 1 ? "s" : ""}</span>
                                                    <span>·</span>
                                                    <span>Created {formatDate(form.created_at)}</span>
                                                    <span>·</span>
                                                    <span className="font-mono text-slate-400">/forms/{university?.slug ?? "…"}/{form.slug}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs gap-1.5"
                                                onClick={() => handleCopy(form.id, form.slug)}
                                            >
                                                {isCopied
                                                    ? <><CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> Copied</>
                                                    : <><Copy className="h-3.5 w-3.5" /> Copy Link</>
                                                }
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-xs gap-1.5 text-slate-500"
                                                asChild
                                            >
                                                <a
                                                    href={`/forms/${university?.slug ?? ""}/${form.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Preview
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            <Card className="rounded-xl border-dashed border-slate-200 bg-slate-50/50">
                <CardContent className="p-4">
                    <p className="text-sm text-slate-500 text-center">
                        Need to create or edit forms? Contact your university administrator to manage intake forms.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
