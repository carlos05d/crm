"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, BookOpen, Trash2, FolderOpen, Save, Loader2, Users } from "lucide-react"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@supabase/ssr"

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<any[]>([])
    const [departments, setDepartments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDeptId, setNewDeptId] = useState("")
    const [universityId, setUniversityId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from("profiles").select("university_id").eq("id", user.id).single()
        if (!profile?.university_id) return
        setUniversityId(profile.university_id)

        const [{ data: prog }, { data: dept }] = await Promise.all([
            // Join leads to get a count of students interested/enrolled in the program
            supabase.from("programs")
                .select("id, name, department_id, departments(name), leads(id)")
                .eq("university_id", profile.university_id)
                .order("name"),
            supabase.from("departments").select("id, name").eq("university_id", profile.university_id).order("name"),
        ])

        // the count comes back as an array of leads, so we just map it to the length
        const mappedProgs = (prog ?? []).map((p: any) => ({
            ...p,
            studentsCount: p.leads ? p.leads.length : 0
        }))

        setPrograms(mappedProgs)
        setDepartments(dept ?? [])
        setLoading(false)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!universityId || !newName.trim()) return
        setSaving(true)

        const deptId = newDeptId === "unassigned" || !newDeptId ? null : newDeptId

        const { error } = await supabase.from("programs").insert({
            university_id: universityId,
            name: newName.trim(),
            department_id: deptId,
        })
        if (!error) {
            setNewName("")
            setNewDeptId("")
            await fetchData()
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        await supabase.from("programs").delete().eq("id", id)
        setPrograms(prev => prev.filter(p => p.id !== id))
        setDeleting(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">Programs</h1>
                    <p className="text-slate-500 mt-1">Manage academic programs and associate them with departments.</p>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Program</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Create New Program</DialogTitle>
                            <DialogDescription>Add a program/course to your academic catalog.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prog-name">Program Name</Label>
                                    <Input id="prog-name" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="BSc Computer Science" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Department (Optional)</Label>
                                    <Select value={newDeptId} onValueChange={setNewDeptId}>
                                        <SelectTrigger><SelectValue placeholder="Select department..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">No Department</SelectItem>
                                            {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={saving}>
                                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Program
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : programs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
                    <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No programs yet.</p>
                    <p className="text-sm text-slate-400 mt-1">Add your first academic program to the catalog.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programs.map(prog => (
                        <Card key={prog.id} className="rounded-xl border-slate-200 hover:shadow-sm transition-shadow group">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                        <BookOpen className="h-4 w-4 text-primary" />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                        onClick={() => handleDelete(prog.id)}
                                        disabled={deleting === prog.id}
                                    >
                                        {deleting === prog.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                                    </Button>
                                </div>
                                <CardTitle className="text-sm font-semibold text-slate-900 mt-2 leading-tight">{prog.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2 mt-2">
                                    <div className="flex items-center text-sm text-slate-500">
                                        <Users className="mr-1.5 h-4 w-4 text-slate-400" />
                                        <span>{prog.studentsCount || 0} students enrolled</span>
                                    </div>
                                    {prog.departments?.name && (
                                        <Badge variant="outline" className="w-fit text-xs bg-slate-50">📂 {prog.departments.name}</Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
