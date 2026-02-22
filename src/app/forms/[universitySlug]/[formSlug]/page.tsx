import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Building2, Save, Send } from 'lucide-react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PublicFormPage({ params }: { params: { universitySlug: string, formSlug: string } }) {

    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    // Static read-only for SSR forms
                },
            },
        }
    )

    // 1. Fetch University ID via subdomain / slug
    const { data: university } = await supabase
        .from('universities')
        .select('id, name, branding_json')
        .eq('subdomain', params.universitySlug)
        .single()

    if (!university) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl text-slate-500 font-medium">404 - University Not Found</p></div>
    )

    // 2. Fetch the matched Form definition
    const { data: form } = await supabase
        .from('forms')
        .select('*')
        .eq('university_id', university.id)
        .eq('slug', params.formSlug)
        .eq('active', true)
        .single()

    if (!form) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-xl text-slate-500 font-medium">404 - Form is inactive or not found</p></div>
    )

    // Extract basic branding from the JSON if available
    const primaryColor = university.branding_json?.colors?.primary || "#1E3A5F"

    async function submitLead(formData: FormData) {
        'use server'

        const firstName = formData.get('first_name') as string
        const lastName = formData.get('last_name') as string
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string

        const cookieStore = cookies()
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: { getAll() { return cookieStore.getAll() }, setAll() { } },
            }
        )

        const { error } = await supabaseAdmin.from('leads').insert({
            university_id: university?.id,
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            source: `Form: ${form?.title}`
        })

        if (!error) {
            redirect(`/forms/${params.universitySlug}/${params.formSlug}?success=true`)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <Card className="w-full max-w-lg border-t-8 shadow-xl" style={{ borderTopColor: primaryColor }}>
                <CardHeader className="text-center pb-8 pt-10">
                    <div className="mx-auto bg-slate-100 h-16 w-16 rounded-2xl flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
                    </div>
                    <CardTitle className="text-3xl font-heading font-bold text-slate-900">{university.name}</CardTitle>
                    <CardDescription className="text-base mt-2 whitespace-pre-wrap">{form.title}</CardDescription>
                </CardHeader>

                <CardContent>
                    <form action={submitLead} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input id="first_name" name="first_name" required placeholder="Jane" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" name="last_name" required placeholder="Doe" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" required placeholder="jane@example.com" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="+1 (555) 000-0000" />
                        </div>

                        <Button type="submit" className="w-full text-white font-medium py-6 mt-4" style={{ backgroundColor: primaryColor }}>
                            <Send className="mr-2 h-4 w-4" /> Submit Application
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center pt-2 pb-8">
                    <p className="text-xs text-slate-400">Powered by CRM Platform Infrastructure.</p>
                </CardFooter>
            </Card>
        </div>
    )
}
