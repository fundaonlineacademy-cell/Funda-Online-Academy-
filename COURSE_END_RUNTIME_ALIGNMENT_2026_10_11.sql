-- Funda Online Academy — Course-end runtime alignment
-- 11 October 2026
-- Keeps the repository definition aligned with the live course-end structure after Course Evaluation activation.

create or replace function public.validate_course_evaluation_submission()
returns trigger
language plpgsql
set search_path to public, pg_temp
as $$
declare
  r jsonb:=coalesce(new.responses,'{}'::jsonb);
  v_overall integer;
  v_org integer;
  v_objectives text;
  v_expectations text;
  v_applicability text;
begin
  begin v_overall := (r->>'overall_rating')::integer; exception when others then v_overall:=null; end;
  begin v_org := (r->>'organization_rating')::integer; exception when others then v_org:=null; end;
  v_objectives:=lower(coalesce(r->>'objectives_achieved',''));
  v_expectations:=lower(coalesce(r->>'expectations_met',''));
  v_applicability:=lower(coalesce(r->>'work_applicability',''));
  if v_overall is null or v_overall not between 1 and 5 then raise exception 'Overall course rating must be between 1 and 5.'; end if;
  if v_org is null or v_org not between 1 and 5 then raise exception 'Course organisation rating must be between 1 and 5.'; end if;
  if v_objectives not in ('yes','no') then raise exception 'Course objectives response is required.'; end if;
  if v_objectives='no' and length(trim(coalesce(r->>'objectives_not_achieved_reason','')))<3 then raise exception 'Please explain why the course objectives were not achieved.'; end if;
  if v_expectations not in ('yes','no','partly') then raise exception 'Knowledge and expectations response is required.'; end if;
  if v_applicability not in ('definitely','mostly','somewhat','not_at_all') then raise exception 'Work applicability response is required.'; end if;
  if length(coalesce(r->>'most_useful_learning',''))>5000 or length(coalesce(r->>'objectives_not_achieved_reason',''))>5000 or length(coalesce(r->>'improvement_comments',''))>5000 or length(coalesce(r->>'comments_suggestions',''))>5000 or length(coalesce(r->>'further_comments',''))>5000 then raise exception 'One or more written responses are too long.'; end if;
  return new;
end;
$$;

create or replace function public.get_course_end_structure(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to public, pg_temp
as $$
declare
  v_uid uuid:=auth.uid();
  v_sid uuid;
  v_enrolled boolean:=false;
  v_qa boolean:=false;
  v_cfg public.course_end_requirements%rowtype;
  v_course_title text;
  v_final_module_number integer;
  v_final_summative_passed boolean:=false;
  v_pca_status text;
  v_pca_score numeric;
  v_pca_critical boolean;
  v_eval_submitted boolean:=false;
  v_academic_met boolean:=false;
  v_pca_unlocked boolean:=false;
  v_completion_unlocked boolean:=false;
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

  select title into v_course_title from public.courses where id=p_course_id;
  select module_number into v_final_module_number from public.course_modules where id=v_cfg.final_module_id;

  if v_qa then v_final_summative_passed:=true;
  else
    select exists(
      select 1 from public.assessment_attempts aa join public.assessments a on a.id=aa.assessment_id
      where a.course_id=p_course_id and a.module_id=v_cfg.final_module_id
        and coalesce(a.active,true)=true and lower(coalesce(a.status,'published')) in ('published','active')
        and lower(coalesce(a.title,'')) like '%summative%'
        and (aa.student_id=v_uid or aa.student_id=v_sid) and aa.passed=true
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
    'ok',true,'internal_qa_access',v_qa,'course_id',p_course_id,'course_title',v_course_title,
    'final_module_id',v_cfg.final_module_id,'final_module_number',v_final_module_number,'assessment_path',v_cfg.assessment_path,
    'final_summative_passed',v_final_summative_passed,'pca_required',v_cfg.pca_required,'pca_modes',v_cfg.pca_modes,
    'pca_title',v_cfg.pca_title,'pca_minimum_score',v_cfg.pca_minimum_score,'pca_max_resubmissions',v_cfg.pca_max_resubmissions,
    'pca_task_status',v_cfg.pca_task_status,'pca_task_config',case when v_cfg.pca_task_status='active' then v_cfg.pca_task_config else '{}'::jsonb end,
    'pca_unlocked',v_pca_unlocked,'pca_submission_status',v_pca_status,'pca_rubric_score',v_pca_score,'pca_critical_criteria_met',v_pca_critical,
    'academic_requirements_met',v_academic_met,'evaluation_required',v_cfg.evaluation_required,'evaluation_form_status',v_cfg.evaluation_form_status,
    'evaluation_form_version',v_cfg.evaluation_form_version,'evaluation_submitted',v_eval_submitted,'course_completion_unlocked',v_completion_unlocked,
    'course_completion_ready',v_academic_met and (not v_cfg.evaluation_required or v_eval_submitted)
  );
end;
$$;
