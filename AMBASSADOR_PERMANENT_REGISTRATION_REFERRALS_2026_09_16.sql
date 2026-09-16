-- Funda Online Academy
-- Permanent Ambassador referral ownership from new student-account registration
-- Production migration applied 2026-09-16.
--
-- Business rules:
-- 1. A referral is created only while a genuinely new student account is being created.
-- 2. Existing Academy accounts cannot be newly claimed by an Ambassador link.
-- 3. The first valid Ambassador attribution for a student user is permanent.
-- 4. Registration itself is R0; only verified qualifying payments create earnings/rank progress.
-- 5. Future qualifying payments by the same referred learner remain tied to the original Ambassador.

begin;

create or replace function public.claim_ambassador_v2_referral(
  p_code text,
  p_source_page text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_app uuid;
  v_uid uuid := auth.uid();
  v_existing uuid;
  v_created_at timestamptz;
  v_email text;
begin
  if v_uid is null then return false; end if;

  select r.application_id into v_existing
    from public.ambassador_v2_referrals r
   where r.student_user_id = v_uid
   limit 1;

  if v_existing is not null then
    select a.id into v_app
      from public.ambassador_programme_applications a
     where a.id = v_existing
       and upper(a.referral_code) = upper(trim(coalesce(p_code,'')))
     limit 1;
    return v_app is not null;
  end if;

  select u.created_at, lower(u.email)
    into v_created_at, v_email
    from auth.users u
   where u.id = v_uid;

  -- Internal anti-misattribution safeguard only. This is not an expiry on a
  -- valid referral: once the row exists, the ownership relationship is permanent.
  if v_created_at is null or v_created_at < now() - interval '15 minutes' then
    return false;
  end if;

  if not exists(
    select 1 from public.profiles p
     where p.id = v_uid and p.role = 'student'
  ) then
    return false;
  end if;

  select a.id into v_app
    from public.ambassador_programme_applications a
   where upper(a.referral_code) = upper(trim(coalesce(p_code,'')))
     and a.status = 'approved'
     and a.account_status in ('introductory','active')
     and a.auth_user_id is distinct from v_uid
     and lower(coalesce(a.email,'')) <> coalesce(v_email,'')
   limit 1;

  if v_app is null then return false; end if;

  insert into public.ambassador_v2_referrals(
    application_id,
    student_user_id,
    referral_code,
    source_page,
    eligibility_status
  ) values (
    v_app,
    v_uid,
    upper(trim(p_code)),
    left(coalesce(p_source_page,'student-account-registration'),500),
    'recorded'
  )
  on conflict(student_user_id) do nothing;

  return found;
end;
$$;

revoke all on function public.claim_ambassador_v2_referral(text,text) from public;
grant execute on function public.claim_ambassador_v2_referral(text,text) to authenticated;

create or replace function public.get_own_ambassador_referrals()
returns table(
  referral_id uuid,
  student_display text,
  course_title text,
  referral_date timestamptz,
  referral_status text,
  earning_status text,
  earning_amount numeric
)
language sql
security definer
set search_path = ''
as $$
  with mine as (
    select a.id application_id
      from public.ambassador_programme_applications a
     where a.auth_user_id = auth.uid()
       and a.status = 'approved'
     limit 1
  )
  select r.id,
         case
           when coalesce(p.full_name,'') = '' then 'Referred student'
           when array_length(regexp_split_to_array(trim(p.full_name),'\s+'),1) = 1
             then split_part(trim(p.full_name),' ',1)
           else split_part(trim(p.full_name),' ',1)||' '||
             left((regexp_split_to_array(trim(p.full_name),'\s+'))[
               array_length(regexp_split_to_array(trim(p.full_name),'\s+'),1)
             ],1)||'.'
         end as student_display,
         coalesce(latest_enrolment.course_title,'Course not yet selected') as course_title,
         r.claimed_at,
         case
           when r.eligibility_status = 'disqualified' then 'disqualified'
           when latest_enrolment.enrolment_id is null then 'registered'
           when latest_enrolment.is_approved then 'student_approved'
           else 'enrolment_pending'
         end as referral_status,
         case
           when r.eligibility_status = 'disqualified' then 'disqualified'
           when coalesce(confirmed.amount,0) > 0 then 'confirmed'
           else 'not_yet_earned'
         end as earning_status,
         coalesce(confirmed.amount,0)::numeric as earning_amount
    from public.ambassador_v2_referrals r
    join mine m on m.application_id = r.application_id
    left join public.profiles p on p.id = r.student_user_id
    left join lateral (
      select e.id enrolment_id,
             c.title course_title,
             (
               lower(coalesce(e.enrollment_status,e.status,'')) = 'approved'
               and e.reviewed_at is not null
               and exists(select 1 from public.profiles er where er.id=e.reviewed_by and er.role='admin')
             ) is_approved
        from public.enrollments e
        left join public.courses c on c.id = e.course_id
       where e.student_id = r.student_user_id
       order by coalesce(e.submitted_at,e.enrolled_at,e.created_at) desc nulls last
       limit 1
    ) latest_enrolment on true
    left join lateral (
      select coalesce(sum(l.commission_amount),0) amount
        from public.ambassador_earnings_ledger l
        join public.enrollments e on e.id = l.enrolment_id and e.student_id = r.student_user_id
       where l.application_id = r.application_id
         and l.earning_type = 'commission'
         and l.earning_status in ('approved','paid')
         and public.ambassador_v2_payment_is_eligible(l.payment_id)
    ) confirmed on true
   order by r.claimed_at desc;
$$;

revoke all on function public.get_own_ambassador_referrals() from public;
grant execute on function public.get_own_ambassador_referrals() to authenticated;

commit;
