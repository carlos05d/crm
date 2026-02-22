"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const auditLogs = [
    { id: "1", action: "Deleted Agent", user: "Alice Johnson", resource: "Profile Table", date: "2024-10-24 14:23:41" },
    { id: "2", action: "Changed Branding", user: "Bob Smith", resource: "Tenant Config", date: "2024-10-24 13:10:02" },
    { id: "3", action: "Exported Leads", user: "Charlie Davis", resource: "Lead Pipeline", date: "2024-10-24 09:44:11" },
    { id: "4", action: "Suspended Tenant", user: "Super Admin", resource: "University Table", date: "2024-10-23 16:55:00" },
]

export default function AuditLogsPage() {
    return (
        <div className="space-y-6 font-sans">
            <div>
                <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Audit Logs</h2>
                <p className="text-slate-500 mt-1">Review critical system actions and modifications across the entire platform.</p>
            </div>

            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle>System Activity</CardTitle>
                    <CardDescription>A complete history of major data mutations.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-semibold text-slate-700 font-mono">Timestamp</TableHead>
                                <TableHead className="font-semibold text-slate-700">Action</TableHead>
                                <TableHead className="font-semibold text-slate-700">User</TableHead>
                                <TableHead className="font-semibold text-slate-700">Resource</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {auditLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs text-slate-500">{log.date}</TableCell>
                                    <TableCell>
                                        <span className="font-medium text-slate-900">{log.action}</span>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{log.user}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-slate-500 bg-slate-50">
                                            {log.resource}
                                        </Badge>
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
