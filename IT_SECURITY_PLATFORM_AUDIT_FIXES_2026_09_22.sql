-- Funda Online Academy — IT, Security & Platform audit fixes
-- 2026-09-22
-- Safe hardening only. No production evidence records are created and no section is locked.

revoke all on table public.security_incidents from anon;
revoke all on table public.security_access_reviews from anon;
revoke all on table public.platform_security_checks from anon;

revoke update, delete on table public.security_access_reviews from authenticated;
revoke update, delete on table public.platform_security_checks from authenticated;
revoke delete on table public.security_incidents from authenticated;
grant select, insert on table public.security_access_reviews to authenticated;
grant select, insert on table public.platform_security_checks to authenticated;
grant select, insert, update on table public.security_incidents to authenticated;

revoke all on table public.ambassador_agreement_acceptances from anon, authenticated;
revoke all on table public.ambassador_agreement_deliveries from anon, authenticated;
revoke all on table public.ambassador_agreement_versions from anon, authenticated;
grant all on table public.ambassador_agreement_acceptances to service_role;
grant all on table public.ambassador_agreement_deliveries to service_role;
grant all on table public.ambassador_agreement_versions to service_role;

revoke execute on function public.check_legacy_entitlement(uuid,text,text) from public, anon;
grant execute on function public.check_legacy_entitlement(uuid,text,text) to authenticated, service_role;

revoke execute on function public.evaluate_legacy_certificate_text(uuid,text,text) from public, anon;
grant execute on function public.evaluate_legacy_certificate_text(uuid,text,text) to authenticated, service_role;

revoke execute on function public.get_own_ambassador_login_status() from public, anon;
grant execute on function public.get_own_ambassador_login_status() to authenticated, service_role;

alter table public.security_incidents
  add constraint security_incidents_description_evidence_check
  check (char_length(btrim(coalesce(description,''))) >= 5);

alter table public.security_access_reviews
  add constraint security_access_reviews_notes_evidence_check
  check (char_length(btrim(coalesce(notes,''))) >= 5);

alter table public.platform_security_checks
  add constraint platform_security_checks_evidence_required_check
  check (char_length(btrim(coalesce(evidence,''))) >= 5);

create index if not exists security_access_reviews_subject_reviewed_idx
  on public.security_access_reviews(subject_profile_id, reviewed_at desc);
create index if not exists security_access_reviews_reviewer_reviewed_idx
  on public.security_access_reviews(reviewed_by, reviewed_at desc);
create index if not exists security_incidents_reported_detected_idx
  on public.security_incidents(reported_by, detected_at desc);
create index if not exists security_incidents_assigned_status_detected_idx
  on public.security_incidents(assigned_to, status, detected_at desc);
create index if not exists platform_security_checks_checked_by_at_idx
  on public.platform_security_checks(checked_by, checked_at desc);
create index if not exists platform_security_checks_name_at_idx
  on public.platform_security_checks(check_name, checked_at desc);
