-- 1. Create Universities Table (Tenants)
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  branding_json JSONB DEFAULT '{}'::jsonb,
  plan_type TEXT DEFAULT 'Normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Profiles Table (Users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('super_admin', 'university_admin', 'agent')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Departments Table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Programs Table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Kanban Stages Table
CREATE TABLE public.kanban_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Leads Table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES public.kanban_stages(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- Universities (Public read via subdomain, super_admin full access)
CREATE POLICY "Public profiles can view university by subdomain" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Super Admins can manage universities" ON public.universities TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin')
);

-- Profiles (Users can read own, Admins can read tenant profiles)
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can manage tenant profiles" ON public.profiles FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role = 'university_admin' 
    AND p.university_id = profiles.university_id
  )
);

-- Leads (Tenant Isolation)
CREATE POLICY "Agents can manage leads in their university" ON public.leads FOR ALL TO authenticated USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
);

-- Stages, Programs, Departments (Tenant Isolation)
CREATE POLICY "Tenant Profiles can view own tenant data" ON public.departments FOR SELECT TO authenticated USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant Profiles can view own tenant data" ON public.programs FOR SELECT TO authenticated USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Tenant Profiles can view own tenant data" ON public.kanban_stages FOR SELECT TO authenticated USING (
  university_id = (SELECT university_id FROM profiles WHERE id = auth.uid())
);
-- Admins can manage the tenant data config
CREATE POLICY "Admins manage config" ON public.kanban_stages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_admin' AND university_id = kanban_stages.university_id)
);
CREATE POLICY "Admins manage config" ON public.programs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_admin' AND university_id = programs.university_id)
);
CREATE POLICY "Admins manage config" ON public.departments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'university_admin' AND university_id = departments.university_id)
);

-- Set up Realtime for Kanban reactivity
alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.kanban_stages;
