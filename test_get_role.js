const { createClient } = require("@supabase/supabase-js")
require('dotenv').config({ path: '.env.local' })

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function runSQL() {
    // 1. Get the super admin's UID
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY)
    const { data: userRow } = await supabase.from('profiles').select('id, email, role').eq('email', 'super@test.com').single()
    console.log("Super admin user:", userRow)

    const sql = `
        -- Simulate being the super admin
        SET session.role_local TO authenticated;
        SET request.jwt.claim.sub TO '${userRow.id}';
        
        -- Test what get_my_role returns
        SELECT public.get_my_role();
    `
    const projectRef = "qjlkigbllodrxwrgsjki"
    const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: sql }),
        }
    )
    const text = await response.text()
    console.log("SQL Result:", text)
}

runSQL()
