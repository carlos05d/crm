import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone } from "lucide-react"

// Mock Data Structure
const stages = [
    { id: "s1", name: "New Inquiries", color: "bg-slate-100 border-slate-200 text-slate-700" },
    { id: "s2", name: "Contacted", color: "bg-blue-50 border-blue-100 text-blue-700" },
    { id: "s3", name: "Application Started", color: "bg-amber-50 border-amber-100 text-amber-700" },
    { id: "s4", name: "Requires Review", color: "bg-purple-50 border-purple-100 text-purple-700" },
    { id: "s5", name: "Admitted", color: "bg-green-50 border-green-100 text-green-700" },
]

const leads = [
    { id: "l1", name: "Emma Thompson", program: "BSc Computer Science", stageId: "s1", date: "2h ago", priority: "High" },
    { id: "l2", name: "James Wilson", program: "BA Business Admin", stageId: "s1", date: "5h ago", priority: "Normal" },
    { id: "l3", name: "Sarah Chen", program: "MSc Data Analytics", stageId: "s2", date: "1d ago", priority: "Normal" },
    { id: "l4", name: "Michael Rodriguez", program: "PhD Physics", stageId: "s3", date: "2d ago", priority: "High" },
    { id: "l5", name: "Lisa Patel", program: "BSc Nursing", stageId: "s4", date: "3d ago", priority: "Urgent" },
]

export default function LeadsPipelineDashboard() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col font-sans">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Leads Pipeline</h2>
                    <p className="text-slate-500 mt-1">Manage prospective students through the admissions funnel.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            type="search"
                            placeholder="Search leads..."
                            className="pl-8 w-[250px] border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md"
                        />
                    </div>
                    <Button variant="outline" className="text-slate-700 border-slate-300 hidden sm:flex">
                        <Filter className="mr-2 h-4 w-4" /> Filter
                    </Button>
                    <Button className="bg-[#1E3A8A] hover:bg-[#14532D] text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add Lead
                    </Button>
                </div>
            </div>

            {/* Kanban Board Area */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex h-full gap-4 items-start min-w-max px-1">

                    {stages.map((stage) => {
                        const stageLeads = leads.filter(l => l.stageId === stage.id)

                        return (
                            <div key={stage.id} className="w-80 flex flex-col h-[calc(100vh-14rem)] bg-slate-50 rounded-xl border border-slate-200">
                                {/* Stage Header */}
                                <div className="p-3 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white rounded-t-xl">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${stage.color}`}>
                                            {stage.name}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500">{stageLeads.length}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Lead Cards List */}
                                <ScrollArea className="flex-1 p-3">
                                    <div className="space-y-3">
                                        {stageLeads.map((lead) => (
                                            <Card key={lead.id} className="border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-lg">
                                                <CardHeader className="p-3 pb-2 space-y-0 flex flex-row items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-sm font-semibold text-slate-900">{lead.name}</CardTitle>
                                                        <p className="text-xs font-medium text-[#1E3A8A] mt-0.5">{lead.program}</p>
                                                    </div>
                                                    {lead.priority === "Urgent" || lead.priority === "High" ? (
                                                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 border-none ${lead.priority === "Urgent" ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                                                            }`}>
                                                            {lead.priority}
                                                        </Badge>
                                                    ) : null}
                                                </CardHeader>
                                                <CardContent className="p-3 pt-0">
                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-[11px] font-medium text-slate-500 flex items-center">
                                                            {lead.date}
                                                        </span>
                                                        <div className="flex items-center space-x-1">
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100">
                                                                <Mail className="h-3.5 w-3.5" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#1E3A8A] hover:bg-slate-100">
                                                                <Phone className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {stageLeads.length === 0 && (
                                        <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 mt-1">
                                            <p className="text-xs font-medium text-slate-400">Empty list</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>
                        )
                    })}

                </div>
            </div>
        </div>
    )
}
