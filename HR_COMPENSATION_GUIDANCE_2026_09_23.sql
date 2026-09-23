-- Funda Online Academy — Workforce Compensation Guidance
-- 2026-09-23
-- Guidance only: does not approve salaries, create payroll, or alter workforce plans.

create table if not exists public.hr_compensation_floor (
  singleton boolean primary key default true check (singleton),
  effective_date date not null,
  hourly_rate numeric(12,2) not null check (hourly_rate >= 0),
  monthly_equivalent_40h numeric(14,2) not null check (monthly_equivalent_40h >= 0),
  source_label text not null,
  source_note text,
  updated_at timestamptz not null default now()
);

alter table public.hr_compensation_floor enable row level security;

drop policy if exists hr_compensation_floor_read on public.hr_compensation_floor;
create policy hr_compensation_floor_read
on public.hr_compensation_floor for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

revoke all on public.hr_compensation_floor from PUBLIC,anon,authenticated;
grant select on public.hr_compensation_floor to authenticated;
grant all on public.hr_compensation_floor to service_role;

insert into public.hr_compensation_floor(
  singleton,effective_date,hourly_rate,monthly_equivalent_40h,source_label,source_note,updated_at
)
values(
  true,date '2026-03-01',30.23,5239.46,
  'South Africa National Minimum Wage 2026 — Department of Employment and Labour / Government Gazette',
  'Ordinary workers: R30.23 per hour from 1 March 2026. A 40-hour week is approximately R5,239.46 per month. Formal Skills Development Act learnerships use their prescribed allowance schedule.',
  now()
)
on conflict(singleton) do update set
  effective_date=excluded.effective_date,
  hourly_rate=excluded.hourly_rate,
  monthly_equivalent_40h=excluded.monthly_equivalent_40h,
  source_label=excluded.source_label,
  source_note=excluded.source_note,
  updated_at=now();

create table if not exists public.hr_compensation_guidance (
  id uuid primary key default gen_random_uuid(),
  department text not null unique,
  suggested_role text not null,
  profile_level text not null default 'Junior / graduate',
  guidance_type text not null default 'monthly_band'
    check (guidance_type in ('monthly_band','revenue_percentage')),
  monthly_min numeric(14,2) not null default 0 check (monthly_min >= 0),
  monthly_max numeric(14,2) not null default 0 check (monthly_max >= monthly_min),
  revenue_pct_min numeric(8,2) not null default 0 check (revenue_pct_min >= 0),
  revenue_pct_max numeric(8,2) not null default 0 check (revenue_pct_max >= revenue_pct_min),
  source_label text not null,
  source_as_of date not null,
  source_note text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.hr_compensation_guidance enable row level security;

drop policy if exists hr_compensation_guidance_read on public.hr_compensation_guidance;
create policy hr_compensation_guidance_read
on public.hr_compensation_guidance for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

revoke all on public.hr_compensation_guidance from PUBLIC,anon,authenticated;
grant select on public.hr_compensation_guidance to authenticated;
grant all on public.hr_compensation_guidance to service_role;

insert into public.hr_compensation_guidance(
  department,suggested_role,profile_level,guidance_type,
  monthly_min,monthly_max,revenue_pct_min,revenue_pct_max,
  source_label,source_as_of,source_note,active
)
values
(
  'Human Resources','HR Assistant / HR Administrator','Graduate / junior','monthly_band',
  6200,8083,0,0,
  'PNet Job Market Trends — June 2026',date '2026-06-01',
  'PNet entry-level HR Assistant / HR Intern / HR Administrator salary offers. More experienced HR Administrator roles are materially higher.',true
),
(
  'Finance & Accounting','Junior Bookkeeper / Accounts Assistant','Graduate / junior','monthly_band',
  9375,18357,0,0,
  'PNet Job Market Trends — June 2026',date '2026-06-01',
  'PNet entry-level Bookkeeper / Junior Accounts Clerk salary offers. Use qualification and actual responsibilities to choose within the band.',true
),
(
  'Academic, Assessments & Content','Academic & Content Administrator','Junior administrative support','monthly_band',
  10000,15000,0,0,
  'CareerJunction Office Administrator benchmark — May 2026',date '2026-05-15',
  'Administrative proxy for junior academic/content support. Qualified assessors, moderators, instructional designers or academic leads require separate higher benchmarking.',true
),
(
  'Enrolments & Courses','Enrolment & Courses Administrator','Junior administrative support','monthly_band',
  10000,15000,0,0,
  'CareerJunction Office Administrator benchmark — May 2026',date '2026-05-15',
  'Administrative proxy for enrolment/course-processing support. Sales-linked admissions roles may also include governed incentive structures.',true
),
(
  'Student Support & CRM','Junior Student Support / CRM Assistant','Entry-level support','monthly_band',
  8200,9800,0,0,
  'PNet Cape Town Customer Support Agent benchmark — September 2026',date '2026-09-23',
  'Entry-level customer-support proxy. Specialist Student Success roles in the current market can be substantially higher.',true
),
(
  'Marketing & Admissions','Marketing & Admissions Assistant','Junior / early-career','monthly_band',
  10000,15000,0,0,
  'PNet Cape Town Marketing & Social Media Assistant benchmark — September 2026',date '2026-09-23',
  'Junior assistant benchmark. Experienced coordinators, specialists and managers require separate higher benchmarking.',true
),
(
  'Communication Hub','Communications & Content Assistant','Junior / early-career','monthly_band',
  10000,15000,0,0,
  'PNet Cape Town Marketing & Social Media Assistant benchmark — September 2026',date '2026-09-23',
  'Junior communications/content support proxy. Experienced Communications & PR Officer market rates are substantially higher.',true
),
(
  'IT, Security & Platform','Junior IT Support / Systems Assistant','Graduate / junior','monthly_band',
  10690,14750,0,0,
  'PNet Entry-Level Jobs for Graduates — June 2026',date '2026-06-01',
  'Entry-level systems/network administration and IT hardware support benchmark. Cybersecurity engineering or senior platform ownership requires separate higher benchmarking.',true
),
(
  'Executive / CEO','Founder & CEO','Founder / executive','revenue_percentage',
  0,0,10,15,
  'FOA internal early-stage affordability heuristic',date '2026-09-23',
  'Not a market salary benchmark. Guidance uses 10%–15% of the selected month revenue target as an early-stage planning envelope. Final CEO remuneration remains owner/accountant-governed and should not undermine approved surplus and operating-cost plans.',true
)
on conflict(department) do update set
  suggested_role=excluded.suggested_role,
  profile_level=excluded.profile_level,
  guidance_type=excluded.guidance_type,
  monthly_min=excluded.monthly_min,
  monthly_max=excluded.monthly_max,
  revenue_pct_min=excluded.revenue_pct_min,
  revenue_pct_max=excluded.revenue_pct_max,
  source_label=excluded.source_label,
  source_as_of=excluded.source_as_of,
  source_note=excluded.source_note,
  active=excluded.active,
  updated_at=now();
