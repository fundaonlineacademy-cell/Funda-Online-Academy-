-- Private academic rollback and source-verification register for the Bookkeeping course.
-- These tables are deliberately outside the public API surface.

create schema if not exists private;

create table if not exists private.academic_content_snapshots (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  scope text not null,
  standard_versions text not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists academic_content_snapshots_course_created_idx
  on private.academic_content_snapshots (course_id, created_at desc);

create table if not exists private.academic_source_verifications (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id),
  lesson_id uuid not null references public.lessons(id),
  scope text not null default 'lesson',
  claim_summary text not null,
  source_title text not null,
  source_url text not null,
  source_authority text not null,
  source_date date,
  checked_at timestamptz not null,
  standard_version text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (course_id, lesson_id, source_url, claim_summary)
);

create index if not exists academic_source_verifications_course_lesson_idx
  on private.academic_source_verifications (course_id, lesson_id);

create index if not exists academic_source_verifications_lesson_idx
  on private.academic_source_verifications (lesson_id);

alter table private.academic_content_snapshots enable row level security;
alter table private.academic_source_verifications enable row level security;

revoke all on private.academic_content_snapshots from public, anon, authenticated;
revoke all on private.academic_source_verifications from public, anon, authenticated;

comment on table private.academic_content_snapshots is
  'Restricted pre-change academic snapshots used for controlled rollback.';
comment on table private.academic_source_verifications is
  'Restricted register of official sources used to verify time-sensitive lesson claims.';

with target_lessons as (
  select
    module.course_id,
    lesson.id as lesson_id,
    lower(concat_ws(' ',
      lesson.title,
      lesson.learning_objectives,
      lesson.key_terms,
      lesson.lesson_overview,
      lesson.key_concepts,
      lesson.main_content,
      lesson.examples,
      lesson.case_study,
      lesson.practical_activity,
      lesson.lesson_summary,
      lesson.assessment_guidance
    )) as searchable
  from public.lessons lesson
  join public.course_modules module on module.id = lesson.module_id
  where module.course_id = 'fcbe0c39-c31f-4a39-833f-7b89d553bef2'::uuid
), official_sources(pattern, claim_summary, source_title, source_url, source_authority, notes) as (
  values
    ('\mvat\M|value-added tax|tax invoice',
     'Current South African VAT rate and registration-threshold context, including the thresholds effective from 1 April 2026.',
     'Value-Added Tax (VAT)',
     'https://www.sars.gov.za/types-of-tax/value-added-tax/',
     'South African Revenue Service',
     'Official SARS overview checked for the current rate and compulsory/voluntary registration context.'),
    ('\mvat\M|tax invoice|input tax|output tax',
     'Tax-invoice particulars, including the distinction between consideration exceeding R5,000 and lower-value invoices.',
     'VAT 404 – Guide for Vendors',
     'https://www.sars.gov.za/wp-content/uploads/Ops/Guides/Legal-Pub-Guide-VAT404-VAT-404-Guide-for-Vendors.pdf',
     'South African Revenue Service',
     'Official SARS vendor guide checked for tax-invoice requirements and the R5,000 boundary wording.'),
    ('\mvat\M|vat201|vat record|input tax|output tax',
     'General VAT-vendor filing and record-retention obligations, including the five-year retention rule.',
     'Obligations of a VAT Vendor',
     'https://www.sars.gov.za/types-of-tax/value-added-tax/obligations-of-a-vat-vendor/',
     'South African Revenue Service',
     'Official SARS vendor-obligations page checked for VAT201 and record-retention context.'),
    ('\muif\M|unemployment insurance',
     'UIF contribution rate, employer/employee shares, and the current contribution ceiling used in the lesson context.',
     'Unemployment Insurance Fund',
     'https://www.sars.gov.za/types-of-tax/unemployment-insurance-fund/',
     'South African Revenue Service',
     'Official SARS UIF page checked for the 1% employee and 1% employer contributions and ceiling context.'),
    ('\msdl\M|skills development levy',
     'Skills Development Levy rate and the annual payroll exemption threshold.',
     'Skills Development Levy',
     'https://www.sars.gov.za/types-of-tax/skills-development-levy/',
     'South African Revenue Service',
     'Official SARS SDL page checked for the 1% levy and R500,000 exemption threshold.'),
    ('basic conditions of employment|employment record|payroll record retention|hours worked',
     'Employee-record and remuneration-information retention requirements used in the payroll lesson context.',
     'Basic Conditions of Employment Act 75 of 1997',
     'https://www.labour.gov.za/DocumentCenter/Acts/Basic%20Conditions%20of%20Employment/Act%20-%20Basic%20Conditions%20of%20Employment.pdf',
     'South African Department of Employment and Labour',
     'Official Act checked for the general three-year employee-record retention requirement.'),
    ('ifrs for smes|reporting framework',
     'Status and effective date of the 2025 third edition of the IFRS for SMEs Accounting Standard.',
     'IFRS for SMEs Accounting Standard',
     'https://www.ifrs.org/issued-standards/ifrs-for-smes/',
     'IFRS Foundation',
     'Official IFRS Foundation page checked: effective for periods beginning on or after 1 January 2027; early application permitted.'),
    ('companies act|\mcipc\M|company accounting records',
     'Company accounting-record context and the role of the Companies Act/CIPC.',
     'Companies and Close Corporations',
     'https://www.cipc.co.za/',
     'Companies and Intellectual Property Commission',
     'Official CIPC source retained for company-law and accounting-record context; the course does not give legal advice.'),
    ('provisional tax|\mirp6\M',
     'Purpose of provisional tax and the IRP6 return used for provisional-tax estimates.',
     'Provisional Tax',
     'https://www.sars.gov.za/types-of-tax/provisional-tax/',
     'South African Revenue Service',
     'Official SARS provisional-tax page checked for mechanism and return context.'),
    ('\mpaye\M|employees tax|\memp201\M|\mirp5\M',
     'Employer payroll-tax administration and current employees-tax guidance used in the lesson context.',
     'Guide for Employers in respect of Employees’ Tax (2027)',
     'https://www.sars.gov.za/guide-for-employers-in-respect-of-employees-tax-2027/',
     'South African Revenue Service',
     'Official SARS employer guide checked for current payroll-tax administration context.')
)
insert into private.academic_source_verifications (
  course_id,
  lesson_id,
  scope,
  claim_summary,
  source_title,
  source_url,
  source_authority,
  source_date,
  checked_at,
  standard_version,
  notes
)
select
  lesson.course_id,
  lesson.lesson_id,
  'lesson',
  source.claim_summary,
  source.source_title,
  source.source_url,
  source.source_authority,
  null,
  '2026-10-14 20:30:00+00'::timestamptz,
  'FOA-ACA-STD-001 v1.1',
  source.notes
from target_lessons lesson
cross join official_sources source
where lesson.searchable ~ source.pattern
on conflict (course_id, lesson_id, source_url, claim_summary) do update
set source_title = excluded.source_title,
    source_authority = excluded.source_authority,
    checked_at = excluded.checked_at,
    standard_version = excluded.standard_version,
    notes = excluded.notes;

