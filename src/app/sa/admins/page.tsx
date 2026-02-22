"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Plus, Mail, ShieldAlert, Building2, MoreHorizontal } from "lucide-react"

const platformAdmins = [
    { id: "a1", name: "Alice Johnson", email: "alice@harvard.edu", university: "Harvard University", role: "University Admin", lastLogin: "2 hours ago" },
    { id: "a2", name: "Bob Smith", email: "bob@stanford.edu", university: "Stanford University", role: "University Admin", lastLogin: "1 day ago" },
    { id: "a3", name: "Charlie Davis", email: "cdavis@mit.edu", university: "MIT", role: "University Admin", lastLogin: "5 mins ago" },
    { id: "sa1", name: "Super Admin", email: "admin@platform.com", university: "Global Platform", role: "Super Admin", lastLogin: "Just now" },
]

export default function PlatformAdminsPage() {
    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Platform Administrators</h2>
                    <p className="text-slate-500 mt-1">Manage global Super Admins and invite local University Admins.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="text-slate-700 bg-white">
                        <Mail className="mr-2 h-4 w-4" /> Send Invites
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Admin
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Administrator Directory</CardTitle>
                        <CardDescription>All users with elevated system access.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-semibold text-slate-700 pl-6">User</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Assigned Tenant</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Role</TableHead>
                                    <TableHead className="font-semibold text-slate-700">Last Login</TableHead>
                                    <TableHead className="text-right font-semibold text-slate-700 pr-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {platformAdmins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {admin.name.split(" ").map(n => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{admin.name}</p>
                                                    <p className="text-xs text-slate-500">{admin.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                                {admin.university}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={
                                                admin.role === "Super Admin"
                                                    ? "bg-purple-100 text-purple-700 border-purple-200"
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                            }>
                                                {admin.role === "Super Admin" && <ShieldAlert className="w-3 h-3 mr-1" />}
                                                {admin.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {admin.lastLogin}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg">Security Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-[0_2px_8px_rgba(30,58,95,0.02)]">
                            <h4 className="text-sm font-medium text-slate-500">Super Admins</h4>
                            <p className="text-3xl font-heading font-bold text-slate-900 mt-1">1</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-[0_2px_8px_rgba(30,58,95,0.02)]">
                            <h4 className="text-sm font-medium text-slate-500">University Admins</h4>
                            <p className="text-3xl font-heading font-bold text-slate-900 mt-1">64</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            University Admins can only view and mutate data restricted by Row Level Security (RLS) matching their <code>university_id</code>.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
