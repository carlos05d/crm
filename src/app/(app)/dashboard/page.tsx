import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Search, Building2, Users, CreditCard, Activity } from "lucide-react"

// Mock Data
const universities = [
    { id: "u1", name: "Harvard University", subdomain: "harvard", plan: "Enterprise", students: 12450, status: "Active" },
    { id: "u2", name: "Stanford University", subdomain: "stanford", plan: "Premium", students: 8200, status: "Active" },
    { id: "u3", name: "MIT", subdomain: "mit", plan: "Enterprise", students: 11000, status: "Active" },
    { id: "u4", name: "Local College", subdomain: "local", plan: "Basic", students: 450, status: "Inactive" },
    { id: "u5", name: "Oxford University", subdomain: "oxford", plan: "Premium", students: 9300, status: "Active" },
]

export default function SuperAdminDashboard() {
    return (
        <div className="space-y-8 font-sans">

            {/* Header section */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Universities Overview</h2>
                    <p className="text-slate-500 mt-1">Manage tenant accounts, subscriptions, and system health.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button className="bg-[#1E3A8A] hover:bg-[#14532D] text-white">
                        <Plus className="mr-2 h-4 w-4" /> Add New University
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-[#E5E7EB] shadow-sm rounded-xl bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Universities</CardTitle>
                        <Building2 className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">42</div>
                        <p className="text-xs text-slate-500 mt-1">+2 from last month</p>
                    </CardContent>
                </Card>

                <Card className="border-[#E5E7EB] shadow-sm rounded-xl bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Active Students</CardTitle>
                        <Users className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">142,300</div>
                        <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
                    </CardContent>
                </Card>

                <Card className="border-[#E5E7EB] shadow-sm rounded-xl bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Revenue</CardTitle>
                        <CreditCard className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-900">$284,500</div>
                        <p className="text-xs text-slate-500 mt-1">+4% from last month</p>
                    </CardContent>
                </Card>

                <Card className="border-[#E5E7EB] shadow-sm rounded-xl bg-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">System Health</CardTitle>
                        <Activity className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#14532D]">99.9%</div>
                        <p className="text-xs text-slate-500 mt-1">All services operational</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table Section */}
            <Card className="border-[#E5E7EB] shadow-sm rounded-xl bg-white">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-slate-900">Tenant Directory</CardTitle>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                                <Input
                                    type="search"
                                    placeholder="Search universities..."
                                    className="pl-8 w-[250px] border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-[#E5E7EB]">
                                <TableHead className="font-semibold text-slate-700">Name</TableHead>
                                <TableHead className="font-semibold text-slate-700">Subdomain</TableHead>
                                <TableHead className="font-semibold text-slate-700">Plan Type</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">Active Students</TableHead>
                                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {universities.map((uni) => (
                                <TableRow key={uni.id} className="border-[#E5E7EB]">
                                    <TableCell className="font-medium text-slate-900">{uni.name}</TableCell>
                                    <TableCell className="text-slate-600">
                                        <span className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">{uni.subdomain}.platform.com</span>
                                    </TableCell>
                                    <TableCell className="text-slate-600">{uni.plan}</TableCell>
                                    <TableCell className="text-right text-slate-600">{uni.students.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={
                                            uni.status === "Active"
                                                ? "bg-[#14532D]/10 text-[#14532D] border-[#14532D]/20 shadow-none font-medium"
                                                : "bg-slate-100 text-slate-600 border-slate-200 shadow-none font-medium"
                                        }>
                                            {uni.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4 text-slate-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px] rounded-md border-[#E5E7EB] shadow-md">
                                                <DropdownMenuItem className="cursor-pointer text-slate-700">View Details</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-slate-700">Manage Drivers</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600">Suspend Account</DropdownMenuItem>
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
