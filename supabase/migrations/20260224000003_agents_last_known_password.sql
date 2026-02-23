-- Store the last manually-set plain-text password so admins can retrieve it
-- Run this in Supabase SQL Editor

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS last_known_password TEXT;

-- Restrict visibility: only university_admin and super_admin can read this column
-- Agents themselves cannot select it (they should not see their own stored password here)
COMMENT ON COLUMN public.agents.last_known_password IS 'Plain-text password stored by admin at creation or reset. Visible to university_admin only.';
