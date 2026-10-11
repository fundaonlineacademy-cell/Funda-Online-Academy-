-- Funda Online Academy
-- Admin PCA Assessment & Verification + AI-assisted pre-assessment
-- 11 October 2026
-- Additive / idempotent. AI remains advisory; human assessor controls final outcome.

create table if not exists public.pca_ai_preassessments (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.pca_submissions(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  learner_id uuid not null,
  requested_by uuid not null,
  status text not null default 'pending' check (status in ('pending','running','completed','failed','unavailable')),
  provider text not null default 'openai',
  model text,
  analysis_version text not null default 'FOA-PCA-AI-PREASSESS-v1',
  evidence_summary jsonb not null default '{}'::jsonb,
  criterion_suggestions jsonb not null default '[]'::jsonb,
  suggested_score numeric check (suggested_score is null or suggested_score between 0 and 100),
  suggested_critical_criteria_met boolean,
  relevance_score numeric check (relevance_score is null or relevance_score between 0 and 100),
  flags jsonb not null default '[]'::jsonb,
  manual_review_required boolean not null default true,
  error_message text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_pca_ai_preassessments_submission
  on public.pca_ai_preassessments(submission_id, created_at desc);
create index if not exists idx_pca_ai_preassessments_status
  on public.pca_ai_preassessments(status, requested_at desc);
create unique index if not exists uq_pca_ai_preassessments_id_submission
  on public.pca_ai_preassessments(id, submission_id);

create table if not exists public.pca_assessment_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.pca_submissions(id) on delete cascade,
  reviewer_id uuid not null,
  ai_preassessment_id uuid references public.pca_ai_preassessments(id) on delete set null,
  criterion_scores jsonb not null default '[]'::jsonb,
  overall_score numeric check (overall_score is null or overall_score between 0 and 100),
  critical_criteria_met boolean,
  review_status text not null default 'draft' check (review_status in ('draft','finalised')),
  decision text check (decision is null or decision in ('competent','not_yet_competent','final_not_yet_competent')),
  assessor_feedback text not null default '',
  finalised_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname='pca_review_ai_same_submission_fk') then
    alter table public.pca_assessment_reviews
      add constraint pca_review_ai_same_submission_fk
      foreign key (ai_preassessment_id,submission_id)
      references public.pca_ai_preassessments(id,submission_id)
      on delete set null (ai_preassessment_id);
  end if;
end $$;

alter table public.pca_ai_preassessments enable row level security;
alter table public.pca_assessment_reviews enable row level security;

drop policy if exists "Admins read PCA AI preassessments" on public.pca_ai_preassessments;
create policy "Admins read PCA AI preassessments"
  on public.pca_ai_preassessments for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins read PCA assessment reviews" on public.pca_assessment_reviews;
create policy "Admins read PCA assessment reviews"
  on public.pca_assessment_reviews for select to authenticated
  using (public.is_admin());

create or replace function public.get_admin_pca_review_queue()
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare v_result jsonb;
begin
  if not public.is_admin() then raise exception 'Admin authorisation is required.'; end if;
  select coalesce(jsonb_agg(row_data order by (row_data->>'submitted_at')::timestamptz desc nulls last),'[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'submission_id',ps.id,
      'learner_id',ps.user_id,
      'learner_name',coalesce(p.full_name,p.email,'Student'),
      'learner_email',p.email,
      'course_id',ps.course_id,
      'course_title',c.title,
      'submission_number',ps.submission_number,
      'status',ps.status,
      'evidence_count',case when jsonb_typeof(ps.evidence->'files')='array' then jsonb_array_length(ps.evidence->'files') else 0 end,
      'submitted_at',ps.submitted_at,
      'rubric_score',ps.rubric_score,
      'critical_criteria_met',ps.critical_criteria_met,
      'assessor_feedback',ps.assessor_feedback,
      'ai_status',ai.status,
      'ai_preassessment_id',ai.id,
      'ai_suggested_score',ai.suggested_score,
      'ai_relevance_score',ai.relevance_score,
      'ai_manual_review_required',coalesce(ai.manual_review_required,true),
      'review_status',rv.review_status,
      'review_overall_score',rv.overall_score,
      'review_critical_criteria_met',rv.critical_criteria_met,
      'review_decision',rv.decision
    ) row_data
    from public.pca_submissions ps
    join public.courses c on c.id=ps.course_id
    left join public.profiles p on p.id=ps.user_id
    left join lateral (
      select a.* from public.pca_ai_preassessments a
      where a.submission_id=ps.id order by a.created_at desc limit 1
    ) ai on true
    left join public.pca_assessment_reviews rv on rv.submission_id=ps.id
    where ps.status in ('submitted','under_review','not_yet_competent','resubmission_required','competent','final_not_yet_competent')
  ) q;
  return jsonb_build_object('ok',true,'items',v_result);
end;
$function$;

create or replace function public.get_admin_pca_review_detail(p_submission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_ps public.pca_submissions%rowtype;
  v_cfg public.course_end_requirements%rowtype;
  v_course text;
  v_profile jsonb;
  v_ai jsonb;
  v_review jsonb;
begin
  if not public.is_admin() then raise exception 'Admin authorisation is required.'; end if;
  select * into v_ps from public.pca_submissions where id=p_submission_id;
  if not found then return jsonb_build_object('ok',false,'message','PCA submission not found.'); end if;
  select * into v_cfg from public.course_end_requirements where course_id=v_ps.course_id;
  select title into v_course from public.courses where id=v_ps.course_id;
  select jsonb_build_object('id',p.id,'full_name',p.full_name,'email',p.email)
    into v_profile from public.profiles p where p.id=v_ps.user_id;
  select to_jsonb(a) into v_ai from public.pca_ai_preassessments a
    where a.submission_id=v_ps.id order by a.created_at desc limit 1;
  select to_jsonb(r) into v_review from public.pca_assessment_reviews r where r.submission_id=v_ps.id;
  return jsonb_build_object(
    'ok',true,'submission',to_jsonb(v_ps),'learner',coalesce(v_profile,'{}'::jsonb),
    'course_title',v_course,'pca_minimum_score',v_cfg.pca_minimum_score,
    'pca_max_resubmissions',v_cfg.pca_max_resubmissions,
    'task_config',coalesce(v_cfg.pca_task_config,'{}'::jsonb),
    'ai_preassessment',coalesce(v_ai,'null'::jsonb),'review',coalesce(v_review,'null'::jsonb)
  );
end;
$function$;

create or replace function public.save_admin_pca_review(
  p_submission_id uuid,
  p_criterion_scores jsonb,
  p_feedback text default '',
  p_ai_preassessment_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_ps public.pca_submissions%rowtype;
  v_cfg public.course_end_requirements%rowtype;
  v_criteria jsonb;
  v_scale jsonb;
  v_norm jsonb:='[]'::jsonb;
  v_item jsonb;
  v_criterion jsonb;
  v_scale_item jsonb;
  v_n int;
  v_i int;
  v_level int;
  v_level_pct numeric;
  v_weight numeric;
  v_weighted numeric;
  v_total numeric:=0;
  v_critical boolean;
  v_min_critical int:=3;
  v_critical_met boolean:=true;
  v_notes text;
  v_review_id uuid;
begin
  if v_uid is null or not public.is_admin() then raise exception 'Admin authorisation is required.'; end if;
  select * into v_ps from public.pca_submissions where id=p_submission_id for update;
  if not found then return jsonb_build_object('ok',false,'message','PCA submission not found.'); end if;
  if v_ps.status not in ('submitted','under_review') then
    return jsonb_build_object('ok',false,'message','This PCA is not open for assessor scoring.');
  end if;
  select * into v_cfg from public.course_end_requirements where course_id=v_ps.course_id;
  v_criteria:=coalesce(v_cfg.pca_task_config->'criteria','[]'::jsonb);
  v_scale:=coalesce(v_cfg.pca_task_config->'rubric_scale','[]'::jsonb);
  if jsonb_typeof(v_criteria)<>'array' or jsonb_array_length(v_criteria)=0 then
    return jsonb_build_object('ok',false,'message','The approved PCA rubric is unavailable.');
  end if;
  if jsonb_typeof(p_criterion_scores)<>'array' then
    return jsonb_build_object('ok',false,'message','Criterion scores must be supplied as an array.');
  end if;
  v_n:=jsonb_array_length(v_criteria);
  if jsonb_array_length(p_criterion_scores)<>v_n then
    return jsonb_build_object('ok',false,'message','Every PCA criterion must be scored before the review can be saved.');
  end if;
  v_min_critical:=coalesce((v_cfg.pca_task_config->'critical_criterion_rule'->>'minimum_level')::int,3);
  for v_i in 0..v_n-1 loop
    v_criterion:=v_criteria->v_i;
    select x into v_item from jsonb_array_elements(p_criterion_scores) x
      where (x->>'criterion_index')::int=v_i limit 1;
    if v_item is null then
      return jsonb_build_object('ok',false,'message',format('Criterion %s has not been scored.',v_i+1));
    end if;
    begin
      v_level:=(v_item->>'level')::int;
    exception when others then
      return jsonb_build_object('ok',false,'message',format('Criterion %s has an invalid level.',v_i+1));
    end;
    if v_level<0 or v_level>4 then
      return jsonb_build_object('ok',false,'message',format('Criterion %s must use Level 0 to Level 4.',v_i+1));
    end if;
    select x into v_scale_item from jsonb_array_elements(v_scale) x
      where (x->>'level')::int=v_level limit 1;
    if v_scale_item is null then return jsonb_build_object('ok',false,'message','The approved rubric scale is incomplete.'); end if;
    v_level_pct:=coalesce((v_scale_item->>'criterion_percentage')::numeric,0);
    v_weight:=coalesce((v_criterion->>'weight')::numeric,0);
    v_weighted:=round((v_weight*v_level_pct/100.0)::numeric,2);
    v_total:=v_total+v_weighted;
    v_critical:=coalesce((v_criterion->>'critical')::boolean,false);
    if v_critical and v_level<v_min_critical then v_critical_met:=false; end if;
    v_notes:=left(coalesce(v_item->>'notes',''),3000);
    v_norm:=v_norm||jsonb_build_array(jsonb_build_object(
      'criterion_index',v_i,'name',v_criterion->>'name','description',v_criterion->>'description',
      'weight',v_weight,'critical',v_critical,'level',v_level,'level_label',v_scale_item->>'label',
      'criterion_percentage',v_level_pct,'weighted_score',v_weighted,'notes',v_notes
    ));
  end loop;
  v_total:=round(v_total,1);
  insert into public.pca_assessment_reviews(
    submission_id,reviewer_id,ai_preassessment_id,criterion_scores,overall_score,
    critical_criteria_met,review_status,assessor_feedback,updated_at
  ) values(
    v_ps.id,v_uid,p_ai_preassessment_id,v_norm,v_total,v_critical_met,'draft',left(coalesce(p_feedback,''),8000),now()
  )
  on conflict(submission_id) do update set
    reviewer_id=excluded.reviewer_id,
    ai_preassessment_id=excluded.ai_preassessment_id,
    criterion_scores=excluded.criterion_scores,
    overall_score=excluded.overall_score,
    critical_criteria_met=excluded.critical_criteria_met,
    review_status='draft',decision=null,
    assessor_feedback=excluded.assessor_feedback,
    finalised_at=null,updated_at=now()
  returning id into v_review_id;
  update public.pca_submissions set status='under_review'
    where id=v_ps.id and status='submitted';
  insert into public.academic_audit_log(actor_id,action,entity_type,entity_id,student_id,course_id,details)
  values(v_uid,'Saved PCA assessor review','pca_submission',v_ps.id,v_ps.user_id,v_ps.course_id,
    jsonb_build_object('review_id',v_review_id,'overall_score',v_total,'critical_criteria_met',v_critical_met,'ai_preassessment_id',p_ai_preassessment_id));
  return jsonb_build_object(
    'ok',true,'review_id',v_review_id,'overall_score',v_total,'critical_criteria_met',v_critical_met,
    'criterion_scores',v_norm,'message','Assessor review saved. The learner has not received a final PCA outcome yet.'
  );
end;
$function$;

create or replace function public.finalise_admin_pca_review(p_submission_id uuid,p_feedback text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_ps public.pca_submissions%rowtype;
  v_cfg public.course_end_requirements%rowtype;
  v_review public.pca_assessment_reviews%rowtype;
  v_outcome text;
  v_threshold numeric;
  v_max_attempts int;
begin
  if v_uid is null or not public.is_admin() then raise exception 'Admin authorisation is required.'; end if;
  select * into v_ps from public.pca_submissions where id=p_submission_id for update;
  if not found then return jsonb_build_object('ok',false,'message','PCA submission not found.'); end if;
  if v_ps.status not in ('submitted','under_review') then
    return jsonb_build_object('ok',false,'message','This PCA is not awaiting final assessor verification.');
  end if;
  select * into v_cfg from public.course_end_requirements where course_id=v_ps.course_id;
  select * into v_review from public.pca_assessment_reviews where submission_id=v_ps.id for update;
  if not found or v_review.review_status<>'draft' or v_review.overall_score is null or v_review.critical_criteria_met is null then
    return jsonb_build_object('ok',false,'message','Complete and save the criterion-by-criterion assessor review before finalising.');
  end if;
  v_threshold:=coalesce(v_cfg.pca_minimum_score,60);
  v_max_attempts:=coalesce(v_cfg.pca_max_resubmissions,1)+1;
  if v_review.overall_score>=v_threshold and v_review.critical_criteria_met=true then
    v_outcome:='competent';
  elsif v_ps.submission_number>=v_max_attempts then
    v_outcome:='final_not_yet_competent';
  else
    v_outcome:='not_yet_competent';
  end if;
  update public.pca_assessment_reviews set
    review_status='finalised',decision=v_outcome,
    assessor_feedback=left(coalesce(p_feedback,assessor_feedback,''),8000),
    finalised_at=now(),updated_at=now(),reviewer_id=v_uid
  where id=v_review.id;
  update public.pca_submissions set
    status=v_outcome,rubric_score=v_review.overall_score,
    critical_criteria_met=v_review.critical_criteria_met,
    assessor_feedback=left(coalesce(p_feedback,v_review.assessor_feedback,''),8000),
    assessed_by=v_uid,assessed_at=now()
  where id=v_ps.id;
  insert into public.academic_audit_log(actor_id,action,entity_type,entity_id,student_id,course_id,details)
  values(v_uid,'Verified and finalised PCA assessment','pca_submission',v_ps.id,v_ps.user_id,v_ps.course_id,
    jsonb_build_object('outcome',v_outcome,'overall_score',v_review.overall_score,'critical_criteria_met',v_review.critical_criteria_met,'review_id',v_review.id));
  return jsonb_build_object(
    'ok',true,'outcome',v_outcome,'overall_score',v_review.overall_score,
    'critical_criteria_met',v_review.critical_criteria_met,
    'resubmission_available',(v_outcome='not_yet_competent' and v_ps.submission_number<v_max_attempts),
    'message',case
      when v_outcome='competent' then 'PCA verified as Competent.'
      when v_outcome='not_yet_competent' then 'PCA verified as Not Yet Competent. A resubmission may be authorised.'
      else 'PCA verified as final Not Yet Competent.' end
  );
end;
$function$;

create or replace function public.authorise_pca_resubmission(p_submission_id uuid,p_reason text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_ps public.pca_submissions%rowtype;
  v_cfg public.course_end_requirements%rowtype;
begin
  if v_uid is null or not public.is_admin() then raise exception 'Admin authorisation is required.'; end if;
  if length(trim(coalesce(p_reason,'')))<5 then return jsonb_build_object('ok',false,'message','Enter a clear resubmission reason.'); end if;
  select * into v_ps from public.pca_submissions where id=p_submission_id for update;
  if not found then return jsonb_build_object('ok',false,'message','PCA submission not found.'); end if;
  if v_ps.status<>'not_yet_competent' then
    return jsonb_build_object('ok',false,'message','A resubmission can be authorised only after a Not Yet Competent outcome.');
  end if;
  select * into v_cfg from public.course_end_requirements where course_id=v_ps.course_id;
  if v_ps.submission_number>=coalesce(v_cfg.pca_max_resubmissions,1)+1 then
    return jsonb_build_object('ok',false,'message','No further PCA resubmission is available.');
  end if;
  update public.pca_submissions set
    status='resubmission_required',
    assessor_feedback=trim(coalesce(assessor_feedback,'')||case when coalesce(assessor_feedback,'')='' then '' else E'\n\n' end||'Resubmission authorised: '||trim(p_reason)),
    updated_at=now()
  where id=v_ps.id;
  insert into public.academic_audit_log(actor_id,action,entity_type,entity_id,student_id,course_id,details)
  values(v_uid,'Authorised PCA resubmission','pca_submission',v_ps.id,v_ps.user_id,v_ps.course_id,
    jsonb_build_object('reason',trim(p_reason),'submission_number',v_ps.submission_number));
  return jsonb_build_object('ok',true,'status','resubmission_required','message','One structured PCA resubmission has been authorised.');
end;
$function$;

revoke all on function public.get_admin_pca_review_queue() from public;
revoke all on function public.get_admin_pca_review_detail(uuid) from public;
revoke all on function public.save_admin_pca_review(uuid,jsonb,text,uuid) from public;
revoke all on function public.finalise_admin_pca_review(uuid,text) from public;
revoke all on function public.authorise_pca_resubmission(uuid,text) from public;

grant execute on function public.get_admin_pca_review_queue() to authenticated;
grant execute on function public.get_admin_pca_review_detail(uuid) to authenticated;
grant execute on function public.save_admin_pca_review(uuid,jsonb,text,uuid) to authenticated;
grant execute on function public.finalise_admin_pca_review(uuid,text) to authenticated;
grant execute on function public.authorise_pca_resubmission(uuid,text) to authenticated;

revoke execute on function public.get_admin_pca_review_queue() from anon;
revoke execute on function public.get_admin_pca_review_detail(uuid) from anon;
revoke execute on function public.save_admin_pca_review(uuid,jsonb,text,uuid) from anon;
revoke execute on function public.finalise_admin_pca_review(uuid,text) from anon;
revoke execute on function public.authorise_pca_resubmission(uuid,text) from anon;
