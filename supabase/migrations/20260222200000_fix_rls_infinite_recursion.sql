-- ============================================================
-- HOTFIX: Remove infinite-recursion RLS policies on profiles
-- Root cause: policies subqueried the `profiles` table from
-- within a policy ON profiles, causing infinite recursion.
-- Fix: use a SECURITY DEFINER function to safely get the
-- calling user's role without recursion.
-- ============================================================

-- Step 1: Create a safe, non-recursive role-getter function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Step 2: Drop ALL existing profiles policies (clean slate)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- Step 3: Recreate profiles policies — none of them query `profiles` directly
-- Users read and update their own row
CREATE POLICY "profiles_own_select"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_own_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Super Admin can read/write ALL profiles
CREATE POLICY "profiles_super_admin_all"
  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'super_admin'::public.user_role);

-- University Admin manages profiles in their own tenant
CREATE POLICY "profiles_ua_select_tenant"
  ON public.profiles FOR SELECT
  USING (
    university_id = (
      SELECT university_id FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    AND public.get_my_role() = 'university_admin'::public.user_role
  );

-- Agents can see other profiles in their tenant
CREATE POLICY "profiles_agent_select_tenant"
  ON public.profiles FOR SELECT
  USING (
    university_id = (
      SELECT university_id FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    )
    AND public.get_my_role() = 'agent'::public.user_role
  );
