import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testMigration() {
    const { data, error } = await supabase.from('lead_sources').select('id').limit(1)
    if (error) {
        console.error("MIGRATION_CHECK_ERROR:", error.message)
    } else {
        console.log("MIGRATION_CHECK_SUCCESS: Table exists")
    }
}

testMigration()
