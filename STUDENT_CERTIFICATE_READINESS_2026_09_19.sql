-- Student Certificate Readiness
-- Approved by Aziwe Futhe on 2026-09-19.
-- Read-only authenticated learner summary. Formal certificate issuance remains unchanged.

create or replace function public.get_my_certificate_readiness()
returns table(
  course_id uuid,
  course_title text,
  total_lessons bigint,
  completed_lessons bigint,
  progress_percent numeric,
  total_modules bigint,
  completed_modules bigint,
  required_assessments bigint,
  passed_assessments bigint,
  result_status text,
  academic_review_status text,
  eligible_for_issuance boolean,
  certificate_issued boolean,
  readiness_status text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $function$
  with me as (
    select auth.uid() as uid
  ),
  approved as (
    select distinct e.course_id
    from public.enrollments e
    cross join me
    left join public.students s on s.id = e.student_id
    where me.uid is not null
      and (e.student_id = me.uid or s.user_id = me.uid)
      and (
        lower(coalesce(e.enrollment_status,'')) in ('approved','active','enrolled','completed')
        or lower(coalesce(e.status,'')) in ('approved','active','enrolled','completed')
      )
  ),
  module_stats as (
    select
      a.course_id,
      cm.id as module_id,
      count(distinct l.id)::bigint as total_lessons,
      count(distinct l.id) filter (
        where exists (
          select 1
          from public.lesson_progress lp
          cross join me
          where lp.lesson_id = l.id
            and lp.student_id = me.uid
            and lp.completed = true
        )
      )::bigint as completed_lessons
    from approved a
    join public.course_modules cm on cm.course_id = a.course_id
    left join public.lessons l on l.module_id = cm.id
    group by a.course_id, cm.id
  ),
  learning as (
    select
      a.course_id,
      coalesce(sum(ms.total_lessons),0)::bigint as total_lessons,
      coalesce(sum(ms.completed_lessons),0)::bigint as completed_lessons,
      count(ms.module_id)::bigint as total_modules,
      count(ms.module_id) filter (
        where ms.total_lessons > 0
          and ms.completed_lessons = ms.total_lessons
      )::bigint as completed_modules
    from approved a
    left join module_stats ms on ms.course_id = a.course_id
    group by a.course_id
  ),
  assessment_stats as (
    select
      a.course_id,
      count(req.assessment_id)::bigint as required_assessments,
      count(req.assessment_id) filter (
        where exists (
          select 1
          from public.assessment_attempts aa
          cross join me
          where aa.assessment_id = req.assessment_id
            and aa.student_id = me.uid
            and aa.passed = true
            and aa.submitted_at is not null
        )
      )::bigint as passed_assessments
    from approved a
    left join lateral public.get_required_course_assessments(a.course_id) req on true
    group by a.course_id
  ),
  result_state as (
    select
      a.course_id,
      cr.id as result_id,
      coalesce(cr.result_status,'in_progress') as result_status,
      cr.finalised_at,
      (
        select ar.review_status
        from public.academic_result_reviews ar
        where ar.result_id = cr.id
        order by ar.reviewed_at desc nulls last, ar.created_at desc
        limit 1
      ) as academic_review_status,
      exists (
        select 1
        from public.academic_result_reviews ar
        where ar.result_id = cr.id
          and ar.review_status = 'approved'
      ) as review_approved
    from approved a
    cross join me
    left join public.course_results cr
      on cr.course_id = a.course_id
     and cr.student_id = me.uid
  ),
  final as (
    select
      a.course_id,
      c.title as course_title,
      l.total_lessons,
      l.completed_lessons,
      case
        when l.total_lessons > 0
          then round((l.completed_lessons::numeric / l.total_lessons::numeric) * 100, 1)
        else 0::numeric
      end as progress_percent,
      l.total_modules,
      l.completed_modules,
      ast.required_assessments,
      ast.passed_assessments,
      rs.result_status,
      coalesce(rs.academic_review_status,'not_started') as academic_review_status,
      (
        lower(coalesce(rs.result_status,'')) = 'passed'
        and rs.finalised_at is not null
        and rs.review_approved = true
      ) as eligible_for_issuance,
      exists (
        select 1
        from public.certificates cert
        cross join me
        where cert.student_id = me.uid
          and cert.course_id = a.course_id
          and cert.certificate_status = 'issued'
          and cert.revoked_at is null
      ) as certificate_issued
    from approved a
    join public.courses c on c.id = a.course_id
    join learning l on l.course_id = a.course_id
    join assessment_stats ast on ast.course_id = a.course_id
    join result_state rs on rs.course_id = a.course_id
  )
  select
    f.course_id,
    f.course_title,
    f.total_lessons,
    f.completed_lessons,
    f.progress_percent,
    f.total_modules,
    f.completed_modules,
    f.required_assessments,
    f.passed_assessments,
    f.result_status,
    f.academic_review_status,
    f.eligible_for_issuance,
    f.certificate_issued,
    case
      when f.certificate_issued then 'Certificate issued'
      when f.eligible_for_issuance then 'Requirements completed — awaiting formal issuance'
      when lower(coalesce(f.result_status,'')) = 'passed'
        and f.academic_review_status in ('pending','not_started')
        then 'Course complete — academic review pending'
      when lower(coalesce(f.result_status,'')) = 'failed'
        then 'Assessment requirements not met'
      when f.total_lessons > 0
        and f.completed_lessons = f.total_lessons
        and f.required_assessments > 0
        and f.passed_assessments = f.required_assessments
        then 'Learning requirements complete — final academic review pending'
      else 'In progress'
    end as readiness_status
  from final f
  order by f.course_title;
$function$;

revoke all on function public.get_my_certificate_readiness() from public;
grant execute on function public.get_my_certificate_readiness() to authenticated;

comment on function public.get_my_certificate_readiness() is
'Returns certificate-readiness summary only for the currently authenticated learner and approved courses. Formal issuance remains controlled by the Academy certificate workflow.';
