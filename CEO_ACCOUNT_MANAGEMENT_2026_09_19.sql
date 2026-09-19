-- Funda Online Academy
-- CEO-only Student / Staff account controls
-- 19 September 2026
--
-- Provides:
--   * CEO-only account listing
--   * Deactivate / Reactivate
--   * Permanent account deletion with mandatory reason and typed confirmation
--   * Tamper-resistant audit trail
--
-- Permanent deletion removes authentication access and personal account data while
-- preserving anonymised historical Academy records where those records must remain
-- linked for finance, academic, HR, security or audit integrity.

begin;

create table if not exists public.ceo_account_control_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active'
    check (status in ('active','deactivated','deleted')),
  reason text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table if not exists public.ceo_account_action_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  target_user_id uuid not null,
  target_role text not null,
  target_name text,
  target_email text,
  action text not null
    check (action in ('deactivate','reactivate','delete')),
  reason text not null,
  outcome text not null default 'completed',
  created_at timestamptz not null default now()
);

alter table public.ceo_account_control_state enable row level security;
alter table public.ceo_account_action_log enable row level security;

revoke all on public.ceo_account_control_state from public, anon, authenticated;
revoke all on public.ceo_account_action_log from public, anon, authenticated;

create or replace function public.is_ceo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and pg_catalog.lower(coalesce(p.role,'')) = 'admin'
      and (
        pg_catalog.lower(coalesce(p.job_title,'')) = 'ceo'
        or pg_catalog.lower(coalesce(p.job_title,'')) like '%chief executive officer%'
        or pg_catalog.lower(coalesce(p.job_title,'')) like '%founder%ceo%'
      )
  );
$function$;

revoke all on function public.is_ceo() from public, anon;
grant execute on function public.is_ceo() to authenticated, service_role;

create or replace function public.ceo_list_manageable_accounts()
returns table (
  user_id uuid,
  full_name text,
  email text,
  role text,
  job_title text,
  department text,
  staff_code text,
  account_status text,
  status_reason text,
  status_changed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.is_ceo() then
    raise exception 'CEO authorisation is required.' using errcode='42501';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.job_title,
    p.department,
    p.staff_code,
    coalesce(s.status,'active') as account_status,
    s.reason as status_reason,
    s.changed_at as status_changed_at
  from public.profiles p
  left join public.ceo_account_control_state s on s.user_id=p.id
  where pg_catalog.lower(p.role) in ('student','staff')
  order by
    case pg_catalog.lower(p.role) when 'staff' then 1 else 2 end,
    pg_catalog.lower(coalesce(p.full_name,p.email,''));
end;
$function$;

revoke all on function public.ceo_list_manageable_accounts() from public, anon;
grant execute on function public.ceo_list_manageable_accounts() to authenticated, service_role;

create or replace function public.ceo_list_account_actions(p_limit integer default 100)
returns table (
  id uuid,
  actor_id uuid,
  target_user_id uuid,
  target_role text,
  target_name text,
  target_email text,
  action text,
  reason text,
  outcome text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not public.is_ceo() then
    raise exception 'CEO authorisation is required.' using errcode='42501';
  end if;

  return query
  select
    l.id,l.actor_id,l.target_user_id,l.target_role,l.target_name,l.target_email,
    l.action,l.reason,l.outcome,l.created_at
  from public.ceo_account_action_log l
  order by l.created_at desc
  limit greatest(1,least(coalesce(p_limit,100),500));
end;
$function$;

revoke all on function public.ceo_list_account_actions(integer) from public, anon;
grant execute on function public.ceo_list_account_actions(integer) to authenticated, service_role;

create or replace function public.ceo_manage_account(
  p_target_user_id uuid,
  p_action text,
  p_reason text,
  p_confirmation text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_action text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_action,'')));
  v_reason text := pg_catalog.btrim(coalesce(p_reason,''));
  v_confirmation text := pg_catalog.btrim(coalesce(p_confirmation,''));
  v_target public.profiles%rowtype;
  v_state text;
  v_original_name text;
  v_original_email text;
  v_synthetic_email text;
begin
  if v_actor is null or not public.is_ceo() then
    raise exception 'CEO authorisation is required.' using errcode='42501';
  end if;

  if p_target_user_id is null then
    raise exception 'Select an account.' using errcode='22023';
  end if;

  if p_target_user_id = v_actor then
    raise exception 'The CEO account cannot manage or delete itself through this control.' using errcode='22023';
  end if;

  select *
  into v_target
  from public.profiles
  where id=p_target_user_id;

  if not found then
    raise exception 'The selected account could not be found.' using errcode='P0002';
  end if;

  if pg_catalog.lower(coalesce(v_target.role,'')) not in ('student','staff') then
    raise exception 'Only Student and Staff accounts can be managed here.' using errcode='22023';
  end if;

  if v_action not in ('deactivate','reactivate','delete') then
    raise exception 'Choose deactivate, reactivate or delete.' using errcode='22023';
  end if;

  if char_length(v_reason) < 5 then
    raise exception 'A clear reason of at least 5 characters is required.' using errcode='22023';
  end if;

  select coalesce(s.status,'active')
  into v_state
  from (select 1) x
  left join public.ceo_account_control_state s on s.user_id=p_target_user_id;

  v_original_name := coalesce(v_target.full_name,'');
  v_original_email := coalesce(v_target.email,'');
  v_synthetic_email := 'deleted-' || replace(p_target_user_id::text,'-','') || '@deleted.funda.invalid';

  if v_action='deactivate' then
    if v_state='deleted' then
      raise exception 'A deleted account cannot be deactivated.' using errcode='22023';
    end if;

    update auth.users
    set banned_until='infinity'::timestamptz,
        updated_at=pg_catalog.now()
    where id=p_target_user_id;

    delete from auth.sessions where user_id=p_target_user_id;
    update auth.refresh_tokens set revoked=true,updated_at=pg_catalog.now()
      where user_id=p_target_user_id::text;
    delete from auth.one_time_tokens where user_id=p_target_user_id;

    insert into public.ceo_account_control_state(user_id,status,reason,changed_by,changed_at)
    values(p_target_user_id,'deactivated',v_reason,v_actor,pg_catalog.now())
    on conflict(user_id) do update
      set status='deactivated',reason=excluded.reason,changed_by=excluded.changed_by,changed_at=excluded.changed_at;

  elsif v_action='reactivate' then
    if v_state='deleted' then
      raise exception 'A permanently deleted account cannot be reactivated.' using errcode='22023';
    end if;

    update auth.users
    set banned_until=null,
        updated_at=pg_catalog.now()
    where id=p_target_user_id;

    insert into public.ceo_account_control_state(user_id,status,reason,changed_by,changed_at)
    values(p_target_user_id,'active',v_reason,v_actor,pg_catalog.now())
    on conflict(user_id) do update
      set status='active',reason=excluded.reason,changed_by=excluded.changed_by,changed_at=excluded.changed_at;

  else
    if v_state='deleted' then
      raise exception 'This account has already been permanently deleted.' using errcode='22023';
    end if;

    if v_confirmation = ''
       or pg_catalog.lower(v_confirmation) not in (
         pg_catalog.lower(v_original_email),
         pg_catalog.lower(v_original_name)
       ) then
      raise exception 'Type the account email address or full name exactly to confirm permanent deletion.' using errcode='22023';
    end if;

    -- Remove all active authentication paths first.
    delete from auth.sessions where user_id=p_target_user_id;
    update auth.refresh_tokens set revoked=true,updated_at=pg_catalog.now()
      where user_id=p_target_user_id::text;
    delete from auth.one_time_tokens where user_id=p_target_user_id;
    delete from auth.identities where user_id=p_target_user_id;

    update auth.users
    set email=v_synthetic_email,
        phone=null,
        encrypted_password=null,
        email_confirmed_at=null,
        phone_confirmed_at=null,
        confirmation_token='',
        recovery_token='',
        email_change='',
        email_change_token_new='',
        email_change_token_current='',
        phone_change='',
        phone_change_token='',
        raw_user_meta_data=pg_catalog.jsonb_build_object('deleted',true),
        banned_until='infinity'::timestamptz,
        deleted_at=pg_catalog.now(),
        updated_at=pg_catalog.now()
    where id=p_target_user_id;

    -- Remove public-facing personal data while keeping a tombstone profile so
    -- historical finance, academic, HR and audit relationships remain valid.
    update public.profiles
    set full_name=case when pg_catalog.lower(v_target.role)='staff'
                       then 'Deleted Staff Account'
                       else 'Deleted Student Account' end,
        email=v_synthetic_email,
        phone=null,
        gender=null,
        id_number=null,
        staff_code=null,
        job_title=case when pg_catalog.lower(v_target.role)='staff'
                       then 'Former Staff Account' else null end,
        avatar_url=null,
        department=null,
        student_number=null,
        identity_document_type=null,
        passport_number=null,
        updated_at=pg_catalog.now()
    where id=p_target_user_id;

    update public.students
    set full_name='Deleted Student Account',
        gender=null,
        south_african_id=null,
        email=v_synthetic_email,
        mobile_whatsapp=null,
        address=null,
        date_of_birth=null,
        nationality=null,
        province=null,
        city=null,
        postal_code=null,
        employment_status=null,
        highest_education=null,
        where_heard_about_us=null,
        emergency_contact_name=null,
        emergency_contact_phone=null,
        identity_document_type=null,
        passport_number=null,
        updated_at=pg_catalog.now()
    where user_id=p_target_user_id;

    update public.staff_records
    set job_title='Former Staff Account',
        department=null,
        employment_status='Deleted',
        notes=case
          when nullif(pg_catalog.btrim(coalesce(notes,'')),'') is null
            then 'Account permanently deleted by CEO. Reason recorded in CEO account action log.'
          else notes || E'\nAccount permanently deleted by CEO. Reason recorded in CEO account action log.'
        end,
        updated_at=pg_catalog.now()
    where profile_id=p_target_user_id;

    -- Profile-avatar object cleanup is handled by the authenticated
    -- ceo-account-control Edge Function through the Storage API. Direct
    -- deletion from storage.objects is intentionally not permitted.

    insert into public.ceo_account_control_state(user_id,status,reason,changed_by,changed_at)
    values(p_target_user_id,'deleted',v_reason,v_actor,pg_catalog.now())
    on conflict(user_id) do update
      set status='deleted',reason=excluded.reason,changed_by=excluded.changed_by,changed_at=excluded.changed_at;
  end if;

  insert into public.ceo_account_action_log(
    actor_id,target_user_id,target_role,target_name,target_email,action,reason,outcome,created_at
  ) values (
    v_actor,p_target_user_id,pg_catalog.lower(v_target.role),
    v_original_name,v_original_email,v_action,v_reason,'completed',pg_catalog.now()
  );

  return pg_catalog.jsonb_build_object(
    'ok',true,
    'action',v_action,
    'target_user_id',p_target_user_id,
    'target_name',v_original_name,
    'target_role',pg_catalog.lower(v_target.role),
    'account_status',case
      when v_action='deactivate' then 'deactivated'
      when v_action='reactivate' then 'active'
      else 'deleted'
    end
  );
end;
$function$;

revoke all on function public.ceo_manage_account(uuid,text,text,text) from public, anon;
grant execute on function public.ceo_manage_account(uuid,text,text,text) to authenticated, service_role;

commit;
