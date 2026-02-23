const { createClient } = require("@supabase/supabase-js")
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkRLS() {
    const supabase = createClient(SUPABASE_URL, ANON_KEY)

    // Login as super admin
    const { error } = await supabase.auth.signInWithPassword({
        email: "super@test.com",
        password: "Test1234!"
    })

    if (error) {
        console.error("Login failed:", error.message)
        return
    }

    // Attempt to fetch profiles
    const { data: profiles, error: fetchError } = await supabase.from('profiles').select('*')
    console.log("Profiles visible to Super Admin:", profiles?.length || 0, fetchError || "")
    if (profiles) {
        console.log("Visible emails:", profiles.map(p => p.email).join(", "))
    }
}

checkRLS()
