const { createClient } = require("@supabase/supabase-js")
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkPolicies() {
    const sql = `
        SELECT policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public';
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
    console.log("Policies:", text)
}

checkPolicies()
