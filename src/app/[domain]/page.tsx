'use client'

import { useActionState, use } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react"
import { submitLead } from "./actions"

export default function UniversityPage({
    params,
}: {
    params: Promise<{ domain: string }>
}) {
    // We pass the domain name via a hidden input so the server action knows which university to map this lead to.
    const { domain } = use(params)

    const [state, formAction, pending] = useActionState(submitLead, null)

    return (
        <div className="space-y-12 pb-12">
            {/* Hero Section */}
            <section className="text-center py-24 bg-[#1E3A8A] text-white rounded-[2.5rem] shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

                <div className="relative z-10 px-6">
                    <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-6">
                        <GraduationCap className="h-8 w-8 text-blue-200" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                        Welcome to {domain.charAt(0).toUpperCase() + domain.slice(1)}
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-medium">
                        Shape your future with world-class academic programs and an inspiring community.
                    </p>
                </div>
            </section>

            {/* Application Section */}
            <section className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 items-start">

                {/* Information Column */}
                <div className="md:col-span-2 space-y-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Request Information</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Take the first step toward your academic journey. Fill out the form, and our admissions team will contact you with personalized program details.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1E3A8A]">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Personalized Guidance</h3>
                                <p className="text-sm text-slate-500 mt-1">Get 1-on-1 support from an admissions counselor tailored to your goals.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 mt-1">
                                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1E3A8A]">
                                    <Building2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">Campus Tours</h3>
                                <p className="text-sm text-slate-500 mt-1">Schedule a virtual or in-person walk through of our cutting-edge facilities.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Column */}
                <div className="md:col-span-3">
                    <Card className="border-[#E5E7EB] shadow-lg rounded-2xl overflow-hidden">
                        <div className="h-2 bg-[#1E3A8A] w-full" />
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl">Student Inquiry Form</CardTitle>
                            <CardDescription className="text-sm">We typically respond within 1 business day.</CardDescription>

                            {/* Server Action Messages */}
                            {state && !state.success && (
                                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm font-medium rounded-lg border border-red-100">
                                    {state.message}
                                </div>
                            )}
                            {state && state.success && (
                                <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 text-sm font-medium rounded-lg border border-emerald-200 flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                    <p>{state.message}</p>
                                </div>
                            )}
                        </CardHeader>

                        {!state?.success && (
                            <CardContent>
                                <form action={formAction} className="space-y-5">

                                    {/* Expose Subdomain to Server Action */}
                                    <input type="hidden" name="domain" value={domain} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name <span className="text-red-500">*</span></Label>
                                            <Input id="firstName" name="firstName" placeholder="Jane" className="h-11 border-slate-200 focus-visible:ring-blue-500" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name <span className="text-red-500">*</span></Label>
                                            <Input id="lastName" name="lastName" placeholder="Smith" className="h-11 border-slate-200 focus-visible:ring-blue-500" required />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></Label>
                                        <Input id="email" name="email" type="email" placeholder="jane@example.com" className="h-11 border-slate-200 focus-visible:ring-blue-500" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</Label>
                                        <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" className="h-11 border-slate-200 focus-visible:ring-blue-500" />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={pending}
                                        className="w-full h-12 bg-[#1E3A8A] hover:bg-[#14532D] text-white font-semibold text-base mt-2 transition-all shadow-md group"
                                    >
                                        {pending ? "Submitting..." : (
                                            <>
                                                Submit Inquiry
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed">
                                        By submitting this form, you agree to our privacy policy and consent to being contacted by our admissions department.
                                    </p>
                                </form>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </section>
        </div>
    )
}
