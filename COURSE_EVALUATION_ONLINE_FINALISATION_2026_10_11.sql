-- Funda Online Academy — Course Evaluation Online Finalisation
-- 11 October 2026
-- Scope: activate the approved digital Course Evaluation form, validate required responses,
-- and enforce academic/PCA completion before submission.

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
  if v_overall not between 1 and 5 then raise exception 'Overall course rating must be between 1 and 5.'; end if;
  if v_org not between 1 and 5 then raise exception 'Course organisation rating must be between 1 and 5.'; end if;
  if v_objectives not in ('yes','no') then raise exception 'Course objectives response is required.'; end if;
  if v_objectives='no' and length(trim(coalesce(r->>'objectives_not_achieved_reason','')))<3 then raise exception 'Please explain why the course objectives were not achieved.'; end if;
  if v_expectations not in ('yes','no','partly') then raise exception 'Knowledge and expectations response is required.'; end if;
  if v_applicability not in ('definitely','mostly','somewhat','not_at_all') then raise exception 'Work applicability response is required.'; end if;
  if length(coalesce(r->>'most_useful_learning',''))>5000 or length(coalesce(r->>'objectives_not_achieved_reason',''))>5000 or length(coalesce(r->>'improvement_comments',''))>5000 or length(coalesce(r->>'comments_suggestions',''))>5000 or length(coalesce(r->>'further_comments',''))>5000 then raise exception 'One or more written responses are too long.'; end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_course_evaluation_submission on public.course_evaluation_submissions;
create trigger trg_validate_course_evaluation_submission
before insert or update on public.course_evaluation_submissions
for each row execute function public.validate_course_evaluation_submission();

create or replace function public.submit_course_evaluation(p_course_id uuid,p_responses jsonb)
returns jsonb
language plpgsql
security definer
set search_path to public, pg_temp
as $$
declare
  v_uid uuid:=auth.uid(); v_sid uuid; v_cfg public.course_end_requirements%rowtype;
  v_enrolled boolean:=false; v_summative_passed boolean:=false; v_pca_met boolean:=false;
  v_existing uuid; v_new_id uuid;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'message','Please sign in to continue.'); end if;
  select id into v_sid from public.students where user_id=v_uid order by created_at desc nulls last limit 1;
  select exists(select 1 from public.enrollments e left join public.students s on s.id=e.student_id where e.course_id=p_course_id and (e.student_id=v_uid or e.student_id=v_sid or s.user_id=v_uid) and (lower(coalesce(e.enrollment_status,'')) in ('approved','active','enrolled','completed') or lower(coalesce(e.status,'')) in ('approved','active','enrolled','completed'))) into v_enrolled;
  if not v_enrolled then return jsonb_build_object('ok',false,'message','Approved course access was not found for this account.'); end if;
  select * into v_cfg from public.course_end_requirements where course_id=p_course_id;
  if not found or not v_cfg.evaluation_required or v_cfg.evaluation_form_status<>'active' or v_cfg.evaluation_form_version is null then return jsonb_build_object('ok',false,'message','The Course Evaluation is not currently available for this course.'); end if;
  select exists(select 1 from public.assessment_attempts aa join public.assessments a on a.id=aa.assessment_id where a.course_id=p_course_id and a.module_id=v_cfg.final_module_id and coalesce(a.active,true)=true and lower(coalesce(a.status,'published')) in ('published','active') and lower(coalesce(a.title,'')) like '%summative%' and (aa.student_id=v_uid or aa.student_id=v_sid) and aa.passed=true) into v_summative_passed;
  if not v_summative_passed then return jsonb_build_object('ok',false,'message','Pass the final Summative Assessment before completing the Course Evaluation.'); end if;
  if v_cfg.pca_required then
    select exists(select 1 from public.pca_submissions ps where ps.course_id=p_course_id and ps.user_id=v_uid and ps.status='competent' and coalesce(ps.rubric_score,0)>=v_cfg.pca_minimum_score and coalesce(ps.critical_criteria_met,false)=true) into v_pca_met;
    if not v_pca_met then return jsonb_build_object('ok',false,'message','Achieve Competent status in the Practical Competence Assessment before completing the Course Evaluation.'); end if;
  end if;
  select id into v_existing from public.course_evaluation_submissions where course_id=p_course_id and user_id=v_uid and form_version=v_cfg.evaluation_form_version;
  if v_existing is not null then return jsonb_build_object('ok',true,'already_submitted',true,'submission_id',v_existing,'message','Your Course Evaluation has already been submitted.'); end if;
  insert into public.course_evaluation_submissions(course_id,user_id,form_version,responses) values(p_course_id,v_uid,v_cfg.evaluation_form_version,coalesce(p_responses,'{}'::jsonb)) returning id into v_new_id;
  return jsonb_build_object('ok',true,'already_submitted',false,'submission_id',v_new_id,'message','Thank you. Your Course Evaluation has been submitted.');
end;
$$;

grant execute on function public.submit_course_evaluation(uuid,jsonb) to authenticated;

update public.course_end_requirements
set evaluation_form_version='FOA-EVAL-001 v1.0', evaluation_form_status='active', updated_at=now()
where evaluation_required=true;
