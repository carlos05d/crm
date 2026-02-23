-- ============================================================
-- HOTFIX: Convert get_my_role() to plpgsql
-- 
-- The previous version used 'LANGUAGE sql'. PostgreSQL's query 
-- planner aggressively inlines SQL functions, which strips/ignores 
-- the SECURITY DEFINER execution context when evaluated within
-- the WHERE/USING clauses of the same table's row-level security.
-- By using 'LANGUAGE plpgsql', we force it to evaluate opaquely
-- with full SECURITY DEFINER bypass permissions intact.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.user_role;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN _role;
END;
$$;
