import { Button } from "@/components/ui/button"
import { Building2, GraduationCap, ArrowRight, ShieldCheck, Users, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">UniversityApp</span>
          </div>
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#solutions" className="hover:text-primary transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
              Sign In
            </Link>
            <Button variant="default" className="shadow-sm transition-all text-sm h-9 px-4 hidden sm:flex">
              Book a Demo
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden px-6">
        {/* Abstract Background Design */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-50 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full blur-3xl opacity-50 -z-10"></div>

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            The #1 CRM for Global Universities
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Transform your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">admissions</span> pipeline.
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Empower your agents, organize leads in beautiful Kanban boards, and increase enrollment conversion rates across all your campuses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button className="w-full sm:w-auto h-14 px-8 bg-primary hover:bg-[#152a45] text-white text-lg font-semibold shadow-xl hover:shadow-2xl transition-all group">
              <Link href="/login" className="flex items-center">
                Start your free trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto h-14 px-8 border-slate-300 text-slate-700 text-lg font-semibold hover:bg-slate-50 transition-all">
              Talk to Sales
            </Button>
          </div>
        </div>

        {/* Hero Dashboard Preview (Mockup) */}
        <div className="max-w-6xl mx-auto mt-20 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden translate-y-4 hover:-translate-y-2 transition-transform duration-700 ease-out">
          <div className="h-12 border-b border-slate-100 bg-slate-50 flex items-center px-4 gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="mx-auto h-6 w-64 bg-white border border-slate-200 rounded text-xs flex items-center justify-center text-slate-400">
              app.universitycrm.com
            </div>
          </div>
          {/* Fake Kanban layout representation */}
          <div className="p-8 bg-slate-50 grid grid-cols-3 gap-6 h-[400px]">
            {[1, 2, 3].map((col) => (
              <div key={col} className="bg-white border text-center border-slate-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="h-8 w-24 bg-slate-100 rounded"></div>
                <div className="h-24 bg-blue-50 border border-blue-100 rounded-lg"></div>
                {col !== 3 && <div className="h-24 bg-slate-50 border border-slate-100 rounded-lg"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-slate-900">
              Everything you need to <span className="text-primary">scale enrollments</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Built specifically for the complexities of modern higher education institutions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Multi-Tenant Architecture</h3>
              <p className="text-slate-600 leading-relaxed">
                Manage multiple satellite campuses or distinct university brands from one unified Super Admin platform.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-emerald-800" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Agent Kanban Pipelines</h3>
              <p className="text-slate-600 leading-relaxed">
                Give your admissions agents a blazing-fast workspace. Drag and drop leads through stages instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="h-7 w-7 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">High-Converting Forms</h3>
              <p className="text-slate-600 leading-relaxed">
                Generate branded, public-facing lead capture pages hosted directly on your university's subdomain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 bg-primary text-white">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <ShieldCheck className="h-16 w-16 mx-auto text-blue-300" />
          <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight">
            Enterprise-Grade Security
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Your data is protected by strict Row-Level Security (RLS) policies ensuring complete absolute tenant isolation. Comply with FERPA and GDPR out of the box.
          </p>
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-70">
            {/* Fake trusted by logos (just text placeholders) */}
            <div className="text-xl font-bold font-serif italic">Cambridge</div>
            <div className="text-xl font-bold uppercase tracking-widest">MIT Press</div>
            <div className="text-xl font-bold font-serif">Stanford</div>
            <div className="text-xl font-bold uppercase">Yale Online</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 py-12 border-t border-slate-200 text-center text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <GraduationCap className="h-6 w-6 text-slate-400" />
            <span className="font-bold text-slate-900 tracking-tight">UniversityApp</span>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} UniversityApp Inc. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  )
}
