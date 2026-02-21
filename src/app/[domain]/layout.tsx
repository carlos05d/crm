import { notFound } from 'next/navigation'

export default async function UniversityLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { domain: string }
}) {
    const { domain } = await params

    // Note: in the future we will fetch from Supabase to verify the domain exists
    // and load the tenant's exact color scheme and branding.
    if (!domain) {
        return notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="px-8 py-4 bg-white border-b shadow-sm flex items-center justify-between">
                <div className="font-bold text-xl tracking-tight text-blue-900">
                    🏫 {domain.charAt(0).toUpperCase() + domain.slice(1)} University
                </div>
                <nav className="space-x-4">
                    <a href="#" className="text-sm font-medium hover:underline">Programs</a>
                    <a href="#" className="text-sm font-medium hover:underline">Admissions</a>
                    <a href="#" className="text-sm font-medium hover:underline">Contact</a>
                </nav>
            </header>
            <main className="flex-1 max-w-5xl mx-auto w-full p-8">
                {children}
            </main>
            <footer className="py-6 text-center text-sm text-slate-500 bg-white border-t mt-12">
                © {new Date().getFullYear()} {domain} University. All rights reserved.
            </footer>
        </div>
    )
}
