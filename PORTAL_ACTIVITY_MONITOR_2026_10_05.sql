-- Funda Online Academy — CEO Portal Activity Monitor
-- 2026-10-05
-- Additive only. Records authenticated portal presence for Students,
-- Ambassadors and Staff, and exposes the combined register only to the CEO.

begin;

create table if not exists public.portal_user_activity (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','ambassador','staff')),
  last_login_at timestamptz,
  last_seen_at timestamptz not null default now(),
  last_active_at timestamptz,
  last_portal_area text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.portal_user_activity is
  'Minimal authenticated portal-presence register for CEO operational oversight.';
comment on column public.portal_user_activity.last_seen_at is
  'Most recent visible-page heartbeat; used to derive online status.';
comment on column public.portal_user_activity.last_active_at is
  'Most recent throttled user interaction or visible-page entry.';

create index if not exists portal_user_activity_last_seen_idx
  on public.portal_user_activity (last_seen_at desc);
create index if not exists portal_user_activity_role_last_active_idx
  on public.portal_user_activity (role, last_active_at desc);

alter table public.portal_user_activity enable row level security;

drop policy if exists "CEO can view portal activity" on public.portal_user_activity;
create policy "CEO can view portal activity"
  on public.portal_user_activity
  for select
  to authenticated
  using (public.is_ceo());

revoke all on table public.portal_user_activity from public, anon, authenticated;
grant select on table public.portal_user_activity to authenticated, service_role;

create or replace function public.record_own_portal_activity(
  p_mark_active boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_role text;
  v_portal_area text;
  v_last_login_at timestamptz;
  v_now timestamptz := now();
begin
  if v_user_id is null then
    raise exception 'Authentication is required.' using errcode='42501';
  end if;

  select pg_catalog.lower(pg_catalog.btrim(p.role))
    into v_role
  from public.profiles p
  where p.id = v_user_id;

  if coalesce(v_role,'') not in ('student','ambassador','staff') then
    raise exception 'Portal activity is not available for this account.' using errcode='42501';
  end if;

  v_portal_area := case v_role
    when 'student' then 'Student Dashboard'
    when 'ambassador' then 'Ambassador Portal'
    when 'staff' then 'Staff Workspace'
  end;

  select u.last_sign_in_at
    into v_last_login_at
  from auth.users u
  where u.id = v_user_id;

  insert into public.portal_user_activity (
    user_id,
    role,
    last_login_at,
    last_seen_at,
    last_active_at,
    last_portal_area,
    created_at,
    updated_at
  ) values (
    v_user_id,
    v_role,
    v_last_login_at,
    v_now,
    case when coalesce(p_mark_active,false) then v_now else null end,
    v_portal_area,
    v_now,
    v_now
  )
  on conflict (user_id) do update
  set role = excluded.role,
      last_login_at = case
        when excluded.last_login_at is null then public.portal_user_activity.last_login_at
        when public.portal_user_activity.last_login_at is null then excluded.last_login_at
        else greatest(public.portal_user_activity.last_login_at, excluded.last_login_at)
      end,
      last_seen_at = excluded.last_seen_at,
      last_active_at = case
        when coalesce(p_mark_active,false) then excluded.last_seen_at
        else public.portal_user_activity.last_active_at
      end,
      last_portal_area = excluded.last_portal_area,
      updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.record_own_portal_activity(boolean) from public, anon;
grant execute on function public.record_own_portal_activity(boolean) to authenticated, service_role;

create or replace function public.ceo_get_portal_activity()
returns table (
  user_id uuid,
  full_name text,
  email text,
  role text,
  account_created_at timestamptz,
  account_status text,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  last_active_at timestamptz,
  last_portal_area text
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
    coalesce(p.email,u.email),
    pg_catalog.lower(p.role),
    coalesce(u.created_at,p.created_at),
    coalesce(s.status,'active'),
    coalesce(u.last_sign_in_at,a.last_login_at),
    a.last_seen_at,
    a.last_active_at,
    a.last_portal_area
  from public.profiles p
  left join auth.users u on u.id=p.id
  left join public.portal_user_activity a on a.user_id=p.id
  left join public.ceo_account_control_state s on s.user_id=p.id
  where pg_catalog.lower(p.role) in ('student','ambassador','staff')
    and coalesce(s.status,'active') <> 'deleted'
  order by a.last_seen_at desc nulls last,
           pg_catalog.lower(coalesce(p.full_name,p.email,u.email,''));
end;
$$;

revoke all on function public.ceo_get_portal_activity() from public, anon;
grant execute on function public.ceo_get_portal_activity() to authenticated, service_role;

do $$
begin
  if exists (
    select 1 from pg_catalog.pg_publication where pubname='supabase_realtime'
  ) and not exists (
    select 1
    from pg_catalog.pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='portal_user_activity'
  ) then
    alter publication supabase_realtime add table public.portal_user_activity;
  end if;
end;
$$;

commit;
