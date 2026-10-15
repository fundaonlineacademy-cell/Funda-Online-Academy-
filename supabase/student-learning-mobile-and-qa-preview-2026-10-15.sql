-- Owner-authorised Student learning correction, 15 October 2026.
-- 1. Reword Bookkeeping post-activity disclosure labels without changing their guidance.
-- 2. Let internal QA accounts complete a scored, non-recording module-assessment preview.

begin;

do $$
declare
  v_case_labels integer;
  v_practical_labels integer;
begin
  select
    count(*) filter (where l.case_study like '%View model thinking after you attempt the case%'),
    count(*) filter (where l.practical_activity like '%Reveal model guidance after completing your attempt%')
  into v_case_labels, v_practical_labels
  from public.lessons l
  join public.course_modules m on m.id=l.module_id
  where m.course_id='fcbe0c39-c31f-4a39-833f-7b89d553bef2'::uuid;

  if v_case_labels<>40 or v_practical_labels<>39 then
    raise exception 'Bookkeeping guidance-label guard failed: case %, expected 40; practical %, expected 39',
      v_case_labels, v_practical_labels;
  end if;
end $$;

insert into private.academic_content_snapshots (
  course_id,
  scope,
  standard_versions,
  snapshot
)
select
  'fcbe0c39-c31f-4a39-833f-7b89d553bef2'::uuid,
  'bookkeeping-post-activity-guidance-labels-before-2026-10-15',
  'Owner mobile review, 15 October 2026; Bookkeeping academic remediation, 14 October 2026',
  jsonb_build_object(
    'captured_at',now(),
    'lessons',jsonb_agg(
      jsonb_build_object(
        'lesson_id',l.id,
        'module_number',m.module_number,
        'lesson_number',l.lesson_number,
        'case_study',l.case_study,
        'practical_activity',l.practical_activity
      ) order by m.module_number,l.lesson_number
    )
  )
from public.lessons l
join public.course_modules m on m.id=l.module_id
where m.course_id='fcbe0c39-c31f-4a39-833f-7b89d553bef2'::uuid
  and (
    l.case_study like '%View model thinking after you attempt the case%'
    or l.practical_activity like '%Reveal model guidance after completing your attempt%'
  );

update public.lessons l
set
  case_study=replace(
    l.case_study,
    'View model thinking after you attempt the case',
    'Compare with a suggested response'
  ),
  practical_activity=replace(
    l.practical_activity,
    'Reveal model guidance after completing your attempt',
    'View guidance after completing the activity'
  ),
  updated_at=now()
from public.course_modules m
where m.id=l.module_id
  and m.course_id='fcbe0c39-c31f-4a39-833f-7b89d553bef2'::uuid
  and (
    l.case_study like '%View model thinking after you attempt the case%'
    or l.practical_activity like '%Reveal model guidance after completing your attempt%'
  );

create or replace function public.submit_module_assessment(
  p_course_id uuid,
  p_module_number integer,
  p_assessment_type text,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_type text:=lower(trim(coalesce(p_assessment_type,'')));
  v_module_id uuid;
  v_assessment public.assessments%rowtype;
  v_formative_id uuid;
  v_attempts integer:=0;
  v_limit integer;
  v_bank_count integer:=0;
  v_answered integer:=0;
  v_correct integer:=0;
  v_percentage numeric(5,2);
  v_passed boolean;
  v_attempt_no integer;
  v_enrolled boolean:=false;
  v_total_lessons integer:=0;
  v_completed_lessons integer:=0;
  v_qa boolean:=false;
  v_seed text;
begin
  if v_uid is null then
    return jsonb_build_object('ok',false,'status','unauthenticated','message','Please sign in to continue.');
  end if;
  if v_type not in ('formative','summative') then
    return jsonb_build_object('ok',false,'status','invalid_type','message','Assessment type must be formative or summative.');
  end if;

  v_qa:=public.is_internal_qa_account();

  select exists(
    select 1
    from public.enrollments e
    left join public.students s on s.id=e.student_id
    where e.course_id=p_course_id
      and (e.student_id=v_uid or s.user_id=v_uid)
      and (
        lower(coalesce(e.enrollment_status,'')) in ('approved','completed')
        or lower(coalesce(e.status,'')) in ('approved','completed')
      )
  ) into v_enrolled;

  if not v_enrolled then
    return jsonb_build_object('ok',false,'status','not_enrolled','message','An approved enrolment is required.');
  end if;

  select id into v_module_id
  from public.course_modules
  where course_id=p_course_id and module_number=p_module_number
  limit 1;

  if v_module_id is null then
    return jsonb_build_object('ok',false,'status','module_not_found','message','Module not found.');
  end if;

  select * into v_assessment
  from public.assessments
  where course_id=p_course_id
    and module_id=v_module_id
    and active=true
    and lower(coalesce(status,'')) in ('published','active')
    and lower(title) like '%'||v_type||'%'
  order by created_at desc
  limit 1;

  if v_assessment.id is null then
    return jsonb_build_object('ok',false,'status','assessment_not_found','message','Assessment is not available.');
  end if;

  select count(*) into v_total_lessons
  from public.lessons
  where module_id=v_module_id;

  select count(*) into v_completed_lessons
  from public.lesson_progress lp
  join public.lessons l on l.id=lp.lesson_id
  left join public.students s on s.id=lp.student_id
  where l.module_id=v_module_id
    and lp.completed=true
    and (lp.student_id=v_uid or s.user_id=v_uid);

  if not v_qa and v_total_lessons>0 and v_completed_lessons<v_total_lessons then
    return jsonb_build_object('ok',false,'status','locked_lessons','message','Complete all module lessons before submitting the assessment.','completed_lessons',v_completed_lessons,'total_lessons',v_total_lessons);
  end if;

  if not v_qa and v_type='summative' then
    select id into v_formative_id
    from public.assessments
    where course_id=p_course_id
      and module_id=v_module_id
      and active=true
      and lower(coalesce(status,'')) in ('published','active')
      and lower(title) like '%formative%'
    order by created_at desc
    limit 1;
    if v_formative_id is not null
       and not exists(
         select 1 from public.assessment_attempts
         where student_id=v_uid and assessment_id=v_formative_id and passed=true
       ) then
      return jsonb_build_object('ok',false,'status','locked_formative','message','Pass the formative assessment first.');
    end if;
  end if;

  select count(*) into v_attempts
  from public.assessment_attempts
  where student_id=v_uid and assessment_id=v_assessment.id;

  if not v_qa and exists(
    select 1 from public.assessment_attempts
    where student_id=v_uid and assessment_id=v_assessment.id and passed=true
  ) then
    return jsonb_build_object('ok',false,'status','already_passed','message','This assessment has already been passed.');
  end if;
  if not v_qa and v_attempts>=3 then
    return jsonb_build_object('ok',false,'status','exhausted','message','All three permitted attempts have been used.');
  end if;

  v_attempt_no:=case when v_qa then null else v_attempts+1 end;
  v_seed:=case when v_qa then 'qa-preview' else v_attempt_no::text end;
  v_limit:=case when v_type='formative' then 15 else 25 end;

  select count(*) into v_bank_count
  from public.assessment_questions
  where assessment_id=v_assessment.id;

  if v_bank_count<v_limit then
    return jsonb_build_object(
      'ok',false,
      'status','configuration_error',
      'required_bank_size',v_limit,
      'available_bank_size',v_bank_count,
      'message','This assessment cannot be submitted because its question bank is incomplete. Please contact Funda Online Academy.'
    );
  end if;

  with chosen as (
    select q.id,q.correct_answer
    from public.assessment_questions q
    where q.assessment_id=v_assessment.id
    order by md5(q.id::text||v_uid::text||v_seed)
    limit v_limit
  )
  select
    count(*) filter(where upper(coalesce(p_answers->>id::text,'')) in ('A','B','C','D')),
    count(*) filter(where upper(coalesce(p_answers->>id::text,''))=upper(correct_answer))
  into v_answered,v_correct
  from chosen;

  if v_answered<>v_limit then
    return jsonb_build_object('ok',false,'status','incomplete','message','Answer every question before submitting.','answered',v_answered,'required',v_limit);
  end if;

  v_percentage:=round((v_correct::numeric/v_limit::numeric)*100,2);
  v_passed:=v_percentage>=70;

  if v_qa then
    return jsonb_build_object(
      'ok',true,
      'status','qa_preview',
      'qa_mode',true,
      'recorded',false,
      'assessment_id',v_assessment.id,
      'attempt_number',null,
      'correct_answers',v_correct,
      'total_questions',v_limit,
      'percentage',v_percentage,
      'passed',v_passed,
      'message','QA preview completed. No learner assessment attempt was recorded.'
    );
  end if;

  insert into public.assessment_attempts(
    assessment_id,student_id,attempt_number,score,total_marks,percentage,passed,submitted_at
  ) values(
    v_assessment.id,v_uid,v_attempt_no,v_correct,v_limit,v_percentage,v_passed,now()
  );

  return jsonb_build_object(
    'ok',true,
    'status',case when v_passed then 'passed' when v_attempt_no>=3 then 'exhausted' else 'retry' end,
    'qa_mode',false,
    'recorded',true,
    'assessment_id',v_assessment.id,'attempt_number',v_attempt_no,
    'correct_answers',v_correct,'total_questions',v_limit,
    'percentage',v_percentage,'passed',v_passed,
    'attempts_remaining',greatest(0,3-v_attempt_no),
    'message',case when v_passed then 'Assessment passed.' when v_attempt_no>=3 then 'Final permitted attempt recorded.' else 'Review the lessons before the next attempt.' end
  );
exception when unique_violation then
  return jsonb_build_object('ok',false,'status','duplicate_submission','message','This attempt was already submitted. Refresh to view the recorded result.');
end;
$function$;

revoke all on function public.submit_module_assessment(uuid,integer,text,jsonb) from public,anon;
grant execute on function public.submit_module_assessment(uuid,integer,text,jsonb) to authenticated,service_role;

commit;
