# Funda Online Academy — IT, Security & Platform Lock

Owner approval date: 22 September 2026 (South Africa time)
Owner: Aziwe Futhe, Founder & CEO
Approved functional checkpoint: `f89ca24cf8c51ac5ea39aa982a0a869088067cf9`
Status: FINAL OWNER-APPROVED AND LOCKED

## Locked scope

The Admin **IT, Security & Platform** workspace is now a change-controlled protected surface. It must not be changed unless Aziwe Futhe explicitly reopens this exact area.

The approved state preserves:

- **Manual refresh only** for IT, Security & Platform. Do not add timed refresh, background auto-refresh or Realtime redraw behaviour to this workspace.
- Access Governance separated into Student, Staff/Admin and Deleted/Archived account views, with readable search and pagination.
- Staff Access Codes must never be loaded or displayed as stored plaintext. Rotation remains an explicit, confirmed action; a new code invalidates the prior code only when an authorised user deliberately performs that rotation.
- Security Incidents remain evidence-based records. Do not fabricate incident evidence or status history.
- Platform Controls remain evidence-based checks. Do not create false control-check records merely to make the screen appear complete.
- Access Reviews remain governance evidence and do not themselves deactivate, delete or change a login.
- Audit Activity remains data-driven, readable, and limited to **10 visible events per page** with Previous/Next navigation.
- The IT **Refresh** control must perform a real data reload and give visible refresh feedback. A non-performing Refresh control is not acceptable.
- Current security permission/RLS hardening, hashed Staff Access Code verification, audit logging and protected account boundaries must not be weakened.
- Deleted/archived account evidence must remain separated from active accounts and retained only according to the approved accountability model.
- Source Sans 3 readability and the approved navy/gold Admin presentation are part of the locked state.
- Existing working Student, Ambassador, Login, HR, Academic and other Admin areas are outside this lock and must not be disturbed by future IT changes.

## Change-control rule

Future work in Academic, Assessments & Content or any other Admin tab does **not** reopen IT, Security & Platform. Shared Admin shell/loader changes must regression-check this locked IT workspace and preserve its manual-refresh behaviour, navigation, data loading and controls.

A newly discovered defect or requested improvement is a change request only. Implementation requires explicit owner approval to reopen the affected IT/Security area.
