import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Building2, LayoutDashboard, Settings, Users, LogOut } from "lucide-react"

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

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors border-l-4 border-transparent hover:border-[#1E3A8A]">
                        <LayoutDashboard className="h-4 w-4" />
                        Overview
                    </a>
                    <a href="/dashboard/super" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors border-l-4 border-transparent hover:border-[#1E3A8A]">
                        <Building2 className="h-4 w-4" />
                        Universities (Super Admin)
                    </a>
                    <a href="/dashboard/leads" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors border-l-4 border-transparent hover:border-[#1E3A8A]">
                        <Users className="h-4 w-4" />
                        Leads Pipeline (Agents)
                    </a>
                    <a href="/dashboard/tenant" className="flex items-center gap-3 px-3 py-2 text-slate-700 rounded-md hover:bg-slate-50 hover:text-[#1E3A8A] font-medium text-sm transition-colors border-l-4 border-transparent hover:border-[#1E3A8A]">
                        <Settings className="h-4 w-4" />
                        Tenant Settings
                    </a>
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
                                <DropdownMenuItem className="cursor-pointer text-slate-700 flex items-center">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>My Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-slate-700 flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Account Settings</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#E5E7EB]" />
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-700 flex items-center">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
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
