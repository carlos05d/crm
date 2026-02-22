-- ============================================================
-- Migration: Profile auto-creation trigger
-- ============================================================
-- Fires after every INSERT on auth.users and inserts a minimal
-- profile row with role='agent' (ON CONFLICT DO NOTHING so that
-- manually pre-created rows for super_admin are untouched).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'agent')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop first to allow idempotent re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
