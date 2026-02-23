-- Add score column to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;

-- Ensure score is between 0 and 100
ALTER TABLE public.leads 
ADD CONSTRAINT check_score_range CHECK (score >= 0 AND score <= 100);
