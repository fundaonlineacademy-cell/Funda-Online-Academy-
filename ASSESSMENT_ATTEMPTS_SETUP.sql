-- FUNDA ONLINE ACADEMY — ASSESSMENT ATTEMPTS & FINAL RESULTS
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  course_id uuid not null,
  module_number integer not null,
  assessment_type text not null check (assessment_type in ('formative','summative')),
  attempt_number integer not null check (attempt_number between 1 and 3),
  score_percent numeric(5,2) not null,
  correct_answers integer not null,
  total_questions integer not null,
  passed boolean not null default false,
  is_final boolean not null default false,
  submitted_at timestamptz not null default now(),
  unique(student_id, course_id, module_number, assessment_type, attempt_number)
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  course_id uuid not null,
  module_number integer not null,
  assessment_type text not null check (assessment_type in ('formative','summative')),
  final_score_percent numeric(5,2) not null,
  passed boolean not null,
  attempts_used integer not null check (attempts_used between 1 and 3),
  recorded_at timestamptz not null default now(),
  unique(student_id, course_id, module_number, assessment_type)
);

alter table public.assessment_attempts enable row level security;
alter table public.assessment_results enable row level security;

drop policy if exists assessment_attempts_select_own on public.assessment_attempts;
create policy assessment_attempts_select_own on public.assessment_attempts for select using (auth.uid() = student_id);
drop policy if exists assessment_attempts_insert_own on public.assessment_attempts;
create policy assessment_attempts_insert_own on public.assessment_attempts for insert with check (auth.uid() = student_id);

drop policy if exists assessment_results_select_own on public.assessment_results;
create policy assessment_results_select_own on public.assessment_results for select using (auth.uid() = student_id);
drop policy if exists assessment_results_insert_own on public.assessment_results;
create policy assessment_results_insert_own on public.assessment_results for insert with check (auth.uid() = student_id);
drop policy if exists assessment_results_update_own on public.assessment_results;
create policy assessment_results_update_own on public.assessment_results for update using (auth.uid() = student_id) with check (auth.uid() = student_id);