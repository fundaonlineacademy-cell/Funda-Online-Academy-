-- Funda Online Academy — Influencer & Brand Ambassador Programme V2
-- Run in Supabase SQL editor before enabling the V2 application workflow.

create extension if not exists pgcrypto;

create table if not exists public.ambassador_programme_applications (
  id uuid primary key default gen_random_uuid(), full_name text not null, email text not null, phone text, date_of_birth date,
  province text, country text default 'South Africa', platforms jsonb not null default '[]'::jsonb, content_type text,
  audience_description text, audience_age_group text, audience_locations text, best_platform text, previous_promotions text,
  why_funda text, promotion_plan text, estimated_students_monthly integer, content_links jsonb not null default '[]'::jsonb,
  consent boolean not null default false,
  status text not null default 'pending' check (status in ('pending','under_review','approved','waitlisted','declined')),
  audience_relevance_score integer check (audience_relevance_score between 0 and 25), engagement_score integer check (engagement_score between 0 and 20),
  content_quality_score integer check (content_quality_score between 0 and 20), professionalism_score integer check (professionalism_score between 0 and 15),
  consistency_score integer check (consistency_score between 0 and 10), reach_score integer check (reach_score between 0 and 10),
  total_score integer generated always as (coalesce(audience_relevance_score,0)+coalesce(engagement_score,0)+coalesce(content_quality_score,0)+coalesce(professionalism_score,0)+coalesce(consistency_score,0)+coalesce(reach_score,0)) stored,
  profiles_verified boolean not null default false, admin_notes text,
  agreement_status text not null default 'not_sent' check (agreement_status in ('not_sent','sent','accepted','declined')), agreement_accepted_at timestamptz,
  account_status text not null default 'application' check (account_status in ('application','introductory','active','inactive','suspended','terminated')),
  referral_code text unique, introductory_started_at timestamptz, introductory_ends_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists ambassador_programme_applications_email_idx on public.ambassador_programme_applications (lower(email));
create index if not exists ambassador_programme_applications_status_idx on public.ambassador_programme_applications(status, created_at desc);

create table if not exists public.ambassador_earnings_ledger (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.ambassador_programme_applications(id) on delete cascade,
  enrolment_id uuid, payment_id uuid, qualifying_revenue numeric(12,2) not null default 0, commission_rate numeric(5,4) not null default 0.20,
  commission_amount numeric(12,2) not null default 0, earning_type text not null default 'commission' check (earning_type in ('commission','achievement_bonus','monthly_performance')),
  earning_status text not null default 'pending' check (earning_status in ('pending','approved','paid','reversed','held')),
  earning_month date not null default date_trunc('month', current_date)::date, notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists ambassador_earnings_application_idx on public.ambassador_earnings_ledger(application_id, earning_month desc);

alter table public.ambassador_programme_applications enable row level security;
alter table public.ambassador_earnings_ledger enable row level security;

drop policy if exists "public submit ambassador applications" on public.ambassador_programme_applications;
create policy "public submit ambassador applications" on public.ambassador_programme_applications for insert to anon, authenticated
with check (consent = true and status = 'pending' and agreement_status = 'not_sent' and account_status = 'application');

-- Authenticated ambassadors may read only their own application/account record.
drop policy if exists "ambassador read own account" on public.ambassador_programme_applications;
create policy "ambassador read own account" on public.ambassador_programme_applications for select to authenticated
using (lower(email) = lower(coalesce(auth.jwt()->>'email','')));

-- Ambassador electronic acceptance: update remains restricted to their own row. The portal only sends agreement fields.
-- For stricter production control, route this through a SECURITY DEFINER RPC after the first live test.
drop policy if exists "ambassador accept own agreement" on public.ambassador_programme_applications;
create policy "ambassador accept own agreement" on public.ambassador_programme_applications for update to authenticated
using (lower(email)=lower(coalesce(auth.jwt()->>'email','')) and status='approved')
with check (lower(email)=lower(coalesce(auth.jwt()->>'email','')) and status='approved' and agreement_status='accepted');

-- Ambassadors can view only earnings tied to their own application record.
drop policy if exists "ambassador read own earnings" on public.ambassador_earnings_ledger;
create policy "ambassador read own earnings" on public.ambassador_earnings_ledger for select to authenticated
using (exists (select 1 from public.ambassador_programme_applications a where a.id=application_id and lower(a.email)=lower(coalesce(auth.jwt()->>'email',''))));

comment on table public.ambassador_programme_applications is 'Funda Brand Ambassador Programme V2 applications and approval workflow.';
comment on table public.ambassador_earnings_ledger is 'Verified ambassador commission, rank bonus and monthly performance payment ledger.';
