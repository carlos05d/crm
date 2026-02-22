import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function seed() {
    console.log('Seeding Harvard University into the Cloud DB...')

    // 1. Create or fetching Harvard
    const { data: uni, error: uniError } = await supabase
        .from('universities')
        .upsert(
            { name: 'Harvard University', subdomain: 'harvard', plan_type: 'Enterprise' },
            { onConflict: 'subdomain' }
        )
        .select()
        .single()

    if (uniError) {
        console.error('Error creating university:', uniError)
        return
    }

    console.log(`✅ University created with ID: ${uni.id}`)

    // 2. Check if stages already exist to prevent dupes
    const { data: existingStages } = await supabase
        .from('kanban_stages')
        .select('*')
        .eq('university_id', uni.id)

    if (existingStages && existingStages.length > 0) {
        console.log('✅ Kanban stages already exist for Harvard. Exiting.')
        return
    }

    // 3. Create default Kanban Stages for the agent dashboard
    console.log('Seeding Kanban Pipeline stages...')
    const stages = ['New Lead', 'Contacted', 'Application Started', 'Enrolled']

    for (let i = 0; i < stages.length; i++) {
        const { error: stageError } = await supabase.from('kanban_stages').insert({
            university_id: uni.id,
            name: stages[i],
            stage_order: i
        })

        if (stageError) {
            console.error(`Failed to insert stage ${stages[i]}:`, stageError)
        }
    }

    console.log('🎉 Seed complete! You can now test the form at /harvard')
}

seed()
