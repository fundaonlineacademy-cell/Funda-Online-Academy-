-- Funda Online Academy — Employer & Industry Partnerships finalisation
-- Final audit and correspondence workspace controls
-- 21 September 2026
--
-- This file records the live production database changes made during the
-- Employer & Industry Partnerships final audit. Front-end correspondence,
-- Realtime stability and reporting are implemented in the Admin scripts.

begin;

create table if not exists public.employer_correspondence_drafts(
  id uuid primary key default gen_random_uuid(),
  correspondence_kind text not null
    check (correspondence_kind in ('email','letter')),
  template_key text not null,
  correspondence_date date not null default current_date,
  employer_request_id uuid null
    references public.employer_partnership_requests(id) on delete set null,
  outreach_id uuid null
    references public.employer_outreach_targets(id) on delete set null,
  organisation_name text not null,
  contact_name text null,
  contact_job_title text null,
  recipient_email text null,
  subject text not null,
  body_text text not null,
  status text not null default 'draft'
    check (status in ('draft','final')),
  created_by uuid null
    references public.profiles(id) on delete set null,
  updated_by uuid null
    references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.employer_correspondence_drafts
  add column if not exists correspondence_date date
  not null default current_date;

create index if not exists employer_correspondence_kind_idx
  on public.employer_correspondence_drafts(
    correspondence_kind,
    updated_at desc
  );

create index if not exists employer_correspondence_request_idx
  on public.employer_correspondence_drafts(employer_request_id)
  where employer_request_id is not null;

create index if not exists employer_correspondence_outreach_idx
  on public.employer_correspondence_drafts(outreach_id)
  where outreach_id is not null;

alter table public.employer_correspondence_drafts
  enable row level security;

drop policy if exists "Admins manage employer correspondence drafts"
  on public.employer_correspondence_drafts;

create policy "Admins manage employer correspondence drafts"
on public.employer_correspondence_drafts
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select,insert,update,delete
  on public.employer_correspondence_drafts
  to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array[
    'employer_partnership_requests',
    'employer_opportunities',
    'learner_employer_preferences',
    'student_opportunity_interests',
    'learner_employer_readiness',
    'employer_outreach_targets',
    'employer_outreach_activities',
    'graduate_employment_referrals',
    'employer_correspondence_drafts'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname='supabase_realtime'
        and schemaname='public'
        and tablename=t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end $$;

commit;
