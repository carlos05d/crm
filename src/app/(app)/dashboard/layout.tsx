import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Building2, LayoutDashboard, Settings, Users, LogOut } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-[#F9FAFB] font-sans">

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-[#E5E7EB] bg-white flex flex-col">
                <div className="p-6 border-b border-[#E5E7EB]">
                    <div className="font-bold text-xl tracking-tight text-[#1E3A8A] flex items-center gap-2">
                        <Building2 className="h-6 w-6" />
                        Platform
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">

                    {/* Super Admin Section */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Super Admin</h3>
                        <div className="space-y-1">
                            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors">
                                <LayoutDashboard className="h-4 w-4" />
                                Platform Overview
                            </Link>
                            <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors">
                                <Building2 className="h-4 w-4" />
                                University Tenants
                            </Link>
                        </div>
                    </div>

                    {/* Tenant Admin Section */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">University Admin</h3>
                        <div className="space-y-1">
                            <Link href="/dashboard/tenant" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors">
                                <Settings className="h-4 w-4" />
                                Tenant Settings
                            </Link>
                            <Link href="#" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors">
                                <Users className="h-4 w-4" />
                                Staff Management
                            </Link>
                        </div>
                    </div>

                    {/* Agent Section */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Agent Workspace</h3>
                        <div className="space-y-1">
                            <Link href="/dashboard/leads" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors">
                                <Users className="h-4 w-4" />
                                Leads Pipeline
                            </Link>
                        </div>
                    </div>

                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* Top Header Bar */}
                <header className="h-16 border-b border-[#E5E7EB] bg-white flex items-center justify-end px-8 shrink-0">
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="focus:outline-none">
                                <div className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-medium text-slate-900 leading-none">Admin User</p>
                                        <p className="text-xs text-slate-500 mt-1">Super Admin</p>
                                    </div>
                                    <Avatar className="h-9 w-9 border border-slate-200">
                                        <AvatarImage src="https://github.com/shadcn.png" alt="@admin" />
                                        <AvatarFallback className="bg-[#1E3A8A] text-white">AU</AvatarFallback>
                                    </Avatar>
                                </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 border-[#E5E7EB] shadow-md rounded-lg">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">Admin User</p>
                                        <p className="text-xs leading-none text-slate-500">admin@platform.com</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                                <DropdownMenuItem asChild className="cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#1E3A8A]">
                                    <Link href="/dashboard/profile" className="flex items-center w-full">
                                        <Users className="mr-2 h-4 w-4" />
                                        <span>My Profile</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="cursor-pointer text-slate-700 focus:bg-slate-50 focus:text-[#1E3A8A]">
                                    <Link href="/dashboard/settings" className="flex items-center w-full">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Account Settings</span>
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                                <DropdownMenuItem asChild className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                    <Link href="/login" className="flex items-center w-full">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

        </div>
    )
}
