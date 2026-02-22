/**
 * seed-test-accounts.mjs
 *
 * Creates 3 test accounts for all 3 portals:
 *   super@test.com   → Super Admin      → /sa/dashboard
 *   admin@test.com   → University Admin → /u/dashboard
 *   agent@test.com   → Agent            → /agent/dashboard
 *
 * Usage (PowerShell):
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "eyJ..."
 *   node seed-test-accounts.mjs
 */

import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://qjlkigbllodrxwrgsjki.supabase.co"
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
    console.error("❌  Missing SUPABASE_SERVICE_ROLE_KEY environment variable.")
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
})

const TEST_PASSWORD = "Test1234!"

// ─── helpers ─────────────────────────────────────────────────────────────────

async function createUser(email, password) {
    // Check if the user already exists first (avoids relying on error message strings)
    const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existing = list?.users?.find(u => u.email === email)
    if (existing) {
        console.log(`     ℹ️   ${email} already exists — reusing`)
        return existing.id
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    })
    if (error) throw new Error(`createUser(${email}): ${error.message}`)
    return data.user.id
}

async function upsertProfile(id, email, role, universityId = null) {
    const { error } = await supabase.from("profiles").upsert(
        { id, email, role, university_id: universityId },
        { onConflict: "id" }
    )
    if (error) throw new Error(`Profile upsert for ${email}: ${error.message}`)
}

async function upsertUniversity(name, subdomain) {
    const { data: existing } = await supabase
        .from("universities")
        .select("id")
        .eq("subdomain", subdomain)
        .maybeSingle()

    if (existing) {
        console.log(`     ℹ️   University '${subdomain}' already exists — reusing`)
        return existing.id
    }

    const { data, error } = await supabase
        .from("universities")
        .insert({ name, subdomain, plan_type: "Pro" })
        .select("id")
        .single()

    if (error) throw new Error(`University insert: ${error.message}`)
    return data.id
}

async function upsertKanbanStages(universityId) {
    const stages = ["New", "Contacted", "Qualified", "Admitted", "Rejected"]

    // Delete old stages if any (so re-runs are clean)
    await supabase.from("kanban_stages").delete().eq("university_id", universityId)

    for (let i = 0; i < stages.length; i++) {
        const { error } = await supabase
            .from("kanban_stages")
            .insert({ university_id: universityId, name: stages[i], position: i })
        if (error) throw new Error(`Kanban stage '${stages[i]}': ${error.message}`)
    }
}

async function upsertSettings(universityId) {
    const { error } = await supabase.from("settings").upsert(
        { university_id: universityId, agent_scope: "all_leads" },
        { onConflict: "university_id" }
    )
    if (error) throw new Error(`Settings upsert: ${error.message}`)
}

async function upsertAgent(userId, universityId, displayName) {
    // Delete existing first (no unique constraint on user_id in the agents table)
    await supabase.from("agents").delete().eq("user_id", userId)
    const { error } = await supabase
        .from("agents")
        .insert({ user_id: userId, university_id: universityId, display_name: displayName, active: true })
    if (error) throw new Error(`Agent insert: ${error.message}`)
}

async function insertSampleLeads(universityId, agentUserId) {
    // Delete any old sample leads first
    await supabase.from("leads").delete().eq("university_id", universityId)

    // Get stage IDs
    const { data: stages } = await supabase
        .from("kanban_stages")
        .select("id, name")
        .eq("university_id", universityId)

    const stageMap = Object.fromEntries((stages || []).map(s => [s.name, s.id]))

    const leads = [
        { first_name: "Emma", last_name: "Thompson", email: "emma@example.com", phone: "+1 555 001 0001", stage_id: stageMap["New"], source: "form" },
        { first_name: "James", last_name: "Wilson", email: "james@example.com", phone: "+1 555 001 0002", stage_id: stageMap["Contacted"], source: "form", assigned_agent_id: agentUserId },
        { first_name: "Sarah", last_name: "Chen", email: "sarah@example.com", phone: "+1 555 001 0003", stage_id: stageMap["Qualified"], source: "manual", assigned_agent_id: agentUserId },
        { first_name: "Michael", last_name: "Rodriguez", email: "michael@example.com", phone: "+1 555 001 0004", stage_id: stageMap["Admitted"], source: "manual" },
        { first_name: "Lisa", last_name: "Patel", email: "lisa@example.com", stage_id: stageMap["New"], source: "import" },
    ]

    for (const lead of leads) {
        const { error } = await supabase.from("leads").insert({ university_id: universityId, ...lead })
        if (error) throw new Error(`Lead insert: ${error.message}`)
    }
}

async function insertSampleForm(universityId) {
    await supabase.from("forms").delete().eq("university_id", universityId)

    const { error } = await supabase.from("forms").insert({
        university_id: universityId,
        slug: "apply-now",
        title: "Apply to Demo University",
        fields: [
            { name: "first_name", type: "text", label: "First Name", required: true },
            { name: "last_name", type: "text", label: "Last Name", required: true },
            { name: "email", type: "email", label: "Email Address", required: true },
            { name: "phone", type: "tel", label: "Phone Number", required: false },
        ],
        active: true,
    })
    if (error) throw new Error(`Form insert: ${error.message}`)
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function seed() {
    console.log("\n🚀  Seeding test accounts…\n")

    // 1. Super Admin
    console.log("1/6  Creating super@test.com (Super Admin)…")
    const saId = await createUser("super@test.com", TEST_PASSWORD)
    await upsertProfile(saId, "super@test.com", "super_admin", null)
    console.log("     ✅  Done\n")

    // 2. Demo university
    console.log("2/6  Creating Demo University…")
    const uniId = await upsertUniversity("Demo University", "demo-university")
    await upsertSettings(uniId)
    console.log(`     ✅  ID: ${uniId}\n`)

    // 3. Kanban stages
    console.log("3/6  Seeding Kanban stages…")
    await upsertKanbanStages(uniId)
    console.log("     ✅  5 stages created (New → Contacted → Qualified → Admitted → Rejected)\n")

    // 4. University Admin
    console.log("4/6  Creating admin@test.com (University Admin)…")
    const uaId = await createUser("admin@test.com", TEST_PASSWORD)
    await upsertProfile(uaId, "admin@test.com", "university_admin", uniId)
    console.log("     ✅  Done\n")

    // 5. Agent
    console.log("5/6  Creating agent@test.com (Agent)…")
    const agentId = await createUser("agent@test.com", TEST_PASSWORD)
    await upsertProfile(agentId, "agent@test.com", "agent", uniId)
    await upsertAgent(agentId, uniId, "Test Agent")
    console.log("     ✅  Done\n")

    // 6. Sample data
    console.log("6/6  Inserting sample leads + intake form…")
    await insertSampleLeads(uniId, agentId)
    await insertSampleForm(uniId)
    console.log("     ✅  5 leads + 1 form created\n")

    console.log("═══════════════════════════════════════════════════════")
    console.log("  ✅  ALL TEST ACCOUNTS READY")
    console.log("═══════════════════════════════════════════════════════")
    console.log("  Portal           Email              Password")
    console.log("  ─────────────────────────────────────────────────── ")
    console.log("  Super Admin      super@test.com     Test1234!")
    console.log("  University Admin admin@test.com     Test1234!")
    console.log("  Agent            agent@test.com     Test1234!")
    console.log("═══════════════════════════════════════════════════════")
    console.log()
    console.log("  🌍  Public form URL:")
    console.log("  http://localhost:3000/forms/demo-university/apply-now")
    console.log()
    console.log("  ➜  Visit http://localhost:3000/login to test login")
    console.log()
}

seed().catch(err => {
    console.error("❌  Seed failed:", err.message)
    process.exit(1)
})
