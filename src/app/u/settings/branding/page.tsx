"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { createBrowserClient } from "@supabase/ssr"
import { Palette, Save, Loader2, Eye, Upload, ImageIcon, CheckCircle2, X, AlertCircle, AlignLeft, AlignCenter } from "lucide-react"

type SaveStatus = "idle" | "saving" | "saved" | "error"

export default function BrandingSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
    const [universityId, setUniversityId] = useState<string | null>(null)

    // Colors
    const [primaryColor, setPrimaryColor] = useState("#1E3A5F")
    const [accentColor, setAccentColor] = useState("#F26522")

    // Logo
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [logoSize, setLogoSize] = useState<number>(40)          // sidebar height px
    const [logoPosition, setLogoPosition] = useState<"left" | "center">("left")
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Agent settings
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

            const { data: profile } = await supabase
                .from("profiles")
                .select("university_id")
                .eq("id", user.id)
                .single()

            if (!profile?.university_id) return
            setUniversityId(profile.university_id)

            // Load settings (colors + agent policy)
            const { data: settings } = await supabase
                .from("settings")
                .select("branding, agent_scope, allow_agent_custom_sender_email")
                .eq("university_id", profile.university_id)
                .maybeSingle()

            if (settings) {
                setPrimaryColor(settings.branding?.colors?.primary ?? "#1E3A5F")
                setAccentColor(settings.branding?.colors?.accent ?? "#F26522")
                setLogoUrl(settings.branding?.logo_url ?? null)
                setAgentScope(settings.agent_scope ?? "assigned_only")
                setAllowCustomSender(settings.allow_agent_custom_sender_email ?? false)
            }

            setLoading(false)
        }
        init()
    }, [])

    // ── Logo upload ────────────────────────────────────────────────────────────

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file (PNG, JPG, SVG, WebP)")
            return
        }
        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be under 2 MB")
            return
        }
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
    }

    const uploadLogo = async (): Promise<string | null> => {
        if (!logoFile || !universityId) return logoUrl

        setUploadingLogo(true)
        const extension = logoFile.name.split(".").pop()
        const path = `logos/${universityId}/logo.${extension}`

        const { error: uploadError } = await supabase.storage
            .from("university-assets")
            .upload(path, logoFile, { upsert: true, contentType: logoFile.type })

        if (uploadError) {
            console.error("Logo upload error:", uploadError)
            setUploadingLogo(false)
            return logoUrl
        }

        const { data: { publicUrl } } = supabase.storage
            .from("university-assets")
            .getPublicUrl(path)

        setLogoUrl(publicUrl)
        setLogoFile(null)
        setUploadingLogo(false)
        return publicUrl
    }

    const removeLogo = () => {
        setLogoFile(null)
        setLogoPreview(null)
        setLogoUrl(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!universityId) return
        setSaveStatus("saving")

        try {
            // Upload logo first if one was selected
            const finalLogoUrl = await uploadLogo()

            const { error } = await supabase.from("settings").upsert({
                university_id: universityId,
                branding: {
                    colors: { primary: primaryColor, accent: accentColor },
                    logo_url: finalLogoUrl,
                    logo_size: logoSize,
                    logo_position: logoPosition,
                },
                agent_scope: agentScope,
                allow_agent_custom_sender_email: allowCustomSender,
            }, { onConflict: "university_id" })

            if (error) throw error

            setSaveStatus("saved")
            setTimeout(() => setSaveStatus("idle"), 3000)
        } catch (err) {
            console.error(err)
            setSaveStatus("error")
            setTimeout(() => setSaveStatus("idle"), 4000)
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </div>
        )
    }

    const displayLogo = logoPreview ?? logoUrl

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                        Branding & Settings
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Customize the look and access rules for your institution.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saveStatus === "saving" || saveStatus === "saved"}
                    className={
                        saveStatus === "saved"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : saveStatus === "error"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : ""
                    }
                >
                    {saveStatus === "saving" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saveStatus === "saved" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {saveStatus === "error" && <AlertCircle className="mr-2 h-4 w-4" />}
                    {saveStatus === "idle" && <Save className="mr-2 h-4 w-4" />}
                    {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error – Retry" : "Save Changes"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Logo Upload Card */}
                <Card className="rounded-xl border-slate-200 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> University Logo
                        </CardTitle>
                        <CardDescription>
                            Appears on the sidebar header and public intake forms. PNG, SVG, WebP — max 2 MB.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            {/* Preview */}
                            <div
                                className="h-28 w-48 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group"
                                onClick={() => !displayLogo && fileInputRef.current?.click()}
                            >
                                {displayLogo ? (
                                    <>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={displayLogo}
                                            alt="University logo"
                                            className="h-full w-full object-contain p-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); removeLogo() }}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remove logo"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer">
                                        <ImageIcon className="h-8 w-8" />
                                        <span className="text-xs font-medium">No logo</span>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="space-y-4 flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingLogo}
                                    >
                                        {uploadingLogo
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
                                            : <><Upload className="mr-2 h-4 w-4" /> {displayLogo ? "Change Logo" : "Upload Logo"}</>
                                        }
                                    </Button>
                                    {displayLogo && (
                                        <Button type="button" variant="ghost" onClick={removeLogo} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                            <X className="mr-1 h-4 w-4" /> Remove
                                        </Button>
                                    )}
                                </div>

                                {/* Logo Size Slider */}
                                {displayLogo && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-semibold text-slate-600">Logo Size in Sidebar</Label>
                                            <span className="text-xs text-slate-400 font-mono">{logoSize}px</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={28}
                                            max={80}
                                            step={2}
                                            value={logoSize}
                                            onChange={e => setLogoSize(Number(e.target.value))}
                                            className="w-full h-1.5 accent-blue-600 cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-slate-400">
                                            <span>Small (28px)</span>
                                            <span>Large (80px)</span>
                                        </div>
                                    </div>
                                )}

                                {/* Position Toggle */}
                                {displayLogo && (
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold text-slate-600">Logo Position</Label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setLogoPosition("left")}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${logoPosition === "left" ? "bg-blue-50 border-blue-400 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                                            >
                                                <AlignLeft className="h-3.5 w-3.5" /> Left
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLogoPosition("center")}
                                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${logoPosition === "center" ? "bg-blue-50 border-blue-400 text-blue-700" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                                            >
                                                <AlignCenter className="h-3.5 w-3.5" /> Centered
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Mini Sidebar Preview */}
                                {displayLogo && (
                                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                                        <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider px-2 pt-2">Sidebar Preview</p>
                                        <div className={`h-14 bg-white border-b border-slate-100 flex items-center px-4 ${logoPosition === "center" ? "justify-center" : "justify-start"} gap-2`}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={displayLogo} alt="preview" style={{ height: logoSize, width: "auto", maxWidth: 140 }} className="object-contain" />
                                        </div>
                                        <div className="h-6 bg-slate-50 flex items-center px-4 gap-2">
                                            <div className="h-1.5 w-10 rounded bg-slate-200" />
                                            <div className="h-1.5 w-14 rounded bg-slate-200" />
                                        </div>
                                    </div>
                                )}

                                {logoFile && (
                                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                                        ⚠️ New logo selected — click <strong>Save Changes</strong> to upload and apply it.
                                    </p>
                                )}
                                {logoUrl && !logoFile && (
                                    <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                                        ✓ Logo is set and active on your public forms and sidebar.
                                    </p>
                                )}
                                {!displayLogo && (
                                    <p className="text-xs text-slate-400">
                                        Recommended: square or wide logo, transparent background (SVG or PNG preferred).
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Color Palette */}
                <Card className="rounded-xl border-slate-200">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg flex items-center gap-2">
                            <Palette className="h-4 w-4" /> Color Palette
                        </CardTitle>
                        <CardDescription>Colors used in your public forms and portals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="primary">Primary Color (Headings, Buttons)</Label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    id="primary"
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="h-10 w-16 rounded-md border border-slate-200 cursor-pointer"
                                />
                                <Input
                                    value={primaryColor}
                                    onChange={e => setPrimaryColor(e.target.value)}
                                    className="font-mono text-sm uppercase"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="accent">Accent Color (Highlights, CTAs)</Label>
                            <div className="flex gap-3 items-center">
                                <input
                                    type="color"
                                    id="accent"
                                    value={accentColor}
                                    onChange={e => setAccentColor(e.target.value)}
                                    className="h-10 w-16 rounded-md border border-slate-200 cursor-pointer"
                                />
                                <Input
                                    value={accentColor}
                                    onChange={e => setAccentColor(e.target.value)}
                                    className="font-mono text-sm uppercase"
                                    maxLength={7}
                                />
                            </div>
                        </div>

                        {/* Live preview */}
                        <div className="rounded-xl border-4 p-4 transition-all" style={{ borderColor: primaryColor }}>
                            <div className="flex items-center gap-2 mb-3">
                                {displayLogo ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={displayLogo} alt="logo" className="h-6 w-auto object-contain" />
                                ) : (
                                    <Eye className="h-4 w-4" style={{ color: primaryColor }} />
                                )}
                                <p className="text-sm font-semibold" style={{ color: primaryColor }}>Preview</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: primaryColor }}>
                                    Primary Button
                                </button>
                                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: accentColor }}>
                                    Accent Button
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Agent Policy */}
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
                                        onClick={() => setAgentScope(option.value as "assigned_only" | "all_leads")}
                                    >
                                        <p className={`text-sm font-medium ${agentScope === option.value ? "text-primary" : "text-slate-900"}`}>
                                            {option.label}
                                        </p>
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

            {/* Bottom save bar (sticky on scroll) */}
            <div className="flex justify-end pt-2">
                <Button
                    onClick={handleSave}
                    disabled={saveStatus === "saving" || saveStatus === "saved"}
                    size="lg"
                    className={
                        saveStatus === "saved"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : saveStatus === "error"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : ""
                    }
                >
                    {saveStatus === "saving" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {saveStatus === "saved" && <CheckCircle2 className="mr-2 h-4 w-4" />}
                    {saveStatus === "error" && <AlertCircle className="mr-2 h-4 w-4" />}
                    {saveStatus === "idle" && <Save className="mr-2 h-4 w-4" />}
                    {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error – Retry" : "Save Changes"}
                </Button>
            </div>
        </div>
    )
}
