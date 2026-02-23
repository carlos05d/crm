const { createClient } = require("@supabase/supabase-js")
require('dotenv').config({ path: '.env.local' })

async function checkRLS() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    // Login as super admin
    const { error } = await supabase.auth.signInWithPassword({
        email: "super@test.com",
        password: "Test1234!"
    })

    if (error) {
        console.error("Login failed:", error.message)
        return
    }

    // Call get_my_role via RPC
    const { data: role, error: rpcError } = await supabase.rpc('get_my_role')
    console.log("RPC get_my_role result:", role, rpcError ? rpcError.message : "")
}

checkRLS()
