"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, MoreHorizontal, MessageSquare, Flame } from "lucide-react"

const leads = [
    { id: "L-101", name: "Emma Thompson", email: "emma@example.com", program: "BSc Computer Science", stage: "New Inquiries", score: 85, date: "Oct 24, 2024" },
    { id: "L-102", name: "James Wilson", email: "jwilson@test.com", program: "BA Business Admin", stage: "Contacted", score: 42, date: "Oct 23, 2024" },
    { id: "L-103", name: "Sarah Chen", email: "schen@demo.org", program: "MSc Data Analytics", stage: "Application Started", score: 67, date: "Oct 21, 2024" },
    { id: "L-104", name: "Michael Rodriguez", email: "mrod@sample.net", program: "PhD Physics", stage: "Requires Review", score: 92, date: "Oct 20, 2024" },
    { id: "L-105", name: "Lisa Patel", email: "lpatel@test.com", program: "BSc Nursing", stage: "Admitted", score: 98, date: "Oct 18, 2024" },
]

export default function LeadListViewPage() {
    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Leads Directory</h2>
                    <p className="text-slate-500 mt-1">Detailed list view of all assigned prospects and applicants.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search"
                            placeholder="Search leads by name or ID..."
                            className="pl-8 w-[300px] bg-white rounded-md border-slate-200"
                        />
                    </div>
                    <Button variant="outline" className="text-slate-700 bg-white">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Lead
                    </Button>
                </div>
            </div>

            <Card className="rounded-xl border-slate-200">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700 w-[100px]">Lead ID</TableHead>
                                <TableHead className="font-semibold text-slate-700">Prospect Name</TableHead>
                                <TableHead className="font-semibold text-slate-700">Program Interest</TableHead>
                                <TableHead className="font-semibold text-slate-700">Current Stage</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-center">Score</TableHead>
                                <TableHead className="font-semibold text-slate-700">Created</TableHead>
                                <TableHead className="text-right font-semibold text-slate-700">Quick Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leads.map((lead) => (
                                <TableRow key={lead.id} className="hover:bg-slate-50/50 cursor-pointer">
                                    <TableCell className="font-mono text-xs text-slate-500">
                                        {lead.id}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-900">{lead.name}</span>
                                            <span className="text-xs text-slate-500">{lead.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-primary font-medium">
                                        {lead.program}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-50 text-slate-600">
                                            {lead.stage}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            {lead.score > 80 && <Flame className="h-3.5 w-3.5 text-orange-500" />}
                                            <span className="font-medium text-slate-700">{lead.score}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">
                                        {lead.date}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
                                            <MessageSquare className="h-4 w-4" />
                                        </Button>
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
