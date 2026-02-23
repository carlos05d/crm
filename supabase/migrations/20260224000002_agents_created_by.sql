-- Add created_by to the agents table
-- Run this in Supabase SQL Editor to enable audit tracking on who created each agent

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.agents.created_by IS 'The auth.users.id of the admin who provisioned this agent';
