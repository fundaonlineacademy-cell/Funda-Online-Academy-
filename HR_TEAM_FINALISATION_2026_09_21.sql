-- Funda Online Academy — HR & Team finalisation
-- 2026-09-21
-- Additive/idempotent controls only. Existing production HR records are preserved.

create or replace function public.audit_hr_contract_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    insert into public.hr_audit_log(
      actor_id,action,entity_type,entity_id,subject_profile_id,details
    )
    values(
      auth.uid(),
      'contract_'||new.status,
      'hr_contract',
      new.id::text,
      new.profile_id,
      pg_catalog.jsonb_build_object(
        'contract_number',new.contract_number,
        'old_status',old.status,
        'new_status',new.status,
        'typed_signature',new.typed_signature,
        'acceptance_declaration',new.acceptance_declaration,
        'decline_reason',new.decline_reason
      )
    );
  end if;
  return new;
end;
$$;

revoke all on function public.audit_hr_contract_status() from PUBLIC, anon, authenticated;

create or replace function public.guard_hr_safety_resolution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if lower(coalesce(new.status,'')) not in ('open','investigating','resolved','closed') then
    raise exception 'Invalid HR safety/wellbeing status.';
  end if;

  if lower(coalesce(new.status,'')) in ('resolved','closed') then
    if char_length(pg_catalog.btrim(coalesce(new.action_taken,''))) < 5 then
      raise exception 'Corrective action or resolution evidence is required before resolving or closing an HR safety case.';
    end if;
    if new.resolved_by is null then
      raise exception 'A reviewer must be recorded before an HR safety case can be resolved or closed.';
    end if;
    if new.resolved_at is null then
      new.resolved_at := pg_catalog.now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_hr_safety_resolution on public.hr_safety_incidents;
create trigger trg_guard_hr_safety_resolution
before insert or update of status,action_taken,resolved_by,resolved_at
on public.hr_safety_incidents
for each row execute function public.guard_hr_safety_resolution();

revoke all on function public.guard_hr_safety_resolution() from PUBLIC, anon, authenticated;

create or replace function public.acknowledge_my_performance_review(
  p_review_id uuid,
  p_comments text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_status text;
  v_ack timestamptz;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select lower(coalesce(role,''))
    into v_role
    from public.profiles
   where id=v_uid;

  if v_role <> 'staff' then
    raise exception 'Staff account required' using errcode='42501';
  end if;

  select status,employee_acknowledged_at
    into v_status,v_ack
    from public.hr_performance_reviews
   where id=p_review_id
     and profile_id=v_uid
   for update;

  if not found then
    raise exception 'Performance review not found for this staff account' using errcode='42501';
  end if;

  if lower(coalesce(v_status,'')) not in ('shared','closed') then
    raise exception 'Only a shared performance review can be acknowledged';
  end if;

  if v_ack is null then
    update public.hr_performance_reviews
       set employee_acknowledged_at=pg_catalog.now(),
           employee_comments=nullif(pg_catalog.btrim(coalesce(p_comments,'')),''),
           updated_at=pg_catalog.now()
     where id=p_review_id
       and profile_id=v_uid;

    insert into public.hr_audit_log(
      actor_id,action,entity_type,entity_id,subject_profile_id,details
    )
    values(
      v_uid,
      'performance_review_acknowledged',
      'hr_performance_review',
      p_review_id::text,
      v_uid,
      pg_catalog.jsonb_build_object(
        'comments',nullif(pg_catalog.btrim(coalesce(p_comments,'')),'')
      )
    );
  end if;

  return pg_catalog.jsonb_build_object(
    'ok',true,
    'review_id',p_review_id,
    'acknowledged',true
  );
end;
$$;

revoke all on function public.acknowledge_my_performance_review(uuid,text) from PUBLIC, anon;
grant execute on function public.acknowledge_my_performance_review(uuid,text) to authenticated;
