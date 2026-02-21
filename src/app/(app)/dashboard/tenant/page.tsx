import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function TenantAdminDashboard() {
    return (
        <div className="space-y-6 sm:space-y-8 font-sans pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">University Settings</h2>
                    <p className="text-slate-500 mt-1">Manage your institution's profile, branding, and core configurations.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" className="text-slate-700 border-slate-300">
                        Cancel
                    </Button>
                    <Button className="bg-[#1E3A8A] hover:bg-[#14532D] text-white">
                        Save Changes
                    </Button>
                </div>
            </div>

            <Separator className="bg-[#E5E7EB]" />

            {/* Two Layout Container */}
            <div className="flex flex-col md:flex-row gap-8">

                {/* Left Column: Navigation Panel */}
                <aside className="w-full md:w-64 shrink-0">
                    <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-4 md:pb-0">
                        <a href="#" className="bg-slate-100 text-[#1E3A8A] border-l-4 border-[#1E3A8A] px-4 py-2 text-sm font-semibold rounded-r-md whitespace-nowrap">
                            General Information
                        </a>
                        <a href="#" className="text-slate-600 hover:bg-slate-50 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap border-l-4 border-transparent hover:border-slate-300 transition-colors">
                            Branding & Colors
                        </a>
                        <a href="#" className="text-slate-600 hover:bg-slate-50 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap border-l-4 border-transparent hover:border-slate-300 transition-colors">
                            Departments & Programs
                        </a>
                        <a href="#" className="text-slate-600 hover:bg-slate-50 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap border-l-4 border-transparent hover:border-slate-300 transition-colors">
                            User Management
                        </a>
                        <a href="#" className="text-slate-600 hover:bg-slate-50 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap border-l-4 border-transparent hover:border-slate-300 transition-colors">
                            Billing & Subscriptions
                        </a>
                    </nav>
                </aside>

                {/* Right Column: Main Content Area */}
                <div className="flex-1 space-y-8">

                    <Card className="border-[#E5E7EB] shadow-sm rounded-xl bg-white">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-900">Institution Details</CardTitle>
                            <CardDescription className="text-slate-500">
                                Update your university's core contact information and public-facing name.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="uni-name" className="text-sm font-medium text-slate-700">University Name</Label>
                                    <Input id="uni-name" defaultValue="Harvard University" className="border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subdomain" className="text-sm font-medium text-slate-700">System Subdomain</Label>
                                    <div className="flex">
                                        <Input id="subdomain" defaultValue="harvard" className="rounded-r-none border-[#E5E7EB] focus-visible:ring-[#3B82F6] z-10" />
                                        <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-[#E5E7EB] bg-slate-50 text-slate-500 text-sm">
                                            .platform.com
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Primary Contact Email</Label>
                                    <Input id="email" type="email" defaultValue="admissions@harvard.edu" className="border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Contact Phone Number</Label>
                                    <Input id="phone" type="tel" defaultValue="+1 (617) 495-1000" className="border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md" />
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    <Card className="border-[#E5E7EB] shadow-sm rounded-xl bg-white">
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold text-slate-900">Brand Identity</CardTitle>
                            <CardDescription className="text-slate-500">
                                Configure the visual experience for your public landing page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className="flex items-center space-x-6">
                                <Avatar className="h-20 w-20 border border-slate-200 shadow-sm">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="@university" />
                                    <AvatarFallback className="bg-slate-100 text-slate-500 text-lg">HU</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-slate-900">Institution Logo</h4>
                                    <p className="text-xs text-slate-500 max-w-xs">
                                        Recommended size: 512x512px. JPG, PNG, or SVG. Maximum file size 2MB.
                                    </p>
                                    <div className="flex space-x-2">
                                        <Button variant="outline" size="sm" className="text-slate-700 border-slate-300">Upload New</Button>
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">Remove</Button>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-[#E5E7EB]" />

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-slate-700 mb-1">Primary Brand Color</h4>
                                    <p className="text-xs text-slate-500">Used for primary buttons, accent borders, and header backgrounds on your subdomain.</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-md shadow-inner border border-slate-200" style={{ backgroundColor: '#A51C30' }}></div>
                                    <Input defaultValue="#A51C30" className="w-32 border-[#E5E7EB] focus-visible:ring-[#3B82F6] rounded-md uppercase font-mono text-sm" />
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t border-[#E5E7EB] rounded-b-xl flex justify-between">
                            <p className="text-xs text-slate-500">Changes to branding take about 60 seconds to propagate to the cache.</p>
                            <Button variant="outline" size="sm" className="bg-white text-slate-700 border-slate-300">
                                Preview Public Page
                            </Button>
                        </CardFooter>
                    </Card>

                </div>
            </div>
        </div>
    )
}
