"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, BookOpen, ChevronRight } from "lucide-react"

export default function DepartmentsPage() {
    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Departments & Programs</h2>
                    <p className="text-slate-500 mt-1">Configure internal routing structures and study programs leads can apply for.</p>
                </div>
                <div>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Department
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Department Block */}
                <Card className="border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                        <div>
                            <CardTitle className="text-lg">Undergraduate Admissions</CardTitle>
                            <CardDescription>Main enrollment branch for bachelor degrees.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <Plus className="h-4 w-4 text-slate-500" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {[
                                "BSc Computer Science",
                                "BA Business Administration",
                                "BSc Nursing",
                                "BA Liberal Arts"
                            ].map((program, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700">{program}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Department Block */}
                <Card className="border-slate-200 overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                        <div>
                            <CardTitle className="text-lg">Graduate Studies</CardTitle>
                            <CardDescription>Masters and PhD programs.</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                            <Plus className="h-4 w-4 text-slate-500" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {[
                                "MSc Data Analytics",
                                "PhD Physics",
                                "MBA Executive",
                            ].map((program, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="h-4 w-4 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700">{program}</span>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
