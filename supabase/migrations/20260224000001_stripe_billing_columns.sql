-- Add Stripe customer/subscription tracking columns to universities
-- Run this after 20260224000000_auth_profile_trigger.sql

ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;

-- Index for fast Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_universities_stripe_customer 
  ON public.universities (stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_universities_stripe_subscription 
  ON public.universities (stripe_subscription_id);
