export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen">
            <aside className="w-64 border-r bg-muted/20">
                <nav className="p-4 space-y-2">
                    <div className="font-bold mb-6 tracking-tight flex items-center gap-2">
                        🚀 Platform Dashboard
                    </div>
                    <a href="/dashboard" className="block px-3 py-2 rounded-md hover:bg-muted font-medium text-sm">Overview</a>
                    <a href="#" className="block px-3 py-2 rounded-md hover:bg-muted font-medium text-sm">Universities (Super Admin)</a>
                    <a href="#" className="block px-3 py-2 rounded-md hover:bg-muted font-medium text-sm">Leads (Agents)</a>
                    <a href="/dashboard/tenant" className="block px-3 py-2 rounded-md hover:bg-muted font-medium text-sm">Tenant Settings</a>
                </nav>
            </aside>
            <main className="flex-1 p-8">
                {children}
            </main>
        </div>
    )
}
