# Funda Online Academy — Admin Command Center System Lock

**Owner decision:** Aziwe Futhe, Founder & CEO  
**Lock date:** 23 September 2026 (South Africa time)  
**Scope:** Full Admin Command Center system behaviour, integration, security boundaries, typography and change control.

## Purpose

This lock protects the Admin Command Center as the Academy's operational office. It preserves the approved department workspaces while requiring the shell, data connections and security boundaries to continue working together without unrelated regressions.

## Behaviour locked

- A normal browser refresh stays on the current valid Admin section. The saved section/hash behaviour remains the source of refresh continuity.
- A new Admin entry from the approved Login page starts on **My Dashboard**. A previous Admin section must not survive a completed logout/login journey as the landing section.
- Hard browser refresh uses manual browser scroll restoration so the browser does not perform a second late scroll restoration on top of the Admin renderer.
- Manual/module refreshes remain non-destructive and must preserve healthy visible data when a temporary query fails.
- Each protected Admin area keeps its own approved refresh policy. Academic remains manual-refresh-only; Realtime/edit-safe areas must not be converted into competing short polling loops.
- Shared Admin modules already owned by the central `supabase-config.js` loader must not also be injected by the Admin wrapper.

## Integration and data integrity checkpoint

The 23 September 2026 audit confirmed:

- The live Supabase project is healthy.
- Public Academy tables inspected in the audit have RLS enabled.
- Core relationship checks found no orphaned enrolment→profile, enrolment→course, module→course, lesson→module or assessment→course records.
- Public-schema constraints reported no unvalidated constraints.
- The Dashboard's primary live source tables used by its Realtime channel are present in the Supabase Realtime publication.
- High-value sampled Admin/CEO/academic SECURITY DEFINER functions enforce authenticated role/authority checks internally. Public catalogue, verification and referral-tracking functions remain intentionally public and narrowly scoped.
- The public calendar-notification dispatcher uses its existing dispatch-secret check before service-role work; JWT-disabled status is therefore not treated as anonymous service-role access.
- Audit/accountability remains distributed across the approved operational audit tables and Supabase authentication audit events. The lock does not require logging harmless read-only UI actions.

## Typography locked

- **Source Sans 3** remains the Admin Command Center typeface across tabs, forms, tables, dialogs and dynamically rendered Admin modules.
- Purpose-built official document layouts may keep their separately approved print typography.
- Academic Admin readability overrides remain in force so meaningful interface copy is not restored to the old micro-text presentation.

## Protected Admin areas

The lock covers the full current Admin navigation:

1. My Dashboard
2. Management & Governance
3. Finance & Accounting
4. Communication Hub
5. Student Support & CRM
6. Marketing & Admissions
7. Ambassador Programme
8. Enrolments & Courses
9. Academic, Assessments & Content
10. IT, Security & Platform
11. HR & Team
12. Reports, Compliance & Audit
13. Expenses & Income Tracker

Existing area-specific owner approvals remain authoritative. This system-wide lock does not reopen or redesign them.

## Academic clarification

Academic, Assessments & Content is included in the system-wide protection even though it was not previously logged as a final standalone section. The current Academic operational behaviour is protected from accidental changes.

This lock **does not approve the rejected Statement of Results template**. Statement-of-Results document generation remains on hold until Aziwe Futhe explicitly reopens and approves that template. The approved Certificate Template remains unchanged.

## Dynamic records are not frozen

The lock protects software behaviour, permissions, calculations, navigation, presentation and integration—not normal Academy operations. Legitimate new students, enrolments, payments, communications, support activity, academic records, Ambassador activity, staff records, audit entries and other operational records continue through their approved workflows.

## Change-control rule

Future changes to the Admin Command Center require an explicit owner request that identifies the exact area being reopened. Work in one Admin area is not permission to change another area or the shared shell.

Any shared loader/shell change must regression-check:

- Admin authentication and role separation
- fresh Login → My Dashboard landing
- browser refresh → same current Admin section
- non-destructive refresh behaviour
- Admin navigation/sidebar
- Source Sans 3 typography
- My Dashboard
- locked IT/Security workspace
- Academic manual-refresh policy
- Marketing Realtime/edit-safe behaviour
- protected Ambassador/Enrolment/Finance/Communication/Support/HR/Audit workspaces

The shared-shell lock does not modify Ambassador programme/application/login/referral/earnings/banking/support code or permissions; those boundaries remain under their existing lock.

**Fix up; do not break up.**
