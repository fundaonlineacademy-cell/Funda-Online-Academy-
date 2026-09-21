-- Funda Online Academy — CEO Account Control finalisation
-- 2026-09-21
-- Protects CEO authority from editable profile fields, strengthens permanent
-- Staff deletion, and exposes learner numbers for clear account identification.

create table if not exists public.ceo_authority_assignments (
  user_id uuid primary key references public.profiles(id) on delete restrict,
  active boolean not null default true,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  notes text
);

create unique index if not exists ceo_authority_one_active_idx
  on public.ceo_authority_assignments ((active))
  where active=true;

alter table public.ceo_authority_assignments enable row level security;
revoke all on table public.ceo_authority_assignments from PUBLIC,anon,authenticated;
grant all on table public.ceo_authority_assignments to service_role;

insert into public.ceo_authority_assignments(user_id,active,assigned_by,assigned_at,notes)
select p.id,true,null,now(),'Initial protected CEO authority migrated from the existing approved CEO/Admin profile.'
from public.profiles p
where lower(coalesce(p.role,''))='admin'
  and (
    lower(coalesce(p.job_title,''))='ceo'
    or lower(coalesce(p.job_title,'')) like '%chief executive officer%'
    or lower(coalesce(p.job_title,'')) like '%founder%ceo%'
  )
  and not exists(
    select 1 from public.ceo_authority_assignments a where a.active=true
  )
order by p.created_at asc
limit 1
on conflict(user_id) do nothing;

do $$
begin
  if not exists(select 1 from public.ceo_authority_assignments where active=true) then
    raise exception 'CEO authority could not be initialised because no approved CEO/Admin profile was found.';
  end if;
end;
$$;

create or replace function public.is_ceo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.ceo_authority_assignments a
    join public.profiles p on p.id=a.user_id
    where a.user_id=auth.uid()
      and a.active=true
      and lower(coalesce(p.role,''))='admin'
  );
$$;

revoke all on function public.is_ceo() from PUBLIC,anon;
grant execute on function public.is_ceo() to authenticated,service_role;

drop function if exists public.ceo_list_manageable_accounts();

create function public.ceo_list_manageable_accounts()
returns table (
  user_id uuid,
  full_name text,
  email text,
  role text,
  job_title text,
  department text,
  staff_code text,
  student_number text,
  account_status text,
  status_reason text,
  status_changed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
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
    p.student_number,
    coalesce(s.status,'active') as account_status,
    s.reason as status_reason,
    s.changed_at as status_changed_at
  from public.profiles p
  left join public.ceo_account_control_state s on s.user_id=p.id
  where lower(p.role) in ('student','staff')
  order by
    case when coalesce(s.status,'active')='deleted' then 3
         when lower(p.role)='staff' then 1
         else 2 end,
    lower(coalesce(p.full_name,p.email,''));
end;
$$;

revoke all on function public.ceo_list_manageable_accounts() from PUBLIC,anon;
grant execute on function public.ceo_list_manageable_accounts() to authenticated,service_role;

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
as $$
declare
  v_actor uuid := auth.uid();
  v_action text := lower(btrim(coalesce(p_action,'')));
  v_reason text := btrim(coalesce(p_reason,''));
  v_confirmation text := btrim(coalesce(p_confirmation,''));
  v_target public.profiles%rowtype;
  v_state text;
  v_original_name text;
  v_original_email text;
  v_synthetic_email text;
  v_synthetic_staff_code text;
begin
  if v_actor is null or not public.is_ceo() then
    raise exception 'CEO authorisation is required.' using errcode='42501';
  end if;

  if p_target_user_id is null then
    raise exception 'Select an account.' using errcode='22023';
  end if;

  if p_target_user_id=v_actor then
    raise exception 'The CEO account cannot manage or delete itself through this control.' using errcode='22023';
  end if;

  select * into v_target
  from public.profiles
  where id=p_target_user_id;

  if not found then
    raise exception 'The selected account could not be found.' using errcode='P0002';
  end if;

  if lower(coalesce(v_target.role,'')) not in ('student','staff') then
    raise exception 'Only Student and Staff accounts can be managed here.' using errcode='22023';
  end if;

  if v_action not in ('deactivate','reactivate','delete') then
    raise exception 'Choose deactivate, reactivate or delete.' using errcode='22023';
  end if;

  if char_length(v_reason)<5 then
    raise exception 'A clear reason of at least 5 characters is required.' using errcode='22023';
  end if;

  select coalesce(s.status,'active')
    into v_state
    from (select 1) x
    left join public.ceo_account_control_state s on s.user_id=p_target_user_id;

  v_original_name := coalesce(v_target.full_name,'');
  v_original_email := coalesce(v_target.email,'');
  v_synthetic_email := 'deleted-' || replace(p_target_user_id::text,'-','') || '@deleted.funda.invalid';
  v_synthetic_staff_code := 'DELETED-' || upper(substr(replace(p_target_user_id::text,'-',''),1,16));

  if v_action='deactivate' then
    if v_state='deleted' then
      raise exception 'A deleted account cannot be deactivated.' using errcode='22023';
    end if;

    update auth.users
       set banned_until='infinity'::timestamptz,
           updated_at=now()
     where id=p_target_user_id;

    delete from auth.sessions where user_id=p_target_user_id;
    update auth.refresh_tokens set revoked=true,updated_at=now()
      where user_id=p_target_user_id::text;
    delete from auth.one_time_tokens where user_id=p_target_user_id;

    insert into public.ceo_account_control_state(user_id,status,reason,changed_by,changed_at)
    values(p_target_user_id,'deactivated',v_reason,v_actor,now())
    on conflict(user_id) do update
      set status='deactivated',reason=excluded.reason,changed_by=excluded.changed_by,changed_at=excluded.changed_at;

  elsif v_action='reactivate' then
    if v_state='deleted' then
      raise exception 'A permanently deleted account cannot be reactivated.' using errcode='22023';
    end if;

    update auth.users
       set banned_until=null,
           updated_at=now()
     where id=p_target_user_id;

    insert into public.ceo_account_control_state(user_id,status,reason,changed_by,changed_at)
    values(p_target_user_id,'active',v_reason,v_actor,now())
    on conflict(user_id) do update
      set status='active',reason=excluded.reason,changed_by=excluded.changed_by,changed_at=excluded.changed_at;

  else
    if v_state='deleted' then
      raise exception 'This account has already been permanently deleted.' using errcode='22023';
    end if;

    if v_confirmation=''
       or lower(v_confirmation) not in (lower(v_original_email),lower(v_original_name)) then
      raise exception 'Type the account email address or full name exactly to confirm permanent deletion.' using errcode='22023';
    end if;

    delete from auth.sessions where user_id=p_target_user_id;
    update auth.refresh_tokens set revoked=true,updated_at=now()
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
           raw_user_meta_data=jsonb_build_object('deleted',true),
           banned_until='infinity'::timestamptz,
           deleted_at=now(),
           updated_at=now()
     where id=p_target_user_id;

    if lower(v_target.role)='staff' then
      update public.staff_access_assignments
         set active=false,
             can_approve=false,
             revoked_by=v_actor,
             revoked_at=coalesce(revoked_at,now())
       where profile_id=p_target_user_id
         and active=true;

      delete from public.staff_access_credentials
       where profile_id=p_target_user_id;

      update public.staff_invitations
         set email=v_synthetic_email,
             full_name='Deleted Staff Account',
             staff_code=v_synthetic_staff_code,
             job_title='Former Staff Account',
             department='Former Staff Account',
             notes=case
               when nullif(btrim(coalesce(notes,'')),'') is null
                 then 'Personal invitation details anonymised after permanent CEO account deletion.'
               else notes || E'\nPersonal invitation details anonymised after permanent CEO account deletion.'
             end
       where invited_user_id=p_target_user_id;
    end if;

    update public.profiles
       set full_name=case when lower(v_target.role)='staff'
                          then 'Deleted Staff Account'
                          else 'Deleted Student Account' end,
           email=v_synthetic_email,
           phone=null,
           gender=null,
           id_number=null,
           staff_code=null,
           job_title=case when lower(v_target.role)='staff'
                          then 'Former Staff Account' else null end,
           avatar_url=null,
           department=null,
           student_number=null,
           identity_document_type=null,
           passport_number=null,
           updated_at=now()
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
           updated_at=now()
     where user_id=p_target_user_id;

    update public.account_registration_audit
       set email=v_synthetic_email
     where user_id=p_target_user_id;

    update public.staff_records
       set job_title='Former Staff Account',
           department=null,
           employment_status='Deleted',
           notes=case
             when nullif(btrim(coalesce(notes,'')),'') is null
               then 'Account permanently deleted by CEO. Reason recorded in CEO account action log.'
             else notes || E'\nAccount permanently deleted by CEO. Reason recorded in CEO account action log.'
           end,
           updated_at=now()
     where profile_id=p_target_user_id;

    insert into public.ceo_account_control_state(user_id,status,reason,changed_by,changed_at)
    values(p_target_user_id,'deleted',v_reason,v_actor,now())
    on conflict(user_id) do update
      set status='deleted',reason=excluded.reason,changed_by=excluded.changed_by,changed_at=excluded.changed_at;
  end if;

  insert into public.ceo_account_action_log(
    actor_id,target_user_id,target_role,target_name,target_email,action,reason,outcome,created_at
  ) values (
    v_actor,p_target_user_id,lower(v_target.role),
    v_original_name,v_original_email,v_action,v_reason,'completed',now()
  );

  return jsonb_build_object(
    'ok',true,
    'action',v_action,
    'target_user_id',p_target_user_id,
    'target_name',v_original_name,
    'target_role',lower(v_target.role),
    'account_status',case
      when v_action='deactivate' then 'deactivated'
      when v_action='reactivate' then 'active'
      else 'deleted'
    end,
    'retention_notice',case when v_action='delete'
      then 'Authentication and primary profile data were removed/anonymised. Historical Academy records and files may be retained where required for finance, academic, HR, security, legal or audit integrity.'
      else null end
  );
end;
$$;

revoke all on function public.ceo_manage_account(uuid,text,text,text) from PUBLIC,anon;
grant execute on function public.ceo_manage_account(uuid,text,text,text) to authenticated,service_role;
