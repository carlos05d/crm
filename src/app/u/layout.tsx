"use client"

import React, { useState, useEffect } from "react"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createBrowserClient } from '@supabase/ssr'
import {
    LayoutDashboard, Users, KanbanSquare, Globe, BookOpen, MessageSquare, FileText, LogOut, Activity, GraduationCap, Palette, BarChart2
} from 'lucide-react'

const navItems = [
    {
        section: "Pipeline", items: [
            { href: "/u/dashboard", label: "Overview", icon: LayoutDashboard },
            { href: "/u/leads", label: "Leads", icon: Users },
            { href: "/u/kanban", label: "Kanban Board", icon: KanbanSquare },
        ]
    },
    {
        section: "Team", items: [
            { href: "/u/agents", label: "Agent Directory", icon: Users },
        ]
    },
    {
        section: "Academics", items: [
            { href: "/u/academics/departments", label: "Departments", icon: BookOpen },
            { href: "/u/academics/programs", label: "Programs", icon: GraduationCap },
        ]
    },
    {
        section: "Configuration", items: [
            { href: "/u/forms", label: "Public Forms", icon: Globe },
            { href: "/u/communication", label: "Comms & APIs", icon: MessageSquare },
            { href: "/u/settings/branding", label: "Branding", icon: Palette },
        ]
    },
    {
        section: "Reports", items: [
            { href: "/u/reports", label: "CSV Exports", icon: FileText },
            { href: "/u/leads/sources", label: "Lead Origins", icon: BarChart2 },
            { href: "/u/audit-logs", label: "Audit Logs", icon: Activity },
        ]
    },
]

export default function TenantAdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [uniName, setUniName] = useState<string>("Tenant Admin")
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoSize, setLogoSize] = useState<number>(40)
    const [logoPosition, setLogoPosition] = useState<"left" | "center">("left")
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUser(user)

            const { data: profile } = await supabase
                .from("profiles")
                .select("university_id")
                .eq("id", user.id)
                .single()

            if (!profile?.university_id) return

            // Fetch university name
            const { data: uni } = await supabase
                .from("universities")
                .select("name")
                .eq("id", profile.university_id)
                .single()
            if (uni?.name) setUniName(uni.name)

            // Fetch logo from settings.branding
            const { data: settings } = await supabase
                .from("settings")
                .select("branding")
                .eq("university_id", profile.university_id)
                .single()
            if (settings?.branding?.logo_url) setLogoUrl(settings.branding.logo_url)
            if (settings?.branding?.logo_size) setLogoSize(settings.branding.logo_size)
            if (settings?.branding?.logo_position) setLogoPosition(settings.branding.logo_position)
        }
        init()
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <aside className="fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-5 border-b border-slate-200 shrink-0">
                    <div className={`flex items-center gap-2 min-w-0 ${logoPosition === "center" ? "justify-center" : "justify-start"}`}>
                        {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={logoUrl}
                                alt={uniName}
                                style={{ height: logoSize, width: "auto", maxWidth: 140 }}
                                className="object-contain shrink-0"
                            />
                        ) : (
                            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center shadow-sm shrink-0">
                                <span className="text-white text-base font-black">
                                    {uniName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <span className="font-heading font-bold text-sm text-slate-900 tracking-tight truncate">
                            {uniName}
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
                    {navItems.map(group => (
                        <div key={group.section}>
                            <p className="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{group.section}</p>
                            <nav className="space-y-0.5">
                                {group.items.map(({ href, label, icon: Icon }) => {
                                    const active = pathname === href || (href !== '/u/dashboard' && pathname?.startsWith(href))
                                    return (
                                        <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
                                            <Icon className="h-4 w-4 shrink-0" />
                                            {label}
                                        </Link>
                                    )
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
                <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6">
                    <p className="text-sm text-slate-500 font-medium capitalize">{pathname?.split('/').filter(Boolean).join(' / ')}</p>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 font-medium hidden sm:flex">Tenant Admin</Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="h-8 w-8 border border-slate-200">
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm">AD</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="font-normal text-xs text-slate-500">{user?.email}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild><Link href="/u/settings/branding"><Palette className="mr-2 h-4 w-4" /> Branding</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/u/audit-logs"><Activity className="mr-2 h-4 w-4" /> Audit Logs</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={handleSignOut} className="text-red-600"><LogOut className="mr-2 h-4 w-4" /> Log out</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">{children}</div>
            </main>
        </div>
    )
}
