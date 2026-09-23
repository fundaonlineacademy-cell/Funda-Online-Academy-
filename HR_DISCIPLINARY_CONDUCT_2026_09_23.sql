-- Funda Online Academy — Staff Disciplinary & Conduct Management
-- 2026-09-23
-- Aligns the internal staff-misconduct workflow with the South African
-- Code of Practice: Dismissal effective 4 September 2025.
-- This does not create student discipline, payroll actions or automatic offboarding.

create sequence if not exists public.hr_disciplinary_case_seq start with 1;

create table if not exists public.hr_disciplinary_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  category text not null,
  rule_title text not null,
  guidance text not null,
  seriousness_hint text not null default 'case_by_case'
    check (seriousness_hint in ('minor_or_progressive','case_by_case','potentially_serious')),
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

insert into public.hr_disciplinary_rules(rule_code,category,rule_title,guidance,seriousness_hint,active,sort_order)
values
  ('ATT-001','Attendance & Timekeeping','Unauthorised absence / failure to follow absence-reporting procedure',
   'First establish why the employee was absent or failed to report. Illness, protected leave or genuine incapacity is not misconduct merely because the employee was absent. Repeated lateness or unauthorised absence may justify progressive discipline after the facts and the workplace rule are established.',
   'minor_or_progressive',true,10),
  ('INS-001','Instructions & Authority','Failure or refusal to follow a lawful and reasonable instruction',
   'Confirm the instruction was lawful, reasonable, communicated and understood. Consider the circumstances and whether correction or progressive discipline is appropriate before stronger sanctions.',
   'case_by_case',true,20),
  ('HON-001','Honesty & Integrity','Dishonesty, fraud, theft or falsification',
   'Potentially serious misconduct. Investigate the facts, actual/potential harm, trust impact and all mitigating/aggravating circumstances. Seriousness does not remove the employee right to a fair opportunity to respond.',
   'potentially_serious',true,30),
  ('CON-001','Confidentiality & Data','Breach of confidentiality, privacy or information-security duties',
   'Establish the applicable confidentiality/privacy/security rule, whether the employee knew or should have known it, the nature of the breach, harm/risk and consistency with comparable cases.',
   'case_by_case',true,40),
  ('HAR-001','Dignity & Respect','Harassment, discrimination, bullying or abusive conduct',
   'Handle promptly and sensitively. Preserve confidentiality as far as reasonably possible, protect affected persons and investigate fairly. Other statutory harassment/discrimination duties may also apply.',
   'potentially_serious',true,50),
  ('SAF-001','Safety & Conduct','Violence, threats or serious unsafe conduct',
   'Potentially serious misconduct. Consider immediate safety measures separately from the final disciplinary outcome. Any precautionary measure must itself be fair and must not predetermine guilt.',
   'potentially_serious',true,60),
  ('AST-001','Assets & Systems','Misuse or wilful damage of Academy property, systems or resources',
   'Confirm the rule, intent/negligence, value or risk involved, employee awareness and comparable treatment before deciding on sanction.',
   'case_by_case',true,70),
  ('NEG-001','Care & Responsibility','Negligence or dereliction of duty',
   'Distinguish misconduct from inability, inadequate training or poor performance. If the employee lacked capability or support rather than wilfully/negligently breaching a duty, route the matter to the appropriate performance/incapacity process.',
   'case_by_case',true,80),
  ('COI-001','Conflicts & Benefits','Undisclosed conflict of interest or unauthorised benefit',
   'Establish the applicable disclosure/ethics rule, the employee awareness, actual/potential conflict and harm before deciding on corrective or disciplinary action.',
   'case_by_case',true,90),
  ('POL-001','Policies & Workplace Rules','Breach of another valid and reasonable workplace rule',
   'Record the exact rule or standard, how it was communicated, whether it has been consistently applied and why it is relevant to the workplace.',
   'case_by_case',true,100),
  ('OTH-001','Other','Other alleged misconduct',
   'Use only where no listed category fits. Clearly identify the alleged rule/standard and the facts so the employee can understand and respond to the allegation.',
   'case_by_case',true,999)
on conflict(rule_code) do update set
  category=excluded.category,
  rule_title=excluded.rule_title,
  guidance=excluded.guidance,
  seriousness_hint=excluded.seriousness_hint,
  active=excluded.active,
  sort_order=excluded.sort_order;

create table if not exists public.hr_disciplinary_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  rule_id uuid references public.hr_disciplinary_rules(id) on delete restrict,
  allegation_title text not null check (char_length(btrim(allegation_title)) >= 3),
  incident_date date not null,
  allegation_details text not null check (char_length(btrim(allegation_details)) >= 10),
  workplace_rule text,
  severity_assessment text not null default 'moderate'
    check (severity_assessment in ('minor','moderate','serious','potentially_gross')),
  process_route text not null default 'formal'
    check (process_route in ('informal','formal')),
  status text not null default 'investigating'
    check (status in (
      'investigating','informal_correction','notice_issued','response_recorded',
      'meeting_scheduled','outcome_pending','outcome_issued','review_requested',
      'closed','withdrawn'
    )),

  notice_details text,
  notice_issued_at timestamptz,
  preparation_deadline timestamptz,
  representation_offered boolean not null default false,
  language_assistance_offered boolean not null default false,
  trade_union_role_declared boolean not null default false,
  union_consulted_at timestamptz,

  response_status text not null default 'pending'
    check (response_status in ('pending','provided','declined','no_response_after_opportunity')),
  employee_response text,
  response_recorded_at timestamptz,
  representation_type text not null default 'none'
    check (representation_type in ('none','fellow_employee','trade_union_representative','other_approved')),
  representative_name text,
  preferred_language text,
  interpreter_required boolean not null default false,

  meeting_scheduled_at timestamptz,
  chairperson_name text,
  hearing_notes text,

  finding text not null default 'pending'
    check (finding in ('pending','not_substantiated','partly_substantiated','substantiated','withdrawn')),
  sanction text not null default 'none'
    check (sanction in ('none','informal_correction','verbal_warning','written_warning','final_written_warning','dismissal','other')),
  outcome_reason text,
  mitigating_factors text,
  aggravating_factors text,
  consistency_notes text,
  relationship_assessment text,
  warning_valid_until date,
  outcome_issued_at timestamptz,
  external_rights_informed_at timestamptz,

  review_requested_at timestamptz,
  review_grounds text,
  review_decision text
    check (review_decision is null or review_decision in ('upheld','varied','overturned','remitted')),
  review_notes text,
  review_decided_at timestamptz,

  closure_note text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (incident_date <= current_date),
  check (preparation_deadline is null or notice_issued_at is null or preparation_deadline > notice_issued_at),
  check (warning_valid_until is null or outcome_issued_at is null or warning_valid_until >= outcome_issued_at::date)
);

create table if not exists public.hr_disciplinary_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.hr_disciplinary_cases(id) on delete restrict,
  event_type text not null
    check (event_type in (
      'case_opened','investigation_note','evidence_added','informal_correction',
      'notice_issued','employee_response','meeting_scheduled','meeting_note',
      'finding_outcome','review_requested','review_decided','case_closed','case_withdrawn','other'
    )),
  event_at timestamptz not null default now(),
  notes text not null check (char_length(btrim(notes)) >= 3),
  evidence_url text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.hr_disciplinary_rules enable row level security;
alter table public.hr_disciplinary_cases enable row level security;
alter table public.hr_disciplinary_events enable row level security;

drop policy if exists hr_disciplinary_rules_read on public.hr_disciplinary_rules;
create policy hr_disciplinary_rules_read
on public.hr_disciplinary_rules for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

drop policy if exists hr_disciplinary_cases_read on public.hr_disciplinary_cases;
create policy hr_disciplinary_cases_read
on public.hr_disciplinary_cases for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

drop policy if exists hr_disciplinary_events_read on public.hr_disciplinary_events;
create policy hr_disciplinary_events_read
on public.hr_disciplinary_events for select to authenticated
using (
  public.is_admin()
  or public.has_department_access('Human Resources','read')
);

revoke all on public.hr_disciplinary_rules from PUBLIC,anon,authenticated;
revoke all on public.hr_disciplinary_cases from PUBLIC,anon,authenticated;
revoke all on public.hr_disciplinary_events from PUBLIC,anon,authenticated;
grant select on public.hr_disciplinary_rules to authenticated;
grant select on public.hr_disciplinary_cases to authenticated;
grant select on public.hr_disciplinary_events to authenticated;
grant all on public.hr_disciplinary_rules to service_role;
grant all on public.hr_disciplinary_cases to service_role;
grant all on public.hr_disciplinary_events to service_role;

revoke all on sequence public.hr_disciplinary_case_seq from PUBLIC,anon,authenticated;
grant all on sequence public.hr_disciplinary_case_seq to service_role;

create or replace function public.hr_log_disciplinary_event(
  p_case_id uuid,
  p_event_type text,
  p_notes text,
  p_evidence_url text default null
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_case public.hr_disciplinary_cases%rowtype;
  v_id uuid;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then
    raise exception 'Human Resources edit access required' using errcode='42501';
  end if;

  select * into v_case
  from public.hr_disciplinary_cases
  where id=p_case_id;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;

  if p_event_type not in (
    'investigation_note','evidence_added','meeting_note','other'
  ) then
    raise exception 'This event type is controlled by a dedicated disciplinary action' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_notes,'')))<3 then
    raise exception 'Enter a meaningful case note' using errcode='22023';
  end if;
  if p_evidence_url is not null and btrim(p_evidence_url)<>'' and p_evidence_url !~* '^https?://' then
    raise exception 'Evidence URL must start with http:// or https://' using errcode='22023';
  end if;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,evidence_url,recorded_by)
  values(p_case_id,p_event_type,btrim(p_notes),nullif(btrim(coalesce(p_evidence_url,'')),''),auth.uid())
  returning id into v_id;

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_case_event_recorded','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('event_type',p_event_type,'event_id',v_id));

  return v_id;
end;
$$;

create or replace function public.hr_create_disciplinary_case(
  p_profile_id uuid,
  p_rule_id uuid,
  p_allegation_title text,
  p_incident_date date,
  p_allegation_details text,
  p_workplace_rule text default null,
  p_severity_assessment text default 'moderate',
  p_process_route text default 'formal'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_case_id uuid;
  v_case_number text;
  v_role text;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then
    raise exception 'Human Resources edit access required' using errcode='42501';
  end if;

  select lower(role) into v_role from public.profiles where id=p_profile_id;
  if v_role is distinct from 'staff' then
    raise exception 'Staff disciplinary cases may only be opened for Staff profiles' using errcode='22023';
  end if;
  if not exists(select 1 from public.hr_disciplinary_rules where id=p_rule_id and active=true) then
    raise exception 'Choose an active disciplinary rule category' using errcode='22023';
  end if;
  if p_incident_date is null or p_incident_date>current_date then
    raise exception 'Incident date cannot be in the future' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_allegation_title,'')))<3 then
    raise exception 'Enter a clear allegation title' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_allegation_details,'')))<10 then
    raise exception 'Describe the alleged facts in sufficient detail' using errcode='22023';
  end if;
  if p_severity_assessment not in ('minor','moderate','serious','potentially_gross') then
    raise exception 'Invalid preliminary severity assessment' using errcode='22023';
  end if;
  if p_process_route not in ('informal','formal') then
    raise exception 'Invalid disciplinary process route' using errcode='22023';
  end if;

  v_case_number:='HR-DIS-'||to_char(current_date,'YYYY')||'-'
    ||lpad(nextval('public.hr_disciplinary_case_seq'::regclass)::text,6,'0');

  insert into public.hr_disciplinary_cases(
    case_number,profile_id,rule_id,allegation_title,incident_date,allegation_details,
    workplace_rule,severity_assessment,process_route,status,created_by,updated_by
  )
  values(
    v_case_number,p_profile_id,p_rule_id,btrim(p_allegation_title),p_incident_date,btrim(p_allegation_details),
    nullif(btrim(coalesce(p_workplace_rule,'')),''),p_severity_assessment,p_process_route,'investigating',auth.uid(),auth.uid()
  )
  returning id into v_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(v_case_id,'case_opened','Allegation recorded for preliminary investigation. No finding of misconduct has been made.',auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_case_opened','hr_disciplinary_case',v_case_id::text,p_profile_id,
    jsonb_build_object('case_number',v_case_number,'severity_assessment',p_severity_assessment,'process_route',p_process_route));

  return jsonb_build_object('id',v_case_id,'case_number',v_case_number);
end;
$$;

create or replace function public.hr_record_informal_correction(
  p_case_id uuid,
  p_employee_response text,
  p_correction text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then raise exception 'Human Resources edit access required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.status not in ('investigating','informal_correction') then
    raise exception 'This case is not available for informal correction' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_employee_response,'')))<3 then
    raise exception 'Record the employee response before informal correction' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_correction,'')))<3 then
    raise exception 'Record the advice/correction given' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set process_route='informal',
      status='closed',
      response_status='provided',
      employee_response=btrim(p_employee_response),
      response_recorded_at=now(),
      finding='substantiated',
      sanction='informal_correction',
      outcome_reason=btrim(p_correction),
      outcome_issued_at=now(),
      closure_note='Closed after informal corrective action.',
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'informal_correction','Employee response: '||btrim(p_employee_response)||E'\nCorrection/advice: '||btrim(p_correction),auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_informal_correction_recorded','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number));
end;
$$;

create or replace function public.hr_issue_disciplinary_notice(
  p_case_id uuid,
  p_notice_details text,
  p_preparation_deadline timestamptz,
  p_preferred_language text default null,
  p_trade_union_role_declared boolean default false,
  p_union_consulted_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then raise exception 'Human Resources edit access required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.status not in ('investigating','notice_issued') then
    raise exception 'Formal notice can only be issued during investigation' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_notice_details,'')))<10 then
    raise exception 'Notice must explain the allegation in sufficient detail' using errcode='22023';
  end if;
  if p_preparation_deadline is null or p_preparation_deadline<=now() then
    raise exception 'Give the employee a future preparation/response deadline' using errcode='22023';
  end if;
  if coalesce(p_trade_union_role_declared,false) and p_union_consulted_at is null then
    raise exception 'Where the employee is a trade union representative/office-bearer, record union consultation before formal discipline proceeds' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set process_route='formal',
      status='notice_issued',
      notice_details=btrim(p_notice_details),
      notice_issued_at=now(),
      preparation_deadline=p_preparation_deadline,
      representation_offered=true,
      language_assistance_offered=true,
      preferred_language=nullif(btrim(coalesce(p_preferred_language,'')),''),
      trade_union_role_declared=coalesce(p_trade_union_role_declared,false),
      union_consulted_at=p_union_consulted_at,
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'notice_issued','Formal allegation notice issued. Employee offered reasonable preparation time, assistance by a fellow employee/trade union representative, and reasonable language assistance.',auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_notice_issued','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number,'preparation_deadline',p_preparation_deadline));
end;
$$;

create or replace function public.hr_record_disciplinary_response(
  p_case_id uuid,
  p_response_status text,
  p_employee_response text default null,
  p_representation_type text default 'none',
  p_representative_name text default null,
  p_preferred_language text default null,
  p_interpreter_required boolean default false
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then raise exception 'Human Resources edit access required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.notice_issued_at is null then
    raise exception 'Issue the formal allegation notice before recording the formal response' using errcode='22023';
  end if;
  if p_response_status not in ('provided','declined','no_response_after_opportunity') then
    raise exception 'Choose a valid employee response status' using errcode='22023';
  end if;
  if p_response_status='provided' and char_length(btrim(coalesce(p_employee_response,'')))<3 then
    raise exception 'Record the employee response' using errcode='22023';
  end if;
  if p_response_status='no_response_after_opportunity' and v_case.preparation_deadline>now() then
    raise exception 'The recorded response opportunity has not yet expired' using errcode='22023';
  end if;
  if p_representation_type not in ('none','fellow_employee','trade_union_representative','other_approved') then
    raise exception 'Choose a valid representation type' using errcode='22023';
  end if;
  if p_representation_type<>'none' and char_length(btrim(coalesce(p_representative_name,'')))<2 then
    raise exception 'Record the representative name' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set status='response_recorded',
      response_status=p_response_status,
      employee_response=nullif(btrim(coalesce(p_employee_response,'')),''),
      response_recorded_at=now(),
      representation_type=p_representation_type,
      representative_name=nullif(btrim(coalesce(p_representative_name,'')),''),
      preferred_language=coalesce(nullif(btrim(coalesce(p_preferred_language,'')),''),preferred_language),
      interpreter_required=coalesce(p_interpreter_required,false),
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'employee_response',
    'Response status: '||p_response_status||
    case when p_employee_response is not null and btrim(p_employee_response)<>'' then E'\nEmployee response: '||btrim(p_employee_response) else '' end,
    auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_employee_response_recorded','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number,'response_status',p_response_status,'representation_type',p_representation_type));
end;
$$;

create or replace function public.hr_schedule_disciplinary_meeting(
  p_case_id uuid,
  p_meeting_at timestamptz,
  p_chairperson_name text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then raise exception 'Human Resources edit access required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.response_status='pending' then
    raise exception 'Record the employee response/opportunity before scheduling the decision meeting' using errcode='22023';
  end if;
  if p_meeting_at is null then raise exception 'Enter the meeting date and time' using errcode='22023'; end if;
  if char_length(btrim(coalesce(p_chairperson_name,'')))<2 then
    raise exception 'Record the chairperson/decision-maker' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set status='meeting_scheduled',
      meeting_scheduled_at=p_meeting_at,
      chairperson_name=btrim(p_chairperson_name),
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'meeting_scheduled','Disciplinary meeting/enquiry scheduled for '||p_meeting_at::text||'. Chairperson/decision-maker: '||btrim(p_chairperson_name),auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_meeting_scheduled','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number,'meeting_at',p_meeting_at,'chairperson_name',btrim(p_chairperson_name)));
end;
$$;

create or replace function public.hr_record_disciplinary_outcome(
  p_case_id uuid,
  p_finding text,
  p_sanction text,
  p_outcome_reason text,
  p_mitigating_factors text default null,
  p_aggravating_factors text default null,
  p_consistency_notes text default null,
  p_relationship_assessment text default null,
  p_warning_valid_until date default null,
  p_external_rights_informed boolean default false
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Human Resources')
  ) then raise exception 'Human Resources approval authority required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.process_route<>'formal' then
    raise exception 'Use the informal-correction workflow for informal cases' using errcode='22023';
  end if;
  if v_case.notice_issued_at is null or v_case.response_status='pending' then
    raise exception 'A formal outcome requires notice and a genuine opportunity for the employee to respond' using errcode='22023';
  end if;
  if p_finding not in ('not_substantiated','partly_substantiated','substantiated','withdrawn') then
    raise exception 'Choose a valid finding' using errcode='22023';
  end if;
  if p_sanction not in ('none','verbal_warning','written_warning','final_written_warning','dismissal','other') then
    raise exception 'Choose a valid formal sanction' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_outcome_reason,'')))<10 then
    raise exception 'Record clear written reasons for the finding and sanction' using errcode='22023';
  end if;

  if p_finding in ('not_substantiated','withdrawn') and p_sanction<>'none' then
    raise exception 'A not-substantiated/withdrawn case cannot carry a disciplinary sanction' using errcode='22023';
  end if;
  if p_sanction in ('written_warning','final_written_warning') and p_warning_valid_until is not null and p_warning_valid_until<current_date then
    raise exception 'Warning validity date cannot be in the past' using errcode='22023';
  end if;

  if p_sanction='dismissal' then
    if p_finding<>'substantiated' then
      raise exception 'Dismissal requires a substantiated finding' using errcode='22023';
    end if;
    if char_length(btrim(coalesce(p_consistency_notes,'')))<5 then
      raise exception 'Before dismissal, record how consistency with comparable cases was considered' using errcode='22023';
    end if;
    if char_length(btrim(coalesce(p_relationship_assessment,'')))<10 then
      raise exception 'Before dismissal, record why continued employment is considered intolerable' using errcode='22023';
    end if;
    if not coalesce(p_external_rights_informed,false) then
      raise exception 'Before recording dismissal, confirm the employee was informed of applicable external dispute-referral rights' using errcode='22023';
    end if;
  end if;

  update public.hr_disciplinary_cases
  set status='outcome_issued',
      finding=p_finding,
      sanction=p_sanction,
      outcome_reason=btrim(p_outcome_reason),
      mitigating_factors=nullif(btrim(coalesce(p_mitigating_factors,'')),''),
      aggravating_factors=nullif(btrim(coalesce(p_aggravating_factors,'')),''),
      consistency_notes=nullif(btrim(coalesce(p_consistency_notes,'')),''),
      relationship_assessment=nullif(btrim(coalesce(p_relationship_assessment,'')),''),
      warning_valid_until=p_warning_valid_until,
      outcome_issued_at=now(),
      external_rights_informed_at=case when coalesce(p_external_rights_informed,false) then now() else null end,
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'finding_outcome',
    'Finding: '||p_finding||E'\nSanction: '||p_sanction||E'\nReasons: '||btrim(p_outcome_reason),
    auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_outcome_issued','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number,'finding',p_finding,'sanction',p_sanction));

  -- Deliberately no automatic account deactivation, termination or payroll action.
end;
$$;

create or replace function public.hr_request_disciplinary_review(
  p_case_id uuid,
  p_review_grounds text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then raise exception 'Human Resources edit access required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.status<>'outcome_issued' then
    raise exception 'Internal review can only be recorded after an outcome has been issued' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_review_grounds,'')))<5 then
    raise exception 'Record the grounds for internal review/appeal' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set status='review_requested',
      review_requested_at=now(),
      review_grounds=btrim(p_review_grounds),
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'review_requested','Internal review/appeal requested: '||btrim(p_review_grounds),auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_review_requested','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number));
end;
$$;

create or replace function public.hr_decide_disciplinary_review(
  p_case_id uuid,
  p_review_decision text,
  p_review_notes text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Human Resources')
  ) then raise exception 'Human Resources approval authority required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.status<>'review_requested' then
    raise exception 'No internal review/appeal is pending' using errcode='22023';
  end if;
  if p_review_decision not in ('upheld','varied','overturned','remitted') then
    raise exception 'Choose a valid internal review decision' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_review_notes,'')))<10 then
    raise exception 'Record clear reasons for the review decision' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set status=case when p_review_decision='remitted' then 'outcome_pending' else 'closed' end,
      review_decision=p_review_decision,
      review_notes=btrim(p_review_notes),
      review_decided_at=now(),
      closure_note=case when p_review_decision='remitted' then null else 'Closed after internal review/appeal.' end,
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'review_decided','Internal review decision: '||p_review_decision||E'\nReasons: '||btrim(p_review_notes),auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_review_decided','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number,'review_decision',p_review_decision));
end;
$$;

create or replace function public.hr_close_disciplinary_case(
  p_case_id uuid,
  p_closure_note text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then raise exception 'Human Resources edit access required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.status not in ('outcome_issued','outcome_pending') then
    raise exception 'Only an outcome-stage case can be closed manually' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_closure_note,'')))<5 then
    raise exception 'Record a closure note' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set status='closed',
      closure_note=btrim(p_closure_note),
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'case_closed','Case closed: '||btrim(p_closure_note),auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_case_closed','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number));
end;
$$;

create or replace function public.hr_withdraw_disciplinary_case(
  p_case_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare v_case public.hr_disciplinary_cases%rowtype;
begin
  if not (
    public.is_admin()
    or public.has_department_access('Human Resources','edit')
  ) then raise exception 'Human Resources edit access required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.status in ('closed','withdrawn') then
    raise exception 'This case is already closed/withdrawn' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_reason,'')))<5 then
    raise exception 'Record why the allegation/case is being withdrawn' using errcode='22023';
  end if;

  update public.hr_disciplinary_cases
  set status='withdrawn',
      finding='withdrawn',
      sanction='none',
      closure_note=btrim(p_reason),
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(p_case_id,'case_withdrawn','Case withdrawn: '||btrim(p_reason),auth.uid());

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(auth.uid(),'disciplinary_case_withdrawn','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object('case_number',v_case.case_number,'reason',btrim(p_reason)));
end;
$$;

create or replace function public.hr_decide_disciplinary_review_v2(
  p_case_id uuid,
  p_review_decision text,
  p_review_notes text,
  p_revised_finding text default null,
  p_revised_sanction text default null,
  p_revised_warning_valid_until date default null
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_case public.hr_disciplinary_cases%rowtype;
  v_finding text;
  v_sanction text;
  v_warning date;
begin
  if not (
    public.is_admin()
    or public.has_department_approval('Human Resources')
  ) then raise exception 'Human Resources approval authority required' using errcode='42501'; end if;

  select * into v_case from public.hr_disciplinary_cases where id=p_case_id for update;
  if not found then raise exception 'Disciplinary case not found' using errcode='P0002'; end if;
  if v_case.status<>'review_requested' then
    raise exception 'No internal review/appeal is pending' using errcode='22023';
  end if;
  if p_review_decision not in ('upheld','varied','overturned','remitted') then
    raise exception 'Choose a valid internal review decision' using errcode='22023';
  end if;
  if char_length(btrim(coalesce(p_review_notes,'')))<10 then
    raise exception 'Record clear reasons for the review decision' using errcode='22023';
  end if;

  v_finding:=v_case.finding;
  v_sanction:=v_case.sanction;
  v_warning:=v_case.warning_valid_until;

  if p_review_decision='overturned' then
    v_finding:='not_substantiated';
    v_sanction:='none';
    v_warning:=null;
  elsif p_review_decision='varied' then
    if p_revised_finding not in ('not_substantiated','partly_substantiated','substantiated','withdrawn') then
      raise exception 'A varied review requires the revised finding' using errcode='22023';
    end if;
    if p_revised_sanction not in ('none','verbal_warning','written_warning','final_written_warning','dismissal','other') then
      raise exception 'A varied review requires the revised sanction' using errcode='22023';
    end if;
    if p_revised_finding in ('not_substantiated','withdrawn') and p_revised_sanction<>'none' then
      raise exception 'A not-substantiated/withdrawn revised finding cannot carry a sanction' using errcode='22023';
    end if;
    if p_revised_sanction='dismissal' then
      raise exception 'A review may not newly impose dismissal through the variation shortcut. Remit the matter for a properly considered outcome instead.' using errcode='22023';
    end if;
    if p_revised_sanction in ('written_warning','final_written_warning')
       and p_revised_warning_valid_until is not null
       and p_revised_warning_valid_until<current_date then
      raise exception 'Revised warning validity date cannot be in the past' using errcode='22023';
    end if;
    v_finding:=p_revised_finding;
    v_sanction:=p_revised_sanction;
    v_warning:=case when p_revised_sanction in ('written_warning','final_written_warning') then p_revised_warning_valid_until else null end;
  end if;

  update public.hr_disciplinary_cases
  set status=case when p_review_decision='remitted' then 'outcome_pending' else 'closed' end,
      review_decision=p_review_decision,
      review_notes=btrim(p_review_notes),
      review_decided_at=now(),
      finding=case when p_review_decision='remitted' then finding else v_finding end,
      sanction=case when p_review_decision='remitted' then sanction else v_sanction end,
      warning_valid_until=case when p_review_decision='remitted' then warning_valid_until else v_warning end,
      closure_note=case
        when p_review_decision='remitted' then null
        when p_review_decision='overturned' then 'Closed after internal review: original outcome overturned.'
        when p_review_decision='varied' then 'Closed after internal review: original outcome varied.'
        else 'Closed after internal review: original outcome upheld.'
      end,
      updated_by=auth.uid(),
      updated_at=now()
  where id=p_case_id;

  insert into public.hr_disciplinary_events(case_id,event_type,notes,recorded_by)
  values(
    p_case_id,'review_decided',
    'Internal review decision: '||p_review_decision||
    case when p_review_decision='varied' then E'\nRevised finding: '||v_finding||E'\nRevised sanction: '||v_sanction else '' end||
    E'\nReasons: '||btrim(p_review_notes),
    auth.uid()
  );

  insert into public.hr_audit_log(actor_id,action,entity_type,entity_id,subject_profile_id,details)
  values(
    auth.uid(),'disciplinary_review_decided','hr_disciplinary_case',p_case_id::text,v_case.profile_id,
    jsonb_build_object(
      'case_number',v_case.case_number,
      'review_decision',p_review_decision,
      'revised_finding',case when p_review_decision in ('varied','overturned') then v_finding else null end,
      'revised_sanction',case when p_review_decision in ('varied','overturned') then v_sanction else null end
    )
  );
end;
$$;

revoke all on function public.hr_decide_disciplinary_review(uuid,text,text) from PUBLIC,anon,authenticated;
grant execute on function public.hr_decide_disciplinary_review(uuid,text,text) to service_role;

revoke all on function public.hr_decide_disciplinary_review_v2(uuid,text,text,text,text,date) from PUBLIC,anon;
grant execute on function public.hr_decide_disciplinary_review_v2(uuid,text,text,text,text,date) to authenticated,service_role;

revoke all on function public.hr_log_disciplinary_event(uuid,text,text,text) from PUBLIC,anon;
revoke all on function public.hr_create_disciplinary_case(uuid,uuid,text,date,text,text,text,text) from PUBLIC,anon;
revoke all on function public.hr_record_informal_correction(uuid,text,text) from PUBLIC,anon;
revoke all on function public.hr_issue_disciplinary_notice(uuid,text,timestamptz,text,boolean,timestamptz) from PUBLIC,anon;
revoke all on function public.hr_record_disciplinary_response(uuid,text,text,text,text,text,boolean) from PUBLIC,anon;
revoke all on function public.hr_schedule_disciplinary_meeting(uuid,timestamptz,text) from PUBLIC,anon;
revoke all on function public.hr_record_disciplinary_outcome(uuid,text,text,text,text,text,text,text,date,boolean) from PUBLIC,anon;
revoke all on function public.hr_request_disciplinary_review(uuid,text) from PUBLIC,anon;
revoke all on function public.hr_decide_disciplinary_review(uuid,text,text) from PUBLIC,anon;
revoke all on function public.hr_close_disciplinary_case(uuid,text) from PUBLIC,anon;
revoke all on function public.hr_withdraw_disciplinary_case(uuid,text) from PUBLIC,anon;

grant execute on function public.hr_log_disciplinary_event(uuid,text,text,text) to authenticated,service_role;
grant execute on function public.hr_create_disciplinary_case(uuid,uuid,text,date,text,text,text,text) to authenticated,service_role;
grant execute on function public.hr_record_informal_correction(uuid,text,text) to authenticated,service_role;
grant execute on function public.hr_issue_disciplinary_notice(uuid,text,timestamptz,text,boolean,timestamptz) to authenticated,service_role;
grant execute on function public.hr_record_disciplinary_response(uuid,text,text,text,text,text,boolean) to authenticated,service_role;
grant execute on function public.hr_schedule_disciplinary_meeting(uuid,timestamptz,text) to authenticated,service_role;
grant execute on function public.hr_record_disciplinary_outcome(uuid,text,text,text,text,text,text,text,date,boolean) to authenticated,service_role;
grant execute on function public.hr_request_disciplinary_review(uuid,text) to authenticated,service_role;
grant execute on function public.hr_decide_disciplinary_review(uuid,text,text) to authenticated,service_role;
grant execute on function public.hr_close_disciplinary_case(uuid,text) to authenticated,service_role;
grant execute on function public.hr_withdraw_disciplinary_case(uuid,text) to authenticated,service_role;
