-- Funda Online Academy
-- Student Support & CRM finalisation
-- 21 September 2026
--
-- Purpose:
-- 1. Make Support ticket lifecycle auditing database-authoritative.
-- 2. Provide atomic Admin reply/status/ownership actions.
-- 3. Protect consultation private staff notes from Student clients.
-- 4. Keep Support/consultation live sources available through Realtime.
-- 5. Optimise Support RLS predicates and relationship indexes.
--
-- This script is intentionally scoped to Student Support & CRM.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function public.support_ticket_created_audit()
returns trigger
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
begin
  insert into public.support_ticket_events(ticket_id,actor_id,event_type,to_status,details)
  select new.id,coalesce(new.student_id,(select auth.uid())),'ticket_created',
         lower(coalesce(new.status,'open')),'Support ticket created'
  where not exists (
    select 1
      from public.support_ticket_events e
     where e.ticket_id=new.id
       and e.event_type='ticket_created'
  );
  return new;
end;
$function$;

create or replace function public.support_ticket_message_audit()
returns trigger
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
begin
  if lower(coalesce(new.author_role,'')) in ('admin','staff') then
    update public.support_tickets
       set first_response_at=coalesce(first_response_at,new.created_at),
           last_response_at=new.created_at,
           updated_at=new.created_at
     where id=new.ticket_id;
  end if;

  insert into public.support_ticket_events(ticket_id,actor_id,event_type,details)
  values(
    new.ticket_id,
    new.author_id,
    'message_added',
    case
      when lower(coalesce(new.author_role,''))='student'
        then 'Student added information to the support ticket'
      else 'Student Support response added'
    end
  );
  return new;
end;
$function$;

create or replace function public.support_ticket_change_audit()
returns trigger
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
declare
  v_actor uuid := (select auth.uid());
begin
  if lower(coalesce(new.status,'')) is distinct from lower(coalesce(old.status,'')) then
    insert into public.support_ticket_events(
      ticket_id,actor_id,event_type,from_status,to_status,details
    )
    values(
      new.id,v_actor,'status_change',
      lower(coalesce(old.status,'')),
      lower(coalesce(new.status,'')),
      'Support ticket status changed'
    );
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into public.support_ticket_events(ticket_id,actor_id,event_type,details)
    values(
      new.id,v_actor,'assignment_change',
      case
        when new.assigned_to is null then 'Support case unassigned'
        else 'Support case owner changed'
      end
    );
  end if;

  return new;
end;
$function$;

drop trigger if exists support_ticket_created_audit_trigger on public.support_tickets;
create trigger support_ticket_created_audit_trigger
after insert on public.support_tickets
for each row execute function public.support_ticket_created_audit();

drop trigger if exists support_ticket_message_audit_trigger on public.support_ticket_messages;
create trigger support_ticket_message_audit_trigger
after insert on public.support_ticket_messages
for each row execute function public.support_ticket_message_audit();

drop trigger if exists support_ticket_change_audit_trigger on public.support_tickets;
create trigger support_ticket_change_audit_trigger
after update of status,assigned_to on public.support_tickets
for each row execute function public.support_ticket_change_audit();

create unique index if not exists support_ticket_created_event_unique
  on public.support_ticket_events(ticket_id,event_type)
  where event_type='ticket_created';

create or replace function public.support_update_case(
  p_ticket_id uuid,
  p_status text,
  p_assigned_to uuid default null
)
returns void
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_status text := lower(coalesce(trim(p_status),''));
begin
  if v_actor is null or not (
    public.is_admin()
    or public.has_department_access('Student Support','edit')
  ) then
    raise exception 'Student Support edit access required';
  end if;

  if v_status not in ('open','in_progress','resolved','closed') then
    raise exception 'Invalid support ticket status';
  end if;

  if p_assigned_to is not null and not exists (
    select 1
      from public.profiles p
     where p.id=p_assigned_to
       and lower(coalesce(p.role,'')) in ('admin','staff','manager')
       and lower(coalesce(p.email,'')) not like '%@deleted.funda.invalid'
       and not exists (
         select 1
           from public.ceo_account_control_state s
          where s.user_id=p.id
            and s.status='deleted'
       )
  ) then
    raise exception 'Assigned case owner is invalid';
  end if;

  perform 1
    from public.support_tickets
   where id=p_ticket_id
   for update;

  if not found then
    raise exception 'Support ticket not found';
  end if;

  update public.support_tickets
     set status=v_status,
         assigned_to=p_assigned_to,
         resolved_at=case
           when v_status in ('resolved','closed') then coalesce(resolved_at,now())
           else null
         end,
         resolved_by=case
           when v_status in ('resolved','closed') then coalesce(resolved_by,v_actor)
           else null
         end,
         updated_at=now()
   where id=p_ticket_id;
end;
$function$;

create or replace function public.support_reply_case(
  p_ticket_id uuid,
  p_message text,
  p_status text,
  p_assigned_to uuid default null
)
returns void
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_role text;
  v_status text := lower(coalesce(trim(p_status),''));
  v_message text := trim(coalesce(p_message,''));
begin
  if v_actor is null or not (
    public.is_admin()
    or public.has_department_access('Student Support','edit')
  ) then
    raise exception 'Student Support edit access required';
  end if;

  if v_message='' then
    raise exception 'Support response is required';
  end if;

  if char_length(v_message)>5000 then
    raise exception 'Support response is too long';
  end if;

  if v_status not in ('open','in_progress','resolved','closed') then
    raise exception 'Invalid support ticket status';
  end if;

  if p_assigned_to is not null and not exists (
    select 1
      from public.profiles p
     where p.id=p_assigned_to
       and lower(coalesce(p.role,'')) in ('admin','staff','manager')
       and lower(coalesce(p.email,'')) not like '%@deleted.funda.invalid'
       and not exists (
         select 1
           from public.ceo_account_control_state s
          where s.user_id=p.id
            and s.status='deleted'
       )
  ) then
    raise exception 'Assigned case owner is invalid';
  end if;

  select lower(coalesce(p.role,''))
    into v_role
    from public.profiles p
   where p.id=v_actor;

  if v_role not in ('admin','staff','manager') then
    raise exception 'Student Support staff profile is invalid';
  end if;

  perform 1
    from public.support_tickets
   where id=p_ticket_id
   for update;

  if not found then
    raise exception 'Support ticket not found';
  end if;

  insert into public.support_ticket_messages(
    ticket_id,author_id,author_role,message
  )
  values(
    p_ticket_id,
    v_actor,
    case when v_role='admin' then 'admin' else 'staff' end,
    v_message
  );

  update public.support_tickets
     set status=v_status,
         assigned_to=p_assigned_to,
         resolved_at=case
           when v_status in ('resolved','closed') then coalesce(resolved_at,now())
           else null
         end,
         resolved_by=case
           when v_status in ('resolved','closed') then coalesce(resolved_by,v_actor)
           else null
         end,
         updated_at=now()
   where id=p_ticket_id;
end;
$function$;

revoke execute on function public.support_update_case(uuid,text,uuid)
  from public,anon;
revoke execute on function public.support_reply_case(uuid,text,text,uuid)
  from public,anon;
grant execute on function public.support_update_case(uuid,text,uuid)
  to authenticated;
grant execute on function public.support_reply_case(uuid,text,text,uuid)
  to authenticated;

create or replace function private.get_my_student_consultations_internal()
returns table(
  id uuid,
  student_id uuid,
  linked_ticket_id uuid,
  category text,
  department text,
  preferred_staff_id uuid,
  assigned_staff_id uuid,
  scheduled_start timestamptz,
  duration_minutes integer,
  mode text,
  reason text,
  status text,
  meeting_link text,
  student_visible_notes text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  reminder_due_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
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
     where p.id=v_actor
       and lower(coalesce(p.role,''))='student'
  ) then
    raise exception 'Student access required';
  end if;

  return query
  select
    c.id,c.student_id,c.linked_ticket_id,c.category,c.department,
    c.preferred_staff_id,c.assigned_staff_id,c.scheduled_start,c.duration_minutes,
    c.mode,c.reason,c.status,c.meeting_link,c.student_visible_notes,
    c.confirmed_at,c.completed_at,c.cancelled_at,c.cancellation_reason,
    c.reminder_due_at,c.reminder_sent_at,c.created_at,c.updated_at
  from public.student_consultations c
  where c.student_id=v_actor
  order by c.scheduled_start asc;
end;
$function$;

revoke execute on function private.get_my_student_consultations_internal()
  from public,anon;
grant execute on function private.get_my_student_consultations_internal()
  to authenticated;

create or replace function public.get_my_student_consultations()
returns table(
  id uuid,
  student_id uuid,
  linked_ticket_id uuid,
  category text,
  department text,
  preferred_staff_id uuid,
  assigned_staff_id uuid,
  scheduled_start timestamptz,
  duration_minutes integer,
  mode text,
  reason text,
  status text,
  meeting_link text,
  student_visible_notes text,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  reminder_due_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security invoker
set search_path to 'public','private','pg_temp'
as $function$
  select * from private.get_my_student_consultations_internal();
$function$;

revoke execute on function public.get_my_student_consultations()
  from public,anon;
grant execute on function public.get_my_student_consultations()
  to authenticated;

drop policy if exists "Students view own consultations"
  on public.student_consultations;

drop policy if exists "Students can view own support tickets"
  on public.support_tickets;
create policy "Students can view own support tickets"
on public.support_tickets
for select
to authenticated
using (student_id=(select auth.uid()));

drop policy if exists "Students can view own support messages"
  on public.support_ticket_messages;
create policy "Students can view own support messages"
on public.support_ticket_messages
for select
to authenticated
using (
  exists (
    select 1
      from public.support_tickets t
     where t.id=support_ticket_messages.ticket_id
       and t.student_id=(select auth.uid())
  )
);

drop policy if exists "Students can view own support events"
  on public.support_ticket_events;
create policy "Students can view own support events"
on public.support_ticket_events
for select
to authenticated
using (
  exists (
    select 1
      from public.support_tickets t
     where t.id=support_ticket_events.ticket_id
       and t.student_id=(select auth.uid())
  )
);

drop policy if exists "Students can create own support events"
  on public.support_ticket_events;
create policy "Students can create own support events"
on public.support_ticket_events
for insert
to authenticated
with check (
  actor_id=(select auth.uid())
  and event_type in ('ticket_created','student_reply','message_added')
  and exists (
    select 1
      from public.support_tickets t
     where t.id=support_ticket_events.ticket_id
       and t.student_id=(select auth.uid())
  )
);

drop policy if exists "Students view own visible consultation events"
  on public.consultation_events;
create policy "Students view own visible consultation events"
on public.consultation_events
for select
to authenticated
using (
  student_visible
  and exists (
    select 1
      from public.student_consultations c
     where c.id=consultation_events.consultation_id
       and c.student_id=(select auth.uid())
  )
);

drop policy if exists "Admins manage consultation events"
  on public.consultation_events;
create policy "Admins manage consultation events"
on public.consultation_events
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage consultations"
  on public.student_consultations;
create policy "Admins manage consultations"
on public.student_consultations
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Admins manage support events"
  on public.support_ticket_events;
create policy "Admins manage support events"
on public.support_ticket_events
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Student Support staff add support events"
  on public.support_ticket_events;
create policy "Student Support staff add support events"
on public.support_ticket_events
for insert
to authenticated
with check (
  (select public.has_department_access('Student Support','edit'))
  and actor_id=(select auth.uid())
);

drop policy if exists "Student Support staff view support events"
  on public.support_ticket_events;
create policy "Student Support staff view support events"
on public.support_ticket_events
for select
to authenticated
using ((select public.has_department_access('Student Support','read')));

drop policy if exists "Admins manage support messages"
  on public.support_ticket_messages;
create policy "Admins manage support messages"
on public.support_ticket_messages
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Student Support staff add support messages"
  on public.support_ticket_messages;
create policy "Student Support staff add support messages"
on public.support_ticket_messages
for insert
to authenticated
with check (
  (select public.has_department_access('Student Support','edit'))
  and author_id=(select auth.uid())
  and author_role='staff'
);

drop policy if exists "Student Support staff view support messages"
  on public.support_ticket_messages;
create policy "Student Support staff view support messages"
on public.support_ticket_messages
for select
to authenticated
using ((select public.has_department_access('Student Support','read')));

drop policy if exists "Student Support staff update support tickets"
  on public.support_tickets;
create policy "Student Support staff update support tickets"
on public.support_tickets
for update
to authenticated
using ((select public.has_department_access('Student Support','edit')))
with check ((select public.has_department_access('Student Support','edit')));

drop policy if exists "Student Support staff view support tickets"
  on public.support_tickets;
create policy "Student Support staff view support tickets"
on public.support_tickets
for select
to authenticated
using ((select public.has_department_access('Student Support','read')));

drop policy if exists "admin_all"
  on public.support_tickets;
create policy "admin_all"
on public.support_tickets
for all
to authenticated
using (
  exists (
    select 1
      from public.profiles p
     where p.id=(select auth.uid())
       and p.role='admin'
  )
)
with check (
  exists (
    select 1
      from public.profiles p
     where p.id=(select auth.uid())
       and p.role='admin'
  )
);

create index if not exists support_tickets_resolved_by_idx
  on public.support_tickets(resolved_by);
create index if not exists support_ticket_messages_author_id_idx
  on public.support_ticket_messages(author_id);
create index if not exists support_ticket_events_actor_id_idx
  on public.support_ticket_events(actor_id);

create index if not exists student_consultations_student_id_idx
  on public.student_consultations(student_id);
create index if not exists student_consultations_linked_ticket_id_idx
  on public.student_consultations(linked_ticket_id);
create index if not exists student_consultations_preferred_staff_id_idx
  on public.student_consultations(preferred_staff_id);
create index if not exists student_consultations_assigned_staff_id_idx
  on public.student_consultations(assigned_staff_id);
create index if not exists student_consultations_confirmed_by_idx
  on public.student_consultations(confirmed_by);
create index if not exists student_consultations_completed_by_idx
  on public.student_consultations(completed_by);
create index if not exists student_consultations_cancelled_by_idx
  on public.student_consultations(cancelled_by);

create index if not exists consultation_events_consultation_id_idx
  on public.consultation_events(consultation_id);
create index if not exists consultation_events_actor_id_idx
  on public.consultation_events(actor_id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'support_tickets',
    'support_ticket_messages',
    'support_ticket_events',
    'student_consultations',
    'consultation_events'
  ]
  loop
    if not exists (
      select 1
        from pg_publication_tables
       where pubname='supabase_realtime'
         and schemaname='public'
         and tablename=t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end $$;
