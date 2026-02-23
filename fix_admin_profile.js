const { createClient } = require("@supabase/supabase-js")

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing env vars")
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function checkUser(email) {
    console.log(`Checking user: ${email}`)

    // 1. Check profiles
    const { data: profile } = await supabase.from('profiles').select('*').eq('email', email)
    console.log("Profile:", profile)

    // 2. We can try to manually upsert it.
    if (profile && profile.length > 0) {
        // Let's check what university "college de paris" has as an ID
        const { data: unis } = await supabase.from('universities').select('*').ilike('name', '%college%')
        console.log("Matching universities:", unis)

        let uniId = null
        if (unis && unis.length > 0) uniId = unis[0].id

        console.log("Updating role to university_admin...")
        const { data: updateData, error: updateError } = await supabase.from('profiles').update({
            role: 'university_admin',
            university_id: uniId || profile[0].university_id
        }).eq('id', profile[0].id).select()

        console.log("Update result:", updateData, updateError)
    }
}

checkUser("info@collegedeparis.com")
