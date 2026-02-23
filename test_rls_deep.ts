import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const url = Deno.env.get("SUPABASE_URL")
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

if (!url || !key) {
    console.log("Missing env vars")
    Deno.exit(1)
}

const supabase = createClient(url, key)

async function test() {
    const { data: superAdmin } = await supabase.from('profiles').select('*').eq('email', 'super@test.com').single()
    console.log("Super Admin:", superAdmin)

    // Fetch policies directly
    const { data: policies, error } = await supabase.rpc('query_db', {
        query: "SELECT policyname, qual FROM pg_policies WHERE tablename = 'profiles'"
    })

    if (error) {
        console.log("RPC Error (likely doesn't exist):", error.message)
    } else {
        console.log("Policies:", policies)
    }
}

test()
