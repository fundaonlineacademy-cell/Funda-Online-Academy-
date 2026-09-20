-- Funda Online Academy — Ambassador Programme finalisation
-- Owner-approved 21 September 2026.
-- Scope: formal current-version agreement acceptance for existing approved Ambassadors.
-- Existing historical/legacy acceptance records are preserved and never auto-converted.

begin;

create or replace function public.get_own_ambassador_agreement_status()
returns table(
  application_id uuid,
  agreement_version_id uuid,
  version text,
  title text,
  agreement_text text,
  house_rules jsonb,
  content_hash text,
  effective_at timestamptz,
  accepted boolean,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path to ''
as $function$
  with mine as (
    select a.id
      from public.ambassador_programme_applications a
     where a.auth_user_id = auth.uid()
       and a.status = 'approved'
     limit 1
  ),
  current_version as (
    select v.id,v.version,v.title,v.agreement_text,v.house_rules,v.content_hash,v.effective_at
      from public.ambassador_agreement_versions v
     where v.status = 'active'
       and (v.effective_at is null or v.effective_at <= now())
     order by v.effective_at desc nulls last,v.created_at desc
     limit 1
  )
  select
    m.id,
    v.id,
    v.version,
    v.title,
    v.agreement_text,
    v.house_rules,
    v.content_hash,
    v.effective_at,
    (acc.id is not null) as accepted,
    acc.accepted_at
  from mine m
  cross join current_version v
  left join public.ambassador_agreement_acceptances acc
    on acc.application_id = m.id
   and acc.agreement_version_id = v.id;
$function$;

create or replace function public.accept_own_ambassador_agreement()
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_application_id uuid;
  v_version_id uuid;
  v_hash text;
  v_declaration text := 'I confirm that I have read, understood and agree to this version of the Funda Online Academy Ambassador Programme Agreement & Terms.';
begin
  if auth.uid() is null then
    return false;
  end if;

  select a.id
    into v_application_id
    from public.ambassador_programme_applications a
   where a.auth_user_id = auth.uid()
     and a.status = 'approved'
   limit 1;

  if v_application_id is null then
    return false;
  end if;

  select v.id,v.content_hash
    into v_version_id,v_hash
    from public.ambassador_agreement_versions v
   where v.status = 'active'
     and (v.effective_at is null or v.effective_at <= now())
   order by v.effective_at desc nulls last,v.created_at desc
   limit 1;

  if v_version_id is null or coalesce(v_hash,'') = '' then
    raise exception 'The current Ambassador Programme Agreement is unavailable.';
  end if;

  insert into public.ambassador_agreement_acceptances(
    application_id,
    agreement_version_id,
    accepted_by,
    accepted_at,
    agreement_hash,
    acceptance_declaration
  )
  values(
    v_application_id,
    v_version_id,
    auth.uid(),
    now(),
    v_hash,
    v_declaration
  )
  on conflict(application_id,agreement_version_id) do nothing;

  update public.ambassador_programme_applications
     set agreement_status = 'accepted',
         agreement_accepted_at = coalesce(agreement_accepted_at,now()),
         updated_at = now()
   where id = v_application_id;

  return true;
end;
$function$;

revoke all on function public.get_own_ambassador_agreement_status() from public;
revoke all on function public.get_own_ambassador_agreement_status() from anon;
grant execute on function public.get_own_ambassador_agreement_status() to authenticated;

revoke all on function public.accept_own_ambassador_agreement() from public;
revoke all on function public.accept_own_ambassador_agreement() from anon;
grant execute on function public.accept_own_ambassador_agreement() to authenticated;

commit;
