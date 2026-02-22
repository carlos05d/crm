"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, MoreHorizontal, Building2, CheckCircle2, Ban } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

const universities = [
    { id: "u1", name: "Harvard University", subdomain: "harvard", plan: "Enterprise", status: "Active", created: "2024-01-15", admins: 3 },
    { id: "u2", name: "Stanford University", subdomain: "stanford", plan: "Premium", status: "Active", created: "2024-02-20", admins: 5 },
    { id: "u3", name: "MIT", subdomain: "mit", plan: "Enterprise", status: "Active", created: "2024-03-10", admins: 2 },
    { id: "u4", name: "Local College", subdomain: "local", plan: "Basic", status: "Suspended", created: "2024-04-05", admins: 1 },
    { id: "u5", name: "Oxford University", subdomain: "oxford", plan: "Premium", status: "Active", created: "2024-05-12", admins: 4 },
]

export default function UniversitiesManagementPage() {
    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">University Tenants</h2>
                    <p className="text-slate-500 mt-1">Create, configure, and manage institutional tenants on the platform.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search"
                            placeholder="Search universities..."
                            className="pl-8 w-[250px] bg-white rounded-md"
                        />
                    </div>
                    <Button variant="outline" className="text-slate-700 bg-white">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add University
                    </Button>
                </div>
            </div>

            <Card className="rounded-xl border-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50 rounded-t-xl hidden">
                    <CardTitle>Directory</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700">Institution Name</TableHead>
                                <TableHead className="font-semibold text-slate-700">System Link</TableHead>
                                <TableHead className="font-semibold text-slate-700">Subscription</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center">Admins</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700">Joined</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {universities.map((uni) => (
                                <TableRow key={uni.id} className="cursor-pointer hover:bg-slate-50/50">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-md bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                                                <Building2 className="h-4 w-4" />
                                            </div>
                                            <span className="font-medium text-slate-900">{uni.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-mono text-xs px-2 py-1 bg-slate-100 rounded inline-flex text-slate-600 border border-slate-200">
                                            {uni.subdomain}.platform.com
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-medium">
                                            {uni.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-slate-600">
                                        {uni.admins}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            {uni.status === "Active" ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            ) : (
                                                <Ban className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className={`text-sm font-medium ${uni.status === "Active" ? "text-emerald-700" : "text-red-700"}`}>
                                                {uni.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {uni.created}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem className="text-slate-700 cursor-pointer">
                                                    Manage Admins
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-slate-700 cursor-pointer">
                                                    Edit Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-slate-700 cursor-pointer">
                                                    Upgrade Plan
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {uni.status === "Active" ? (
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-700 cursor-pointer">
                                                        Suspend Tenant
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="text-emerald-600 focus:text-emerald-700 cursor-pointer">
                                                        Reactivate Tenant
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
