-- 1. Insert 'Harvard University' into the universities table so the public form has a valid tenant to map to.
INSERT INTO public.universities (id, name, subdomain, plan_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Harvard University', 'harvard', 'Enterprise')
ON CONFLICT (subdomain) DO NOTHING;

-- 2. Insert the Kanban Pipeline stages for Harvard
INSERT INTO public.kanban_stages (university_id, name, stage_order)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'New Lead', 0),
  ('00000000-0000-0000-0000-000000000001', 'Contacted', 1),
  ('00000000-0000-0000-0000-000000000001', 'Application Started', 2),
  ('00000000-0000-0000-0000-000000000001', 'Enrolled', 3)
ON CONFLICT DO NOTHING;

-- 3. Fix Profiles RLS: Allow authenticated users to insert their initial profile upon Signup
CREATE POLICY "Allow authenticated profile creation" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Fix Leads RLS: Allow public (anonymous) visitors to submit leads via the Tenant Public Form
CREATE POLICY "Allow anonymous lead submission" 
ON public.leads FOR INSERT 
WITH CHECK (true);
