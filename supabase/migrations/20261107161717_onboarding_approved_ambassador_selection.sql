-- Deliberate first-application ambassador choice; existing link-claim and earning rules stay intact.
alter table public.students add column if not exists heard_about_ambassador_id uuid
  references public.ambassador_programme_applications(id) on delete set null;
create index if not exists students_heard_about_ambassador_idx
  on public.students(heard_about_ambassador_id) where heard_about_ambassador_id is not null;

create schema if not exists onboarding_referral_private;
revoke all on schema onboarding_referral_private from public, anon;
grant usage on schema onboarding_referral_private to authenticated;

create or replace function onboarding_referral_private.directory()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_directory jsonb;
  v_linked jsonb;
  v_selected uuid;
begin
  if v_uid is null or not public.ambassador_v2_student_account_is_active(v_uid) then
    raise exception 'Please sign in with your student account.' using errcode = '42501';
  end if;

  select jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', left(a.full_name,160),
    'handles', coalesce((select jsonb_agg(jsonb_build_object(
      'platform',left(btrim(p.item->>'platform'),40),
      'handle',left(btrim(p.item->>'handle'),120)) order by p.ord)
      from jsonb_array_elements(case when jsonb_typeof(a.platforms)='array' then a.platforms else '[]'::jsonb end)
        with ordinality as p(item,ord)
      where nullif(btrim(p.item->>'handle'),'') is not null),'[]'::jsonb)
    ) order by lower(a.full_name),a.id) into v_directory
  from public.ambassador_programme_applications a
  where a.status='approved'
    and coalesce(a.account_status,'application') not in ('suspended','closed','deleted')
    and not exists(select 1 from public.ceo_account_control_state c where c.user_id=a.auth_user_id and c.status='deleted')
    and not exists(select 1 from auth.users u where u.id=a.auth_user_id and u.deleted_at is not null);

  -- Only this caller's permanent attribution may appear outside the approved directory.
  select jsonb_build_object('id',a.id,'name',left(a.full_name,160),
    'handles',coalesce((select jsonb_agg(jsonb_build_object(
      'platform',left(btrim(p.item->>'platform'),40),'handle',left(btrim(p.item->>'handle'),120)) order by p.ord)
      from jsonb_array_elements(case when jsonb_typeof(a.platforms)='array' then a.platforms else '[]'::jsonb end)
        with ordinality as p(item,ord)
      where nullif(btrim(p.item->>'handle'),'') is not null),'[]'::jsonb)) into v_linked
  from public.ambassador_v2_referrals r
  join public.ambassador_programme_applications a on a.id=r.application_id
  where r.student_user_id=v_uid;

  select s.heard_about_ambassador_id into v_selected from public.students s where s.user_id=v_uid;
  return jsonb_build_object('ambassadors',coalesce(v_directory,'[]'::jsonb),'selected_id',v_selected,'linked',v_linked);
end;
$$;

create or replace function onboarding_referral_private.save_choice(p_application_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_student_id uuid;
  v_existing uuid;
  v_app public.ambassador_programme_applications%rowtype;
  v_email text;
begin
  if v_uid is null or not public.ambassador_v2_student_account_is_active(v_uid) then
    raise exception 'Please sign in with your student account.' using errcode = '42501';
  end if;
  select s.id into v_student_id from public.students s where s.user_id=v_uid for update;
  if v_student_id is null then raise exception 'Your student record could not be found.'; end if;
  select r.application_id into v_existing from public.ambassador_v2_referrals r where r.student_user_id=v_uid;
  if v_existing is not null and p_application_id is distinct from v_existing then
    raise exception 'Your account is already linked to an ambassador. Please refresh the ambassador list.';
  end if;
  if p_application_id is null then raise exception 'Please select the ambassador / influencer who referred you.'; end if;

  select * into v_app from public.ambassador_programme_applications a where a.id=p_application_id for share;
  if v_app.id is null then raise exception 'Please select an approved ambassador / influencer from the list.'; end if;
  if v_existing is null and (v_app.status is distinct from 'approved'
    or coalesce(v_app.account_status,'application') in ('suspended','closed','deleted')
    or exists(select 1 from public.ceo_account_control_state c where c.user_id=v_app.auth_user_id and c.status='deleted')
    or exists(select 1 from auth.users u where u.id=v_app.auth_user_id and u.deleted_at is not null)) then
    raise exception 'This ambassador is no longer available. Please refresh the list and select again.';
  end if;
  select lower(u.email) into v_email from auth.users u where u.id=v_uid;
  if v_app.auth_user_id=v_uid or (nullif(lower(btrim(v_app.email)),'') is not null and lower(btrim(v_app.email))=v_email) then
    raise exception 'You cannot select yourself as your ambassador / influencer.';
  end if;

  -- No retroactive claiming of established learners or payments. No account-age extension
  -- is made to automatic/cached referral-link claims; this is an explicit first-application choice.
  if v_existing is null
    and not exists(select 1 from public.enrollments e where e.student_id=v_uid)
    and not exists(select 1 from public.payments p where p.student_id=v_student_id)
    and not exists(select 1 from public.legacy_verification_claims l where l.user_id=v_uid) then
    insert into public.ambassador_v2_referrals(application_id,student_user_id,referral_code,source_page,eligibility_status)
    values(v_app.id,v_uid,coalesce(v_app.referral_code,''),'onboarding-approved-ambassador-choice','recorded')
    on conflict(student_user_id) do nothing;
    select r.application_id into v_existing from public.ambassador_v2_referrals r where r.student_user_id=v_uid;
    if v_existing is distinct from p_application_id then
      raise exception 'Your account is already linked to an ambassador. Please refresh the ambassador list.';
    end if;
  end if;

  update public.students set heard_about_ambassador_id=p_application_id,
    where_heard_about_us='Influencer / Brand Ambassador' where id=v_student_id and user_id=v_uid;
  return jsonb_build_object('selected_id',p_application_id,'linked_id',v_existing,
    'status',case when v_existing is null then 'source_recorded' else 'referral_recorded' end);
end;
$$;

revoke all on function onboarding_referral_private.directory() from public,anon;
revoke all on function onboarding_referral_private.save_choice(uuid) from public,anon;
grant execute on function onboarding_referral_private.directory() to authenticated;
grant execute on function onboarding_referral_private.save_choice(uuid) to authenticated;

create or replace function public.get_onboarding_ambassador_directory()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select onboarding_referral_private.directory();
$$;
create or replace function public.save_onboarding_ambassador_choice(p_application_id uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select onboarding_referral_private.save_choice(p_application_id);
$$;
revoke all on function public.get_onboarding_ambassador_directory() from public,anon;
revoke all on function public.save_onboarding_ambassador_choice(uuid) from public,anon;
grant execute on function public.get_onboarding_ambassador_directory() to authenticated;
grant execute on function public.save_onboarding_ambassador_choice(uuid) to authenticated;

comment on column public.students.heard_about_ambassador_id is
  'Applicant-selected approved marketing source; canonical referral ownership and verified-earning rules remain authoritative.';

notify pgrst, 'reload schema';
