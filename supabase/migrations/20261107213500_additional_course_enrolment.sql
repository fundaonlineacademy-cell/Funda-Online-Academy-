-- Additive continuing-student checkout entry points.
-- Existing onboarding, legacy-benefit verification, combined checkout, approval,
-- payment allocation and academic-progress functions remain unchanged.

create or replace function course_checkout_private.prepare_additional(
 p_course_ids uuid[], p_existing_checkout_id uuid default null
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid();
 v_quote jsonb; v_checkout_id uuid;
begin
 if not exists(
  select 1 from public.enrollments e
  where e.student_id=v_uid
  and (e.submitted_at is not null
   or pg_catalog.lower(coalesce(e.enrollment_status,e.status,'')) in ('approved','active','enrolled','completed'))
 ) then
  raise exception 'Submit your first course application before applying for additional courses.' using errcode='42501';
 end if;
 v_quote:=course_checkout_private.prepare(p_course_ids,'{}'::jsonb,p_existing_checkout_id);
 if v_quote->>'status'<>'draft' then return v_quote; end if;
 v_checkout_id:=(v_quote->>'id')::uuid;
 update public.course_checkout_items i
 set student_category='continuing_student'
 where i.checkout_id=v_checkout_id
  and i.legacy_claim_id is null
  and exists(
    select 1 from public.course_checkouts c
    where c.id=i.checkout_id and c.student_user_id=v_uid and c.status='draft'
  );
 return course_checkout_private.receipt(v_checkout_id);
end $$;

create or replace function course_checkout_private.submit_additional(
 p_checkout_id uuid,p_amount numeric,p_payment_method text,p_payment_reference text,
 p_proof_path text,p_payment_option text
) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=course_checkout_private.student_uid();
 v_count integer;v_correct integer;
begin
 if not exists(
  select 1 from public.enrollments e where e.student_id=v_uid
  and (e.submitted_at is not null
   or pg_catalog.lower(coalesce(e.enrollment_status,e.status,'')) in ('approved','active','enrolled','completed'))
 ) then
  raise exception 'This account has no existing submitted course application.' using errcode='42501';
 end if;
 if not exists(
  select 1 from public.course_checkouts c
  where c.id=p_checkout_id and c.student_user_id=v_uid
 ) then
  raise exception 'This checkout does not belong to your student account.' using errcode='42501';
 end if;
 select count(*),
        count(*) filter(where i.student_category='continuing_student' and i.legacy_claim_id is null)
 into v_count,v_correct
 from public.course_checkout_items i where i.checkout_id=p_checkout_id;
 if v_count=0 or v_count<>v_correct then
  raise exception 'Please confirm your additional course fees before payment.';
 end if;
 return course_checkout_private.submit(
  p_checkout_id,p_amount,p_payment_method,p_payment_reference,p_proof_path,p_payment_option
 );
end $$;

revoke all on function course_checkout_private.prepare_additional(uuid[],uuid) from public,anon,authenticated;
revoke all on function course_checkout_private.submit_additional(uuid,numeric,text,text,text,text) from public,anon,authenticated;
grant execute on function course_checkout_private.prepare_additional(uuid[],uuid) to authenticated;
grant execute on function course_checkout_private.submit_additional(uuid,numeric,text,text,text,text) to authenticated;

create or replace function public.prepare_additional_course_checkout(
 p_course_ids uuid[], p_existing_checkout_id uuid default null
) returns jsonb language sql security invoker set search_path='' as $$
 select course_checkout_private.prepare_additional(p_course_ids,p_existing_checkout_id);
$$;

create or replace function public.submit_additional_course_checkout(
 p_checkout_id uuid,p_amount numeric,p_payment_method text,p_payment_reference text,
 p_proof_path text,p_payment_option text
) returns jsonb language sql security invoker set search_path='' as $$
 select course_checkout_private.submit_additional(
  p_checkout_id,p_amount,p_payment_method,p_payment_reference,p_proof_path,p_payment_option
 );
$$;

revoke all on function public.prepare_additional_course_checkout(uuid[],uuid) from public,anon,authenticated;
revoke all on function public.submit_additional_course_checkout(uuid,numeric,text,text,text,text) from public,anon,authenticated;
grant execute on function public.prepare_additional_course_checkout(uuid[],uuid) to authenticated;
grant execute on function public.submit_additional_course_checkout(uuid,numeric,text,text,text,text) to authenticated;
