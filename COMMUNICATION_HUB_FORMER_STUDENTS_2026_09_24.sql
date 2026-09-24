begin;

create table if not exists public.former_student_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  source text not null default 'historical_record',
  notes text,
  active boolean not null default true,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint former_student_contacts_email_not_blank check (btrim(email) <> '')
);

create unique index if not exists former_student_contacts_email_ci_uq
  on public.former_student_contacts (lower(btrim(email)));

create unique index if not exists former_student_contacts_unsubscribe_token_uq
  on public.former_student_contacts (unsubscribe_token);

create index if not exists former_student_contacts_created_by_idx
  on public.former_student_contacts (created_by);

alter table public.former_student_contacts enable row level security;

drop policy if exists "Former student contacts are not directly exposed" on public.former_student_contacts;
create policy "Former student contacts are not directly exposed"
  on public.former_student_contacts
  for all
  to authenticated
  using (false)
  with check (false);

revoke all on table public.former_student_contacts from anon, authenticated;
grant select, insert, update, delete on table public.former_student_contacts to service_role;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.get_former_student_contacts_internal()
returns table(
  id uuid,
  email text,
  full_name text,
  source text,
  active boolean,
  unsubscribed_at timestamptz,
  created_at timestamptz,
  is_current_student boolean
)
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_actor uuid := (select auth.uid());
begin
  if v_actor is null or not exists (
    select 1
      from public.profiles p
     where p.id = v_actor
       and lower(coalesce(p.role,'')) in ('admin','staff')
       and (
         lower(coalesce(p.role,'')) = 'admin'
         or lower(coalesce(p.department,'')) in (
           'executive management','communication','communications','communication hub',
           'finance & accounting','student support & crm','marketing & admissions','hr & team'
         )
       )
  ) then
    raise exception 'Communication access required';
  end if;

  return query
  select
    f.id,
    f.email,
    f.full_name,
    f.source,
    f.active,
    f.unsubscribed_at,
    f.created_at,
    exists (
      select 1
        from public.profiles p
       where lower(btrim(coalesce(p.email,''))) = lower(btrim(f.email))
         and lower(coalesce(p.role,'')) = 'student'
         and lower(coalesce(p.email,'')) not like '%@deleted.funda.invalid'
         and not exists (
           select 1
             from public.ceo_account_control_state s
            where s.user_id = p.id
              and lower(coalesce(s.status,'')) = 'deleted'
         )
    ) as is_current_student
  from public.former_student_contacts f
  order by lower(f.email);
end;
$function$;

revoke execute on function private.get_former_student_contacts_internal() from public, anon;
grant execute on function private.get_former_student_contacts_internal() to authenticated;

create or replace function public.get_former_student_contacts()
returns table(
  id uuid,
  email text,
  full_name text,
  source text,
  active boolean,
  unsubscribed_at timestamptz,
  created_at timestamptz,
  is_current_student boolean
)
language sql
security invoker
set search_path to 'public','private','pg_temp'
as $function$
  select * from private.get_former_student_contacts_internal();
$function$;

revoke execute on function public.get_former_student_contacts() from public, anon;
grant execute on function public.get_former_student_contacts() to authenticated;

alter table public.communications
  drop constraint if exists communications_audience_check;

alter table public.communications
  add constraint communications_audience_check
  check (
    lower(coalesce(audience,'')) = any (
      array[
        'all_students'::text,
        'active_students'::text,
        'course'::text,
        'student'::text,
        'staff'::text,
        'selected_students'::text,
        'ambassadors'::text,
        'all_funda'::text,
        'former_students'::text
      ]
    )
  );

commit;
