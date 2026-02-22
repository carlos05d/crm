-- ============================================================
-- V2 MEGA SCHEMA MIGRATION
-- Fix: Drop all existing role-dependent policies FIRST,
-- then alter the column type, then recreate all policies.
-- ============================================================

-- ============================================================
-- STEP 0: Drop ALL existing policies that reference profiles.role
-- (Postgres cannot alter a column type referenced by any policy)
-- ============================================================
DROP POLICY IF EXISTS "Super Admins can manage universities" ON public.universities;
DROP POLICY IF EXISTS "Public profiles can view university by subdomain" ON public.universities;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated profile creation" ON public.profiles;
DROP POLICY IF EXISTS "Agents can manage leads in their university" ON public.leads;
DROP POLICY IF EXISTS "Allow anonymous lead submission" ON public.leads;
DROP POLICY IF EXISTS "Tenant Profiles can view own tenant data" ON public.departments;
DROP POLICY IF EXISTS "Tenant Profiles can view own tenant data" ON public.programs;
DROP POLICY IF EXISTS "Tenant Profiles can view own tenant data" ON public.kanban_stages;
DROP POLICY IF EXISTS "Admins manage config" ON public.kanban_stages;
DROP POLICY IF EXISTS "Admins manage config" ON public.programs;
DROP POLICY IF EXISTS "Admins manage config" ON public.departments;

-- ============================================================
-- STEP 1: Create Role Enum and Upgrade profiles.role column
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('super_admin', 'university_admin', 'agent', 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

-- Add status column if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ============================================================
-- STEP 2: Create new tables (IF NOT EXISTS for idempotency)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  fields JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  university_id UUID PRIMARY KEY REFERENCES public.universities(id) ON DELETE CASCADE,
  branding JSONB DEFAULT '{"colors": {"primary": "#1E3A5F", "accent": "#F26522"}}'::jsonb,
  communication JSONB DEFAULT '{}'::jsonb,
  agent_scope TEXT DEFAULT 'assigned_only' CHECK (agent_scope IN ('assigned_only', 'all_leads')),
  allow_agent_custom_sender_email BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  to_value TEXT NOT NULL,
  from_value TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 3: Alter existing tables (safely, using DO blocks)
-- ============================================================

-- Rename kanban_stages column only if it still has the old name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kanban_stages' AND column_name = 'stage_order'
  ) THEN
    ALTER TABLE public.kanban_stages RENAME COLUMN stage_order TO position;
  END IF;
END $$;

-- Rename leads column only if it still has the old name
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.leads RENAME COLUMN assigned_to TO assigned_agent_id;
  END IF;
END $$;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add status to universities if missing
ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- ============================================================
-- STEP 4: Enable RLS on all new tables
-- ============================================================
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_agents_university_id ON public.agents(university_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_university_id ON public.forms(university_id);
CREATE INDEX IF NOT EXISTS idx_settings_university_id ON public.settings(university_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_university_id ON public.subscriptions(university_id);
CREATE INDEX IF NOT EXISTS idx_messages_university_id ON public.messages(university_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_university_id ON public.audit_logs(university_id);

-- ============================================================
-- STEP 6: Recreate ALL RLS Policies (clean slate)
-- ============================================================

-- Universities
CREATE POLICY "Public can view universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Super Admins manage universities" ON public.universities FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);

-- Profiles: own row access
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow authenticated profile creation" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Profiles: Super Admin global view
CREATE POLICY "Super admin global profiles view" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);

-- Profiles: University Admin manages their tenant
CREATE POLICY "University Admin manages tenant profiles" ON public.profiles FOR ALL USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);

-- Profiles: Agent view
CREATE POLICY "Agents view tenant profiles" ON public.profiles FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'agent'::public.user_role)
);

-- Departments
CREATE POLICY "Tenant users view departments" ON public.departments FOR SELECT TO authenticated USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "University Admins manage departments" ON public.departments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role AND university_id = departments.university_id)
);

-- Programs
CREATE POLICY "Tenant users view programs" ON public.programs FOR SELECT TO authenticated USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "University Admins manage programs" ON public.programs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role AND university_id = programs.university_id)
);

-- Kanban Stages
CREATE POLICY "Tenant users view kanban stages" ON public.kanban_stages FOR SELECT TO authenticated USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "University Admins manage kanban stages" ON public.kanban_stages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role AND university_id = kanban_stages.university_id)
);

-- Leads
CREATE POLICY "Public insert leads via forms" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Super admin view all leads" ON public.leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);
CREATE POLICY "University Admins full leads access" ON public.leads FOR ALL USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);
CREATE POLICY "Agents scope-guarded leads access" ON public.leads FOR ALL USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'agent'::public.user_role)
  AND (
    (SELECT agent_scope FROM settings WHERE settings.university_id = leads.university_id) = 'all_leads'
    OR assigned_agent_id = auth.uid()
  )
);

-- Agents table
CREATE POLICY "Super admin global agents view" ON public.agents FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);
CREATE POLICY "University Admins manage agents" ON public.agents FOR ALL USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);
CREATE POLICY "Agents view tenant agents" ON public.agents FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'agent'::public.user_role)
);

-- Settings
CREATE POLICY "Super admin view all settings" ON public.settings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);
CREATE POLICY "University Admins manage settings" ON public.settings FOR ALL USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);
CREATE POLICY "Agents view their university settings" ON public.settings FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'agent'::public.user_role)
);

-- Forms
CREATE POLICY "Tenant users view forms" ON public.forms FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);
CREATE POLICY "University Admins manage forms" ON public.forms FOR ALL USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);

-- Subscriptions
CREATE POLICY "Super admin view all subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);
CREATE POLICY "University Admins view subscriptions" ON public.subscriptions FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);

-- Messages
CREATE POLICY "Super admin view all messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);
CREATE POLICY "University Admins view tenant messages" ON public.messages FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);
CREATE POLICY "Agents insert messages for assigned leads" ON public.messages FOR INSERT WITH CHECK (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'agent'::public.user_role)
);
CREATE POLICY "Agents view messages in scope" ON public.messages FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'agent'::public.user_role)
  AND EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = messages.lead_id
    AND (
      (SELECT agent_scope FROM settings WHERE settings.university_id = leads.university_id) = 'all_leads'
      OR leads.assigned_agent_id = auth.uid()
    )
  )
);

-- Audit Logs
CREATE POLICY "Super admin view all audit logs" ON public.audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'::public.user_role)
);
CREATE POLICY "University Admins view tenant audit logs" ON public.audit_logs FOR SELECT USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid() AND role = 'university_admin'::public.user_role)
);
CREATE POLICY "Agents view own audit logs" ON public.audit_logs FOR SELECT USING (
  actor_id = auth.uid()
);

-- ============================================================
-- STEP 7: Supabase Realtime subscriptions
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.agents;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
