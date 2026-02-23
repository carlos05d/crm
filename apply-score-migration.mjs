import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
    console.log('Applying add_lead_score migration...')

    const sql = fs.readFileSync(
        path.join(__dirname, 'supabase', 'migrations', '20260223000000_add_lead_score.sql'),
        'utf-8'
    )

    // Split by statements roughly and execute them
    const statements = sql
        .replace(/--.*/g, '') // remove comments
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

    for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)

        // Using rpc trick if direct execution isn't available, but standard is to use the dashboard SQL editor.
        // Since we don't have a direct SQL execute endpoint exposed securely below pg14 without extensions, 
        // I will recommend pasting it into Supabase SQL editor OR we can just try appending to our mega migration
        // Actually, wait, the REST API doesn't support raw DDL natively without an RPC function like 'exec_sql'.
        console.error("Warning: raw DDL via supabase-js is not officially supported without RPC `exec_sql()`. Please run this via Supabase SQL Editor manually or via a pre-configured RPC.")
    }
}

applyMigration()
