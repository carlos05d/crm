import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    const payload = {
        university_id: "00000000-0000-0000-0000-000000000000",
        first_name: "Test",
        last_name: "Test",
        email: "test@test.com",
        phone: null,
        source_type: "manual",
        source_label: "Manual entry",
        assigned_agent_id: null,
        program_id: null,
    }

    const { data, error } = await supabase.from('leads').insert(payload)
    if (error) {
        console.error("EXPECTED ERROR:", error.message)
    } else {
        console.log("SUCCESS:", data)
    }
}

testInsert()
