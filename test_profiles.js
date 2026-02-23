const { createClient } = require("@supabase/supabase-js")
require('dotenv').config({ path: '.env.local' })

async function run() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    await supabase.auth.signInWithPassword({
        email: "super@test.com", password: "Test1234!"
    })

    // Try to select other users from auth.users via an edge function or just query profiles
    const { data } = await supabase.from('profiles').select('id, email')
    console.log("Profiles normal select:", data)

    // Using service role to test inline function execution
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const { data: adminProfiles } = await adminClient.from('profiles').select('id, email')
    console.log("Service role total profiles:", adminProfiles.length)
}

run()
