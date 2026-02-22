/**
 * apply-rls-fix.mjs
 * Applies the RLS infinite-recursion hotfix directly to the live database
 * via Supabase Management API (postgres query endpoint).
 */
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = "https://qjlkigbllodrxwrgsjki.supabase.co"
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
    console.error("❌  Missing SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
}

// Use service role client to bypass RLS entirely
const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
})

const steps = [
    {
        name: "Create get_my_role() SECURITY DEFINER function",
        sql: `
            CREATE OR REPLACE FUNCTION public.get_my_role()
            RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER
            SET search_path = public AS
            $fn$ SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1; $fn$;
        `,
    },
    {
        name: "Drop all existing profiles policies",
        sql: `
            DO $drop_block$
            DECLARE pol record;
            BEGIN
              FOR pol IN
                SELECT policyname FROM pg_policies
                WHERE tablename = 'profiles' AND schemaname = 'public'
              LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
              END LOOP;
            END $drop_block$;
        `,
    },
    {
        name: "Create profiles_own_select policy",
        sql: `CREATE POLICY profiles_own_select ON public.profiles FOR SELECT USING (auth.uid() = id);`,
    },
    {
        name: "Create profiles_own_insert policy",
        sql: `CREATE POLICY profiles_own_insert ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
    },
    {
        name: "Create profiles_own_update policy",
        sql: `CREATE POLICY profiles_own_update ON public.profiles FOR UPDATE USING (auth.uid() = id);`,
    },
    {
        name: "Create profiles_super_admin_all policy",
        sql: `CREATE POLICY profiles_super_admin_all ON public.profiles FOR ALL USING (public.get_my_role() = 'super_admin'::public.user_role);`,
    },
    {
        name: "Create profiles_ua_select_tenant policy",
        sql: `
            CREATE POLICY profiles_ua_select_tenant ON public.profiles FOR SELECT USING (
                university_id = (SELECT university_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
                AND public.get_my_role() = 'university_admin'::public.user_role
            );
        `,
    },
    {
        name: "Create profiles_agent_select_tenant policy",
        sql: `
            CREATE POLICY profiles_agent_select_tenant ON public.profiles FOR SELECT USING (
                university_id = (SELECT university_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
                AND public.get_my_role() = 'agent'::public.user_role
            );
        `,
    },
]

async function runSql(sql) {
    // Use Supabase's postgres endpoint via rpc — we call pg_catalog functions
    // Instead, we use the raw fetch to the SQL endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "apikey": SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
        },
    })
    // REST API doesn't expose raw SQL, use the pg meta endpoint
    const pgResponse = await fetch(`https://qjlkigbllodrxwrgsjki.supabase.co/pg/query`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sql }),
    })
    return pgResponse
}

// Alternative: use the supabase-js rpc with raw sql via postgres functions
// Best approach: use Supabase Management API
async function applyViaManagementAPI(sql) {
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
    return { status: response.status, text: await response.text() }
}

console.log("\n🔧  Applying RLS infinite-recursion hotfix…\n")

for (const step of steps) {
    process.stdout.write(`  → ${step.name}… `)
    const result = await applyViaManagementAPI(step.sql)
    if (result.status >= 200 && result.status < 300) {
        console.log("✅")
    } else {
        console.log(`❌  HTTP ${result.status}: ${result.text.slice(0, 200)}`)
    }
}

// Final verification: test as a real user
console.log("\n🔍  Verifying fix…")
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbGtpZ2JsbG9kcnh3cmdzamtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3MDIyMzMsImV4cCI6MjA4NzI3ODIzM30.QvIBKcyfa3_3jHOVzavFhX1zOerEmiP6QEDBiG1v_Po"
const anonClient = createClient(SUPABASE_URL, anonKey)
const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: "super@test.com",
    password: "Test1234!",
})
if (authError) {
    console.log("❌  Sign-in error:", authError.message)
} else {
    const { data, error } = await anonClient.from("profiles").select("role").eq("id", authData.user.id).single()
    if (error) {
        console.log("❌  Profile fetch error:", error.message)
    } else {
        console.log("✅  Profile fetched:", data)
    }
}
