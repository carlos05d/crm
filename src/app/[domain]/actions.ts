'use server'

import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

const leadSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please provide a valid email address"),
    phone: z.string().optional(),
    domain: z.string().min(1),
})

export async function submitLead(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const result = leadSchema.safeParse(Object.fromEntries(formData.entries()))

    if (!result.success) {
        return {
            message: result.error.issues[0].message,
            success: false,
        }
    }

    const { firstName, lastName, email, phone, domain } = result.data

    // 1. Resolve domain to university_id
    const { data: university, error: uniError } = await supabase
        .from('universities')
        .select('id')
        .eq('subdomain', domain)
        .single()

    if (uniError || !university) {
        return { message: "Invalid university domain.", success: false }
    }

    // 2. Fetch the ID of the first kanban stage for this university
    const { data: initialStage } = await supabase
        .from('kanban_stages')
        .select('id')
        .eq('university_id', university.id)
        .order('stage_order', { ascending: true })
        .limit(1)
        .single()

    // 3. Insert the Lead
    const { error: insertError } = await supabase
        .from('leads')
        .insert({
            university_id: university.id,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            stage_id: initialStage ? initialStage.id : null,
        })

    if (insertError) {
        return { message: "An error occurred while submitting your application. Please try again.", success: false }
    }

    return { message: "Application submitted successfully! Our admissions team will be in touch.", success: true }
}
