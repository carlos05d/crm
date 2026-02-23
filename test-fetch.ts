import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFetch() {
    const { data, error } = await supabase
        .from("leads")
        .select("*, profiles(first_name, last_name, display_name), programs(name), kanban_stages(name)")
        .limit(1)

    if (error) {
        console.error("EXPECTED ERROR:", error.message, "| Hint:", error.hint, "| Details:", error.details)
    } else {
        console.log("SUCCESS:", data)
    }
}

testFetch()
