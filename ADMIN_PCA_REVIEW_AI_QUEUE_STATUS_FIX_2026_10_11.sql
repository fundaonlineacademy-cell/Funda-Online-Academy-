-- FOA Admin PCA AI queue status clarification
-- Completed/finalised PCA outcomes no longer count as still requiring manual AI review in the queue summary.
-- The underlying AI pre-assessment record continues to preserve manual_review_required=true as a governance fact.

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
      'ai_manual_review_required',case
        when ps.status in ('submitted','under_review') then coalesce(ai.manual_review_required,true)
        else false
      end,
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
      where a.submission_id=ps.id
      order by a.created_at desc
      limit 1
    ) ai on true
    left join public.pca_assessment_reviews rv on rv.submission_id=ps.id
    where ps.status in ('submitted','under_review','not_yet_competent','resubmission_required','competent','final_not_yet_competent')
  ) q;
  return jsonb_build_object('ok',true,'items',v_result);
end;
$function$;

revoke all on function public.get_admin_pca_review_queue() from public;
grant execute on function public.get_admin_pca_review_queue() to authenticated;
revoke execute on function public.get_admin_pca_review_queue() from anon;
