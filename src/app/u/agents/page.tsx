"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone, Building2, Loader2, CheckCircle2 } from "lucide-react"
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

export default function TenantAgentManagementPage() {
    const [isInviting, setIsInviting] = useState(false)
    const [inviteSuccess, setInviteSuccess] = useState(false)
    const [inviteError, setInviteError] = useState("")

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsInviting(true)
        setInviteError("")
        setInviteSuccess(false)

        try {
            const { data, error } = await supabase.functions.invoke('provisionAgent', {
                body: { name, email, phone }
            })

            if (error) throw error

            setInviteSuccess(true)
            setTimeout(() => {
                setInviteSuccess(false)
                setName("")
                setEmail("")
                setPhone("")
                // In a real app we would refetch the agents list here
            }, 3000)

        } catch (error: any) {
            setInviteError(error.message || "Failed to provision agent. Please try again.")
        } finally {
            setIsInviting(false)
        }
    }

    // Default placeholder data
    const tenantAgents = [
        { id: "a1", name: "Sarah Williams", email: "swilliams@university.edu", role: "Sr. Agent", dept: "Undergraduate Admissions", status: "Active", leads: 42 },
        { id: "a2", name: "David Chen", email: "dchen@university.edu", role: "Agent", dept: "Graduate Engineering", status: "Active", leads: 18 },
    ]

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Agent Management</h2>
                    <p className="text-slate-500 mt-1">Onboard staff, assign departments, and track active conversion agents.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search"
                            placeholder="Search agents..."
                            className="pl-8 w-[250px] bg-white rounded-md border-slate-200 focus-visible:ring-primary"
                        />
                    </div>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> Invite Agent
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Provision New Agent</DialogTitle>
                                <DialogDescription>
                                    This will automatically create their user account, assign permissions, and send an email invite.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite}>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Doe" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Work Email</Label>
                                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@university.edu" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                                {inviteError && <p className="text-sm text-red-600 mb-4">{inviteError}</p>}
                                {inviteSuccess && (
                                    <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center text-sm">
                                        <CheckCircle2 className="h-4 w-4 mr-2" /> Agent successfully provisioned and invited!
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button type="submit" disabled={isInviting}>
                                        {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                        Send Invite
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="rounded-xl border-slate-200">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700 w-[300px]">Agent Profile</TableHead>
                                <TableHead className="font-semibold text-slate-700">Department</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center">Active Leads</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenantAgents.map((agent) => (
                                <TableRow key={agent.id} className="hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 border border-slate-200">
                                                <AvatarFallback className="bg-blue-50 text-primary">
                                                    {agent.name.split(" ").map(n => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-900">{agent.name}</span>
                                                <span className="text-xs text-slate-500">{agent.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Building2 className="h-4 w-4 text-slate-400" />
                                            <span className="text-sm">{agent.dept}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none">
                                            {agent.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <span className="font-medium text-slate-900">{agent.leads}</span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
