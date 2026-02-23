-- ============================================================
-- LEAD SOURCES + AGENT LANDING PAGES — Schema Migration
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Source Type Enum ────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.lead_source_type AS ENUM (
    'agent_landing', 'website', 'csv_import',
    'instagram_ads', 'facebook_ads', 'manual', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. lead_sources Table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id   UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  type            public.lead_source_type NOT NULL DEFAULT 'manual',
  agent_id        UUID REFERENCES public.agents(user_id) ON DELETE SET NULL,
  file_name       TEXT,
  platform        TEXT,
  campaign        TEXT,
  adset           TEXT,
  ad              TEXT,
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  utm_content     TEXT,
  ref_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Extend agents table ─────────────────────────────────
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- ── 4. Extend leads table ──────────────────────────────────
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_source_id UUID REFERENCES public.lead_sources(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_type    TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS source_label   TEXT DEFAULT 'Manual';

-- ── 5. Enable RLS ──────────────────────────────────────────
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- ── 6. RLS Policies for lead_sources ──────────────────────
-- University admin: full read for their tenant
CREATE POLICY "University admin views own lead sources"
  ON public.lead_sources FOR SELECT TO authenticated
  USING (
    university_id = (
      SELECT university_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('university_admin', 'super_admin')
    )
  );

-- Agent: read only sources linked to their leads
CREATE POLICY "Agents view own lead sources"
  ON public.lead_sources FOR SELECT TO authenticated
  USING (
    agent_id = auth.uid()
  );

-- Public insert via server route (no direct client access — use API)
-- The public lead insert already has: "Public insert leads via forms"
-- We allow service role to insert lead_sources (done via supabaseAdmin in API routes)

-- ── 7. Performance Indexes ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_lead_sources_university_id ON public.lead_sources(university_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_agent_id      ON public.lead_sources(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_type          ON public.lead_sources(type);
CREATE INDEX IF NOT EXISTS idx_lead_sources_created_at    ON public.lead_sources(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source_id       ON public.leads(lead_source_id);
CREATE INDEX IF NOT EXISTS idx_leads_source_type          ON public.leads(source_type);
CREATE INDEX IF NOT EXISTS idx_agents_public_slug         ON public.agents(public_slug);
