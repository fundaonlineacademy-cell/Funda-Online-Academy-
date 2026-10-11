-- Funda Online Academy
-- PCA Evidence Upload & Submission Controls
-- 11 October 2026
-- Owner-approved protected change.

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'pca-evidence',
  'pca-evidence',
  false,
  52428800,
  array[
    'image/jpeg','image/png','image/webp','application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain','video/mp4'
  ]::text[]
)
on conflict (id) do update
set public=false,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

-- Learners may not create arbitrary PCA attempts directly. Draft creation is server-controlled.
drop policy if exists "Students create eligible PCA submissions" on public.pca_submissions;

drop policy if exists "Students upload own PCA evidence" on storage.objects;
create policy "Students upload own PCA evidence"
on storage.objects for insert to authenticated
with check (
  bucket_id='pca-evidence'
  and not public.is_internal_qa_account()
  and (storage.foldername(name))[1]=auth.uid()::text
  and exists(
    select 1 from public.pca_submissions ps
    where ps.user_id=auth.uid()
      and ps.status='draft'
      and ps.course_id::text=(storage.foldername(objects.name))[2]
      and ps.id::text=(storage.foldername(objects.name))[3]
  )
);

drop policy if exists "Students read own PCA evidence" on storage.objects;
create policy "Students read own PCA evidence"
on storage.objects for select to authenticated
using (
  bucket_id='pca-evidence'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists "Students update own draft PCA evidence" on storage.objects;
create policy "Students update own draft PCA evidence"
on storage.objects for update to authenticated
using (
  bucket_id='pca-evidence'
  and (storage.foldername(name))[1]=auth.uid()::text
  and exists(
    select 1 from public.pca_submissions ps
    where ps.user_id=auth.uid()
      and ps.status='draft'
      and ps.course_id::text=(storage.foldername(objects.name))[2]
      and ps.id::text=(storage.foldername(objects.name))[3]
  )
)
with check (
  bucket_id='pca-evidence'
  and (storage.foldername(name))[1]=auth.uid()::text
  and exists(
    select 1 from public.pca_submissions ps
    where ps.user_id=auth.uid()
      and ps.status='draft'
      and ps.course_id::text=(storage.foldername(objects.name))[2]
      and ps.id::text=(storage.foldername(objects.name))[3]
  )
);

drop policy if exists "Students delete own draft PCA evidence" on storage.objects;
create policy "Students delete own draft PCA evidence"
on storage.objects for delete to authenticated
using (
  bucket_id='pca-evidence'
  and (storage.foldername(name))[1]=auth.uid()::text
  and exists(
    select 1 from public.pca_submissions ps
    where ps.user_id=auth.uid()
      and ps.status='draft'
      and ps.course_id::text=(storage.foldername(objects.name))[2]
      and ps.id::text=(storage.foldername(objects.name))[3]
  )
);

drop policy if exists "Admins manage PCA evidence" on storage.objects;
create policy "Admins manage PCA evidence"
on storage.objects for all to authenticated
using (bucket_id='pca-evidence' and public.is_admin())
with check (bucket_id='pca-evidence' and public.is_admin());

create or replace function public.prepare_pca_submission(p_course_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','storage','pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_sid uuid;
  v_cfg public.course_end_requirements%rowtype;
  v_enrolled boolean:=false;
  v_passed boolean:=false;
  v_latest public.pca_submissions%rowtype;
  v_new public.pca_submissions%rowtype;
  v_next_no integer:=1;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'message','Please sign in to continue.'); end if;
  if p_course_id is null then return jsonb_build_object('ok',false,'message','No course was selected.'); end if;
  if public.is_internal_qa_account() then
    return jsonb_build_object('ok',true,'qa_preview',true,'message','Internal QA preview does not create a learner PCA submission.');
  end if;

  select id into v_sid from public.students where user_id=v_uid order by created_at desc nulls last limit 1;
  select exists(
    select 1 from public.enrollments e left join public.students s on s.id=e.student_id
    where e.course_id=p_course_id
      and (e.student_id=v_uid or e.student_id=v_sid or s.user_id=v_uid)
      and (lower(coalesce(e.enrollment_status,'')) in ('approved','active','enrolled','completed') or lower(coalesce(e.status,'')) in ('approved','active','enrolled','completed'))
  ) into v_enrolled;
  if not v_enrolled then return jsonb_build_object('ok',false,'message','Approved course access was not found for this account.'); end if;

  select * into v_cfg from public.course_end_requirements where course_id=p_course_id;
  if not found or not v_cfg.pca_required then return jsonb_build_object('ok',false,'message','This course does not require a Practical Competence Assessment.'); end if;
  if v_cfg.pca_task_status<>'active' then return jsonb_build_object('ok',false,'message','The PCA task is not yet open for learner submission.'); end if;

  select exists(
    select 1 from public.assessment_attempts aa
    join public.assessments a on a.id=aa.assessment_id
    where a.course_id=p_course_id and a.module_id=v_cfg.final_module_id
      and coalesce(a.active,true)=true
      and lower(coalesce(a.status,'published')) in ('published','active')
      and lower(coalesce(a.title,'')) like '%summative%'
      and (aa.student_id=v_uid or aa.student_id=v_sid)
      and aa.passed=true
  ) into v_passed;
  if not v_passed then return jsonb_build_object('ok',false,'message','Pass the final Summative Assessment before starting the PCA evidence submission.'); end if;

  select * into v_latest
  from public.pca_submissions
  where course_id=p_course_id and user_id=v_uid
  order by submission_number desc,created_at desc
  limit 1;

  if found then
    if v_latest.status='draft' then
      return jsonb_build_object('ok',true,'submission_id',v_latest.id,'submission_number',v_latest.submission_number,'status',v_latest.status,'evidence',v_latest.evidence,'learner_declaration',v_latest.learner_declaration);
    end if;
    if v_latest.status='resubmission_required' then
      v_next_no:=v_latest.submission_number+1;
      if v_next_no>v_cfg.pca_max_resubmissions+1 then
        return jsonb_build_object('ok',false,'message','No further PCA resubmission is available.');
      end if;
    else
      return jsonb_build_object('ok',true,'read_only',true,'submission_id',v_latest.id,'submission_number',v_latest.submission_number,'status',v_latest.status,'evidence',v_latest.evidence,'learner_declaration',v_latest.learner_declaration);
    end if;
  end if;

  insert into public.pca_submissions(course_id,final_module_id,user_id,submission_number,status,evidence,learner_declaration)
  values(p_course_id,v_cfg.final_module_id,v_uid,v_next_no,'draft',jsonb_build_object('files','[]'::jsonb,'notes',''),false)
  returning * into v_new;

  return jsonb_build_object('ok',true,'submission_id',v_new.id,'submission_number',v_new.submission_number,'status',v_new.status,'evidence',v_new.evidence,'learner_declaration',v_new.learner_declaration);
end;
$function$;

create or replace function public.guard_student_pca_draft_update()
returns trigger
language plpgsql
set search_path to 'public','pg_temp'
as $function$
declare
  v_files jsonb;
begin
  if current_user='authenticated' and not public.is_admin() then
    if public.is_internal_qa_account() then
      raise exception 'Internal QA preview is view-only.';
    end if;
    if old.user_id<>auth.uid() or old.status<>'draft' or new.status<>'draft' then
      raise exception 'Only your own Draft PCA can be edited.';
    end if;
    if new.id is distinct from old.id
       or new.course_id is distinct from old.course_id
       or new.final_module_id is distinct from old.final_module_id
       or new.user_id is distinct from old.user_id
       or new.submission_number is distinct from old.submission_number
       or new.rubric_score is distinct from old.rubric_score
       or new.critical_criteria_met is distinct from old.critical_criteria_met
       or new.assessor_feedback is distinct from old.assessor_feedback
       or new.assessed_by is distinct from old.assessed_by
       or new.submitted_at is distinct from old.submitted_at
       or new.assessed_at is distinct from old.assessed_at
       or new.created_at is distinct from old.created_at then
      raise exception 'Protected PCA fields cannot be changed by a learner.';
    end if;
    if jsonb_typeof(coalesce(new.evidence,'{}'::jsonb))<>'object' then
      raise exception 'PCA evidence must use the approved evidence structure.';
    end if;
    v_files:=coalesce(new.evidence->'files','[]'::jsonb);
    if jsonb_typeof(v_files)<>'array' then raise exception 'PCA evidence files must be an array.'; end if;
    if jsonb_array_length(v_files)>20 then raise exception 'A maximum of 20 evidence files is allowed per PCA submission.'; end if;
    if length(coalesce(new.evidence->>'notes',''))>3000 then raise exception 'PCA evidence notes may not exceed 3000 characters.'; end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_guard_student_pca_draft_update on public.pca_submissions;
create trigger trg_guard_student_pca_draft_update
before update on public.pca_submissions
for each row execute function public.guard_student_pca_draft_update();

create or replace function public.submit_pca_submission(p_submission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public','storage','pg_temp'
as $function$
declare
  v_uid uuid:=auth.uid();
  v_ps public.pca_submissions%rowtype;
  v_cfg public.course_end_requirements%rowtype;
  v_files jsonb;
  v_file_count integer:=0;
  v_distinct_count integer:=0;
  v_valid_count integer:=0;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'message','Please sign in to continue.'); end if;
  if public.is_internal_qa_account() then return jsonb_build_object('ok',false,'qa_preview',true,'message','Internal QA preview is view-only. No PCA submission was recorded.'); end if;

  select * into v_ps from public.pca_submissions where id=p_submission_id and user_id=v_uid for update;
  if not found then return jsonb_build_object('ok',false,'message','The PCA draft could not be found.'); end if;
  if v_ps.status<>'draft' then return jsonb_build_object('ok',false,'message','Only a draft PCA can be submitted.'); end if;

  select * into v_cfg from public.course_end_requirements where course_id=v_ps.course_id;
  if not found or not v_cfg.pca_required or v_cfg.pca_task_status<>'active' then return jsonb_build_object('ok',false,'message','The PCA is not currently open for submission.'); end if;
  if not v_ps.learner_declaration then return jsonb_build_object('ok',false,'message','Confirm the learner declaration before submitting your PCA.'); end if;
  if jsonb_typeof(coalesce(v_ps.evidence,'{}'::jsonb))<>'object' then return jsonb_build_object('ok',false,'message','The PCA evidence structure is invalid.'); end if;
  if length(coalesce(v_ps.evidence->>'notes',''))>3000 then return jsonb_build_object('ok',false,'message','PCA evidence notes may not exceed 3000 characters.'); end if;

  v_files:=coalesce(v_ps.evidence->'files','[]'::jsonb);
  if jsonb_typeof(v_files)<>'array' then return jsonb_build_object('ok',false,'message','The PCA evidence file list is invalid.'); end if;
  v_file_count:=jsonb_array_length(v_files);
  if v_file_count<1 then return jsonb_build_object('ok',false,'message','Upload at least one evidence file before submitting the PCA.'); end if;
  if v_file_count>20 then return jsonb_build_object('ok',false,'message','A maximum of 20 evidence files is allowed per PCA submission.'); end if;

  select count(distinct f->>'path') into v_distinct_count
  from jsonb_array_elements(v_files) f
  where coalesce(f->>'path','')<>'';
  if v_distinct_count<>v_file_count then return jsonb_build_object('ok',false,'message','Each PCA evidence file must be unique and have a valid storage path.'); end if;

  select count(*) into v_valid_count
  from jsonb_array_elements(v_files) f
  where coalesce(f->>'path','')<>''
    and exists(
      select 1 from storage.objects o
      where o.bucket_id='pca-evidence'
        and o.name=f->>'path'
        and (storage.foldername(o.name))[1]=v_uid::text
        and (storage.foldername(o.name))[2]=v_ps.course_id::text
        and (storage.foldername(o.name))[3]=v_ps.id::text
    );
  if v_valid_count<>v_file_count then return jsonb_build_object('ok',false,'message','One or more evidence files could not be verified. Reopen the draft and upload the missing file again.'); end if;

  update public.pca_submissions
  set status='submitted',submitted_at=now(),updated_at=now()
  where id=v_ps.id;

  return jsonb_build_object('ok',true,'submission_id',v_ps.id,'status','submitted','message','Your PCA evidence has been submitted for assessment.');
end;
$function$;

revoke all on function public.prepare_pca_submission(uuid) from public,anon;
revoke all on function public.submit_pca_submission(uuid) from public,anon;
grant execute on function public.prepare_pca_submission(uuid) to authenticated,service_role;
grant execute on function public.submit_pca_submission(uuid) to authenticated,service_role;
