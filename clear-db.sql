-- ============================================================
-- OPTION A: Delete ONE specific stuck user by email
-- Run this in Supabase SQL Editor
-- ============================================================

-- Replace the email below with the stuck user's email
DO $$
DECLARE
  target_email TEXT := 'top.games.offeceille@gmail.com';
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = target_email;

  IF target_id IS NULL THEN
    RAISE NOTICE 'User % not found', target_email;
    RETURN;
  END IF;

  -- Remove agent record
  DELETE FROM public.agents WHERE user_id = target_id;

  -- Remove profile
  DELETE FROM public.profiles WHERE id = target_id;

  -- Remove from auth (must be last)
  DELETE FROM auth.users WHERE id = target_id;

  RAISE NOTICE 'Deleted user % (%)', target_email, target_id;
END $$;


-- ============================================================
-- OPTION B: Full clean slate — wipe ALL test data
-- ⚠️  WARNING: This deletes everything except auth users
--     you explicitly keep. Edit the WHERE clause below.
-- ============================================================

-- Step 1: Clear business data
TRUNCATE public.leads            RESTART IDENTITY CASCADE;
TRUNCATE public.agents           RESTART IDENTITY CASCADE;
TRUNCATE public.kanban_stages    RESTART IDENTITY CASCADE;
TRUNCATE public.forms            RESTART IDENTITY CASCADE;
TRUNCATE public.programs         RESTART IDENTITY CASCADE;
TRUNCATE public.departments      RESTART IDENTITY CASCADE;
TRUNCATE public.messages         RESTART IDENTITY CASCADE;
TRUNCATE public.audit_logs       RESTART IDENTITY CASCADE;
TRUNCATE public.universities     RESTART IDENTITY CASCADE;

-- Step 2: Clear profiles EXCEPT your own super admin
-- Replace 'your-admin@email.com' with your actual SA email
DELETE FROM public.profiles
WHERE email != 'your-admin@email.com';

-- Step 3: Clear auth users EXCEPT your own super admin
-- (Only Supabase service role can do this, so run via SQL editor)
DELETE FROM auth.users
WHERE email != 'your-admin@email.com';
