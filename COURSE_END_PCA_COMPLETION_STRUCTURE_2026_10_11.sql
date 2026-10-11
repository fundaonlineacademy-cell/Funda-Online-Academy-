-- Funda Online Academy — PCA & Course Completion Structure
-- Applied to production through Supabase migration: course_end_pca_completion_structure_v1
-- 11 October 2026

create table if not exists public.course_end_requirements (
  course_id uuid primary key references public.courses(id) on delete cascade,
  final_module_id uuid not null references public.course_modules(id) on delete restrict,
  assessment_path text not null check (assessment_path in ('summative_only','formative_summative')),
  pca_required boolean not null default false,
  pca_modes text[] not null default '{}'::text[],
  pca_title text not null default 'Practical Competence Assessment',
  pca_minimum_score numeric(5,2) not null default 60 check (pca_minimum_score between 0 and 100),
  pca_max_resubmissions integer not null default 1 check (pca_max_resubmissions between 0 and 5),
  pca_task_status text not null default 'not_applicable' check (pca_task_status in ('not_applicable','structure_only','draft','active','retired')),
  pca_task_config jsonb not null default '{}'::jsonb,
  evaluation_required boolean not null default true,
  evaluation_form_version text,
  evaluation_form_status text not null default 'pending_design' check (evaluation_form_status in ('pending_design','draft','active','retired')),
  classification_source text not null default 'FOA-ASS-STD-001 v1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pca_submissions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  final_module_id uuid not null references public.course_modules(id) on delete restrict,
  user_id uuid not null,
  submission_number integer not null check (submission_number between 1 and 2),
  status text not null default 'draft' check (status in ('draft','submitted','under_review','competent','not_yet_competent','resubmission_required','final_not_yet_competent')),
  evidence jsonb not null default '{}'::jsonb,
  learner_declaration boolean not null default false,
  rubric_score numeric(5,2) check (rubric_score between 0 and 100),
  critical_criteria_met boolean,
  assessor_feedback text,
  assessed_by uuid,
  submitted_at timestamptz,
  assessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,user_id,submission_number)
);

create table if not exists public.course_evaluation_submissions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null,
  form_version text not null,
  responses jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id,user_id,form_version)
);

create or replace function public.foa_touch_course_end_updated_at()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin new.updated_at=now(); return new; end;
$$;

drop trigger if exists trg_course_end_requirements_updated_at on public.course_end_requirements;
create trigger trg_course_end_requirements_updated_at before update on public.course_end_requirements for each row execute function public.foa_touch_course_end_updated_at();
drop trigger if exists trg_pca_submissions_updated_at on public.pca_submissions;
create trigger trg_pca_submissions_updated_at before update on public.pca_submissions for each row execute function public.foa_touch_course_end_updated_at();
drop trigger if exists trg_course_evaluation_submissions_updated_at on public.course_evaluation_submissions;
create trigger trg_course_evaluation_submissions_updated_at before update on public.course_evaluation_submissions for each row execute function public.foa_touch_course_end_updated_at();

alter table public.course_end_requirements enable row level security;
alter table public.pca_submissions enable row level security;
alter table public.course_evaluation_submissions enable row level security;

drop policy if exists "Admins manage course end requirements" on public.course_end_requirements;
create policy "Admins manage course end requirements" on public.course_end_requirements for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Enrolled students read course end requirements" on public.course_end_requirements;
create policy "Enrolled students read course end requirements" on public.course_end_requirements for select to authenticated using (
  exists (
    select 1 from public.enrollments e left join public.students s on s.id=e.student_id
    where e.course_id=course_end_requirements.course_id
      and (e.student_id=auth.uid() or s.user_id=auth.uid())
      and (lower(coalesce(e.enrollment_status,'')) in ('approved','active','enrolled','completed') or lower(coalesce(e.status,'')) in ('approved','active','enrolled','completed'))
  )
);

drop policy if exists "Admins manage PCA submissions" on public.pca_submissions;
create policy "Admins manage PCA submissions" on public.pca_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Students read own PCA submissions" on public.pca_submissions;
create policy "Students read own PCA submissions" on public.pca_submissions for select to authenticated using (user_id=auth.uid());
drop policy if exists "Students create eligible PCA submissions" on public.pca_submissions;
create policy "Students create eligible PCA submissions" on public.pca_submissions for insert to authenticated with check (
  user_id=auth.uid() and learner_declaration=true and status in ('draft','submitted')
  and exists (
    select 1 from public.course_end_requirements cer
    where cer.course_id=pca_submissions.course_id and cer.final_module_id=pca_submissions.final_module_id
      and cer.pca_required=true and cer.pca_task_status='active'
      and submission_number <= cer.pca_max_resubmissions + 1
      and exists (
        select 1 from public.assessment_attempts aa join public.assessments a on a.id=aa.assessment_id
        where a.course_id=cer.course_id and a.module_id=cer.final_module_id
          and coalesce(a.active,true)=true and lower(coalesce(a.status,'published')) in ('published','active')
          and lower(coalesce(a.title,'')) like '%summative%' and aa.student_id=auth.uid() and aa.passed=true
      )
  )
);
drop policy if exists "Students update own draft PCA submissions" on public.pca_submissions;
create policy "Students update own draft PCA submissions" on public.pca_submissions for update to authenticated using (user_id=auth.uid() and status='draft') with check (user_id=auth.uid() and status in ('draft','submitted'));

drop policy if exists "Admins read course evaluations" on public.course_evaluation_submissions;
create policy "Admins read course evaluations" on public.course_evaluation_submissions for select to authenticated using (public.is_admin());
drop policy if exists "Students read own course evaluations" on public.course_evaluation_submissions;
create policy "Students read own course evaluations" on public.course_evaluation_submissions for select to authenticated using (user_id=auth.uid());
drop policy if exists "Students submit eligible course evaluations" on public.course_evaluation_submissions;
create policy "Students submit eligible course evaluations" on public.course_evaluation_submissions for insert to authenticated with check (
  user_id=auth.uid()
  and exists (
    select 1 from public.course_end_requirements cer
    where cer.course_id=course_evaluation_submissions.course_id and cer.evaluation_required=true
      and cer.evaluation_form_status='active' and cer.evaluation_form_version=course_evaluation_submissions.form_version
      and exists (
        select 1 from public.assessment_attempts aa join public.assessments a on a.id=aa.assessment_id
        where a.course_id=cer.course_id and a.module_id=cer.final_module_id
          and coalesce(a.active,true)=true and lower(coalesce(a.status,'published')) in ('published','active')
          and lower(coalesce(a.title,'')) like '%summative%' and aa.student_id=auth.uid() and aa.passed=true
      )
      and (cer.pca_required=false or exists (
        select 1 from public.pca_submissions ps
        where ps.course_id=cer.course_id and ps.user_id=auth.uid() and ps.status='competent'
          and coalesce(ps.rubric_score,0) >= cer.pca_minimum_score and ps.critical_criteria_met=true
      ))
  )
);

-- Catalogue classification. Course UUIDs are resolved by canonical course title so generated IDs are not hard-coded.
with cfg(title,assessment_path,pca_required,pca_modes) as (
  values
  ('Bookkeeping & Financial Administration — Professional Short Course','formative_summative',true,array['applied_work_product']::text[]),
  ('Business Administration & Workplace Operations — Professional Short Course','formative_summative',false,array[]::text[]),
  ('Carpentry Fundamentals & Workplace Practice — Practical Skills Short Course','formative_summative',true,array['structured_simulation','applied_drawing']::text[]),
  ('Cashier Excellence, Till Operations & Retail Customer Service — Professional Short Course','summative_only',false,array[]::text[]),
  ('Commercial Cleaning & Professional Janitorial Services — Practical Skills Short Course','summative_only',true,array['hands_on_practical']::text[]),
  ('Computer & Digital Literacy for the Modern Workplace — Professional Short Course','formative_summative',true,array['applied_work_product']::text[]),
  ('Construction Site Skills & Workplace Readiness — Practical Skills Short Course','summative_only',true,array['structured_simulation','drawing']::text[]),
  ('Corporate Reception, Administration & Professional Office Skills — Professional Short Course','formative_summative',false,array[]::text[]),
  ('Customer Service Excellence & Professional Communication — Professional Short Course','summative_only',false,array[]::text[]),
  ('Cybersecurity & Digital Safety Fundamentals — Professional Short Course','formative_summative',false,array[]::text[]),
  ('Digital Device Repair & Technical Support — Practical Skills Short Course','formative_summative',true,array['structured_simulation','applied_work_product']::text[]),
  ('E-Commerce & Online Retail Management — Professional Short Course','formative_summative',true,array['business_project_plan']::text[]),
  ('Early Childhood Care & Development Fundamentals — Professional Short Course','formative_summative',false,array[]::text[]),
  ('Event Management, Wedding & Conference Planning — Advanced Professional Short Course','formative_summative',true,array['business_project_plan','portfolio']::text[]),
  ('Fashion Design & Garment Making Fundamentals — Professional Short Course','formative_summative',true,array['applied_work_product','hands_on_practical']::text[]),
  ('Fire Safety, Emergency Response & Safety Officer Fundamentals — Professional Short Course','formative_summative',false,array[]::text[]),
  ('Food & Beverage Service & Hospitality Operations — Professional Short Course','summative_only',true,array['hands_on_practical']::text[]),
  ('Food Safety, Hygiene & HACCP Fundamentals — Professional Short Course','summative_only',false,array[]::text[]),
  ('Front Office, Hotel Reception & Guest Services — Professional Short Course','summative_only',false,array[]::text[]),
  ('Gel & Acrylic Nail Technology — Professional Practical Skills Short Course','formative_summative',true,array['hands_on_practical']::text[]),
  ('Graphic Design & Visual Communication — Professional Short Course','formative_summative',true,array['applied_work_product']::text[]),
  ('Landscaping & Professional Garden Maintenance — Practical Skills Short Course','summative_only',true,array['business_project_plan','drawing']::text[]),
  ('Office Administration & Professional Assistant Skills — Professional Short Course','formative_summative',false,array[]::text[]),
  ('Petrol Station Attendant Operations & Forecourt Customer Service — Professional Short Course','summative_only',false,array[]::text[]),
  ('Poultry Production & Enterprise Management — Practical Skills Short Course','formative_summative',true,array['business_project_plan','structured_simulation']::text[]),
  ('Print, Branding & Custom Product Production — Practical Skills Short Course','formative_summative',true,array['applied_work_product','business_project_plan']::text[]),
  ('Professional Baking & Enterprise Development — Practical Skills Short Course','formative_summative',true,array['hands_on_practical','business_project_plan']::text[]),
  ('Professional Housekeeping & Hospitality Services — Professional Short Course','summative_only',true,array['hands_on_practical']::text[]),
  ('Professional Makeup Artistry & Client Services — Professional Practical Skills Short Course','formative_summative',true,array['hands_on_practical']::text[]),
  ('Retail Management & Team Leadership — Advanced Professional Short Course','formative_summative',false,array[]::text[]),
  ('Retail Merchandising & Visual Display — Professional Short Course','summative_only',false,array[]::text[]),
  ('Sewing, Garment Production & Small Business Skills — Professional Short Course','formative_summative',true,array['hands_on_practical','business_project_plan']::text[]),
  ('Strategic Social Media Marketing & Paid Media — Professional Short Course','formative_summative',true,array['applied_work_product']::text[]),
  ('Urban Farming & Small-Scale Agriculture — Practical Skills Short Course','summative_only',true,array['hands_on_practical','business_project_plan']::text[]),
  ('Warehouse & Logistics Operations — Professional Short Course','summative_only',false,array[]::text[])
), resolved as (
  select c.id as course_id,
         (select cm.id from public.course_modules cm where cm.course_id=c.id order by cm.module_number desc limit 1) as final_module_id,
         cfg.assessment_path,cfg.pca_required,cfg.pca_modes
  from cfg join public.courses c on c.title=cfg.title
)
insert into public.course_end_requirements(course_id,final_module_id,assessment_path,pca_required,pca_modes,pca_task_status,evaluation_required,evaluation_form_status,classification_source)
select course_id,final_module_id,assessment_path,pca_required,pca_modes,
       case when pca_required then 'structure_only' else 'not_applicable' end,
       true,'pending_design','FOA-ASS-STD-001 v1.0'
from resolved where final_module_id is not null
on conflict(course_id) do update set
  final_module_id=excluded.final_module_id,
  assessment_path=excluded.assessment_path,
  pca_required=excluded.pca_required,
  pca_modes=excluded.pca_modes,
  pca_task_status=excluded.pca_task_status,
  evaluation_required=excluded.evaluation_required,
  evaluation_form_status=excluded.evaluation_form_status,
  classification_source=excluded.classification_source;

create or replace function public.get_course_end_structure(p_course_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_uid uuid:=auth.uid(); v_sid uuid; v_enrolled boolean:=false; v_qa boolean:=false;
  v_cfg public.course_end_requirements%rowtype; v_final_module_number integer;
  v_final_summative_passed boolean:=false; v_pca_status text; v_pca_score numeric; v_pca_critical boolean;
  v_eval_submitted boolean:=false; v_academic_met boolean:=false; v_pca_unlocked boolean:=false; v_completion_unlocked boolean:=false;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'message','Please sign in to continue.'); end if;
  v_qa:=public.is_internal_qa_account();
  select id into v_sid from public.students where user_id=v_uid order by created_at desc nulls last limit 1;
  select exists(
    select 1 from public.enrollments e left join public.students s on s.id=e.student_id
    where e.course_id=p_course_id and (e.student_id=v_uid or e.student_id=v_sid or s.user_id=v_uid)
      and (lower(coalesce(e.enrollment_status,'')) in ('approved','active','enrolled','completed') or lower(coalesce(e.status,'')) in ('approved','active','enrolled','completed'))
  ) into v_enrolled;
  if not v_enrolled then return jsonb_build_object('ok',false,'message','Approved course access was not found for this account.'); end if;
  select * into v_cfg from public.course_end_requirements where course_id=p_course_id;
  if not found then return jsonb_build_object('ok',false,'message','Course completion requirements have not been configured for this course.'); end if;
  select module_number into v_final_module_number from public.course_modules where id=v_cfg.final_module_id;
  if v_qa then v_final_summative_passed:=true;
  else
    select exists(
      select 1 from public.assessment_attempts aa join public.assessments a on a.id=aa.assessment_id
      where a.course_id=p_course_id and a.module_id=v_cfg.final_module_id and coalesce(a.active,true)=true
        and lower(coalesce(a.status,'published')) in ('published','active') and lower(coalesce(a.title,'')) like '%summative%'
        and aa.student_id=v_uid and aa.passed=true
    ) into v_final_summative_passed;
  end if;
  select ps.status,ps.rubric_score,ps.critical_criteria_met into v_pca_status,v_pca_score,v_pca_critical
  from public.pca_submissions ps where ps.course_id=p_course_id and ps.user_id=v_uid
  order by ps.submission_number desc,ps.created_at desc limit 1;
  select exists(select 1 from public.course_evaluation_submissions ces where ces.course_id=p_course_id and ces.user_id=v_uid and (v_cfg.evaluation_form_version is null or ces.form_version=v_cfg.evaluation_form_version)) into v_eval_submitted;
  v_pca_unlocked:=v_cfg.pca_required and v_cfg.pca_task_status='active' and v_final_summative_passed;
  v_academic_met:=v_final_summative_passed and (not v_cfg.pca_required or (v_pca_status='competent' and coalesce(v_pca_score,0)>=v_cfg.pca_minimum_score and coalesce(v_pca_critical,false)=true));
  v_completion_unlocked:=v_academic_met and (not v_cfg.evaluation_required or v_cfg.evaluation_form_status='active');
  return jsonb_build_object(
    'ok',true,'internal_qa_access',v_qa,'course_id',p_course_id,'final_module_id',v_cfg.final_module_id,'final_module_number',v_final_module_number,
    'assessment_path',v_cfg.assessment_path,'final_summative_passed',v_final_summative_passed,'pca_required',v_cfg.pca_required,'pca_modes',v_cfg.pca_modes,
    'pca_title',v_cfg.pca_title,'pca_minimum_score',v_cfg.pca_minimum_score,'pca_max_resubmissions',v_cfg.pca_max_resubmissions,'pca_task_status',v_cfg.pca_task_status,
    'pca_task_config',case when v_cfg.pca_task_status='active' then v_cfg.pca_task_config else '{}'::jsonb end,'pca_unlocked',v_pca_unlocked,
    'pca_submission_status',v_pca_status,'pca_rubric_score',v_pca_score,'pca_critical_criteria_met',v_pca_critical,'academic_requirements_met',v_academic_met,
    'evaluation_required',v_cfg.evaluation_required,'evaluation_form_status',v_cfg.evaluation_form_status,'evaluation_form_version',v_cfg.evaluation_form_version,
    'evaluation_submitted',v_eval_submitted,'course_completion_unlocked',v_completion_unlocked,
    'course_completion_ready',v_academic_met and (not v_cfg.evaluation_required or v_eval_submitted)
  );
end;
$$;

revoke all on function public.get_course_end_structure(uuid) from public;
grant execute on function public.get_course_end_structure(uuid) to authenticated;
