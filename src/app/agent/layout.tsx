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
import { LayoutDashboard, Users, KanbanSquare, MessageSquare, LogOut, UserCircle, Activity, Settings, Link2 } from 'lucide-react'

const navItems = [
    {
        section: "Daily Flow", items: [
            { href: "/agent/dashboard", label: "My Dashboard", icon: LayoutDashboard },
            { href: "/agent/leads", label: "Leads Directory", icon: Users },
            { href: "/agent/kanban", label: "Kanban Pipeline", icon: KanbanSquare },
            { href: "/agent/communication", label: "Comms Logs", icon: MessageSquare },
            { href: "/agent/landing", label: "My Landing Page", icon: Link2 },
        ]
    },
    {
        section: "Personal", items: [
            { href: "/agent/activity", label: "My Activity", icon: Activity },
            { href: "/agent/settings", label: "Settings", icon: Settings },
        ]
    },
]

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
    }, [])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            <aside className="fixed inset-y-0 left-0 z-20 w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="h-16 flex items-center px-5 border-b border-slate-200 shrink-0">
                    <div className="flex items-center gap-2 font-heading font-bold text-lg text-slate-900 tracking-tight">
                        <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shadow-sm shrink-0">
                            <span className="text-white text-base font-black">A</span>
                        </div>
                        Staff Portal
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
                    {navItems.map(group => (
                        <div key={group.section}>
                            <p className="px-3 mb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{group.section}</p>
                            <nav className="space-y-0.5">
                                {group.items.map(({ href, label, icon: Icon }) => {
                                    const active = pathname === href || (href !== '/agent/dashboard' && pathname?.startsWith(href))
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
                        <Badge variant="outline" className="border-slate-200 text-slate-600 font-medium hidden sm:flex">Agent</Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <Avatar className="h-8 w-8 border border-slate-200">
                                        <AvatarFallback className="bg-accent/10 text-accent text-sm">AG</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="font-normal text-xs text-slate-500">{user?.email}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild><Link href="/agent/settings"><UserCircle className="mr-2 h-4 w-4" /> My Settings</Link></DropdownMenuItem>
                                <DropdownMenuItem asChild><Link href="/agent/activity"><Activity className="mr-2 h-4 w-4" /> My Activity</Link></DropdownMenuItem>
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
