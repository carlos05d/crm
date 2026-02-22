"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, BookOpen, ChevronRight, MoreHorizontal, Pencil, Trash2, Loader2, Search, Building2 } from "lucide-react"

type Department = { id: string; name: string }
type Program = { id: string; name: string; department_id: string }

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(true)
    const [universityId, setUniversityId] = useState<string | null>(null)
    const [search, setSearch] = useState("")

    // Modals state
    const [addDeptOpen, setAddDeptOpen] = useState(false)
    const [editDeptOpen, setEditDeptOpen] = useState(false)
    const [activeDept, setActiveDept] = useState<Department | null>(null)
    const [deptName, setDeptName] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
        if (!profile?.university_id) return
        setUniversityId(profile.university_id)

        const [
            { data: depts },
            { data: progs }
        ] = await Promise.all([
            supabase.from("departments").select("id, name").eq("university_id", profile.university_id).order("name"),
            supabase.from("programs").select("id, name, department_id").eq("university_id", profile.university_id).order("name")
        ])

        setDepartments(depts ?? [])
        setPrograms(progs ?? [])
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleAddDepartment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!deptName.trim() || !universityId) return
        setActionLoading(true)

        const { data, error } = await supabase
            .from("departments")
            .insert({ university_id: universityId, name: deptName.trim() })
            .select()
            .single()

        if (!error && data) {
            setDepartments(prev => [...prev, data as Department].sort((a, b) => a.name.localeCompare(b.name)))
            setAddDeptOpen(false)
            setDeptName("")
        }
        setActionLoading(false)
    }

    const handleEditDepartment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!deptName.trim() || !activeDept) return
        setActionLoading(true)

        const { error } = await supabase
            .from("departments")
            .update({ name: deptName.trim() })
            .eq("id", activeDept.id)

        if (!error) {
            setDepartments(prev => prev.map(d => d.id === activeDept.id ? { ...d, name: deptName.trim() } : d).sort((a, b) => a.name.localeCompare(b.name)))
            setEditDeptOpen(false)
        }
        setActionLoading(false)
    }

    const handleDeleteDepartment = async (id: string) => {
        if (!confirm("Are you sure? This will delete the department and unassign all its programs.")) return
        const { error } = await supabase.from("departments").delete().eq("id", id)
        if (!error) {
            setDepartments(prev => prev.filter(d => d.id !== id))
            setPrograms(prev => prev.map(p => p.department_id === id ? { ...p, department_id: "" } : p))
        }
    }

    // ── Render Helpers ────────────────────────────────────────────────────────
    const filteredDepts = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-heading font-bold tracking-tight text-slate-900">Departments</h2>
                    <p className="text-slate-500 mt-1">Configure internal branches and manage associated programs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search departments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 bg-white"
                        />
                    </div>
                    <Button onClick={() => { setDeptName(""); setAddDeptOpen(true) }}>
                        <Plus className="mr-2 h-4 w-4" /> Add Department
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl" />
                </div>
            ) : filteredDepts.length === 0 ? (
                <Card className="border-dashed border-2 bg-transparent shadow-none">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                        <Building2 className="h-10 w-10 text-slate-200 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No departments found</h3>
                        <p className="text-slate-500 mt-1 max-w-sm mb-6">
                            Departments group your study programs together. Create your first department to get started.
                        </p>
                        <Button onClick={() => { setDeptName(""); setAddDeptOpen(true) }}>
                            <Plus className="mr-2 h-4 w-4" /> Create Department
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-start">
                    {filteredDepts.map(dept => {
                        const deptPrograms = programs.filter(p => p.department_id === dept.id)
                        return (
                            <Card key={dept.id} className="border-slate-200 overflow-hidden shadow-sm hover:shadow transition-all">
                                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between py-4 group">
                                    <div>
                                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                                        <CardDescription>{deptPrograms.length} active programs</CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => { setActiveDept(dept); setDeptName(dept.name); setEditDeptOpen(true) }}>
                                                <Pencil className="h-4 w-4 mr-2" /> Edit Name
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteDepartment(dept.id)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete Department
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {deptPrograms.length === 0 ? (
                                            <div className="p-6 text-center text-sm text-slate-400">
                                                No programs assigned.
                                            </div>
                                        ) : (
                                            deptPrograms.map(program => (
                                                <div key={program.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                                                        <span className="text-sm font-medium text-slate-700 truncate">{program.name}</span>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Modals ------------------------------------- */}
            <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Department</DialogTitle>
                        <DialogDescription>Create a new grouping for your academic programs.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddDepartment} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="deptName">Department Name</Label>
                            <Input
                                id="deptName"
                                value={deptName}
                                onChange={e => setDeptName(e.target.value)}
                                placeholder="e.g. Undergraduate Admissions"
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setAddDeptOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Department
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={editDeptOpen} onOpenChange={setEditDeptOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                        <DialogDescription>Update the name of this department.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditDepartment} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="editDeptName">Department Name</Label>
                            <Input
                                id="editDeptName"
                                value={deptName}
                                onChange={e => setDeptName(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditDeptOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Department
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
