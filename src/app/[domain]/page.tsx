export default async function UniversityPage({
    params,
}: {
    params: { domain: string }
}) {
    const { domain } = await params

    return (
        <div className="space-y-8">
            <section className="text-center py-20 bg-blue-50 rounded-3xl border border-blue-100">
                <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                    Welcome to {domain.charAt(0).toUpperCase() + domain.slice(1)}!
                </h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Start your journey with us today. Fill out our public lead form to register your interest in our programs.
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-2xl border shadow-sm">
                    <h2 className="text-xl font-bold mb-2">Our Programs</h2>
                    <p className="text-slate-600 mb-4">Explore top-tier education tracks tailored for your future.</p>
                    <button className="px-4 py-2 bg-slate-100 text-sm font-semibold rounded-lg hover:bg-slate-200">View Programs</button>
                </div>
                <div className="p-6 bg-white rounded-2xl border shadow-sm">
                    <h2 className="text-xl font-bold mb-2">Admissions</h2>
                    <p className="text-slate-600 mb-4">Get in touch with one of our specialized educational agents.</p>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">Apply Now</button>
                </div>
            </section>
        </div>
    )
}
