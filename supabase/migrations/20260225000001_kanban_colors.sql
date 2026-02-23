-- Add color column to kanban_stages table
ALTER TABLE public.kanban_stages 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'bg-slate-100 text-slate-700';

-- Update existing default stages with their current hardcoded UI colors
UPDATE public.kanban_stages SET color = 'bg-blue-100 text-blue-700' WHERE name = 'New';
UPDATE public.kanban_stages SET color = 'bg-amber-100 text-amber-700' WHERE name = 'Contacted';
UPDATE public.kanban_stages SET color = 'bg-emerald-100 text-emerald-700' WHERE name = 'Qualified';
UPDATE public.kanban_stages SET color = 'bg-purple-100 text-purple-700' WHERE name = 'Admitted';
UPDATE public.kanban_stages SET color = 'bg-red-100 text-red-700' WHERE name = 'Rejected';
