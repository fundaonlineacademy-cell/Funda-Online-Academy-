# Funda Online Academy — Protected Approved State

Last established: 18 September 2026 (South Africa time)
Baseline commit: `39c46c22a02e1f96824f2c4a58d1b4c528fdf842`

This file exists to prevent regressions and the reintroduction of previously corrected or rejected behaviour.

## How to use this file

- Treat the baseline commit above as the current live technical checkpoint.
- A baseline is **not** permission to copy old code from earlier commits.
- Do not restore behaviour from an older commit merely because it previously existed.
- Preserve the decisions below unless Aziwe Futhe explicitly requests a change.
- If a new owner decision supersedes an item below, update this file in the same controlled change.

## Protected current decisions

### Home page — FINAL OWNER-APPROVED STATE

The Home page (`index.html`) is owner-approved as the final public Home-page structure and design as of 18 September 2026.

- Do not redesign, restyle, reorder, add, remove, rename or rewrite Home-page sections, navigation, CTAs, course-card controls, Academy Identity, Head of Academics message, footer, contact details, typography, colours, spacing or responsive structure unless Aziwe Futhe explicitly reopens the Home page for change.
- The approved Home-page course-card behaviour is: the card body/image/title/price is not a navigation target; **View Course** opens the course overview; **Enroll Now** opens Student account creation and preserves an Ambassador referral code when present.
- The approved General Enquiries address is `info@fundaonlineacademy.co.za`; do not restore the retired `infor@fundaonlineacademy.co.za` typo.
- Existing Home-page navigation destinations and public pathways must remain intact unless explicitly changed by the owner.
- Shared/global scripts that execute on the Home page must preserve the approved Home-page render and behaviour. A change to such a script is not permission to alter the Home page indirectly.
- Do not reintroduce legacy, retired, superseded or duplicate Home-page content from older commits, cached implementations or prior overrides.
- A direct change to `index.html` requires an explicit Home-page owner approval marker in the pull request. Routine work on other pages must leave the Home page untouched.

### Login / authentication — FINAL OWNER-APPROVED STATE

The Login section is owner-approved as the final Academy authentication structure as of 18 September 2026.

- Funda Online Academy has three approved portal entry journeys only: **Student**, **Staff / Admin**, and **Ambassador**. Do not introduce a fourth portal or alternate login route unless Aziwe Futhe explicitly approves it.
- `login.html` is the approved shared login for **Student** and **Staff / Admin** access.
- `ambassador-login.html` is the approved Ambassador / Ambassador-applicant login.
- Student login must continue to use the registered Academy email and password and route the learner according to the existing approved Student journey.
- Staff/Admin access is strict: the user must provide the registered Academy **email**, **password**, and assigned **Staff Access Code**. Staff/Admin role verification must remain enforced; a normal Student or Ambassador account must not gain Staff/Admin access through this route.
- Successful Admin login routes to the **Admin Command Center**; successful Staff login routes to the **Staff Workspace**.
- Ambassador sign-in must keep the existing application-status gate. Pending, waitlisted or declined applicants remain in the approved status-only journey; approved/activated Ambassadors retain the existing portal journey.
- **Forgot password** is an approved part of the Login standard. Recovery requires access to the registered email address, uses Supabase recovery, opens the approved `reset-password.html` flow, requires **New Password + Confirm New Password**, and returns the user to the correct login entry after the update.
- The approved Login navigation remains: **Create Student Account** → `create-account.html`; **Ambassador Portal Login** → `ambassador-login.html`; **Browse Courses — No Login Needed** → `courses-public.html`.
- The approved Create Student Account journey is `create-account.html` → working `auth.html` registration form → Student profile creation → course selection/onboarding. This route must never loop between `create-account.html` and `auth.html`.
- On mobile/tablet layouts up to 1023px, the shared Login must keep the established order: **brand panel first, authentication panel second**.
- The approved Login design, wording, fields, role controls, destinations, recovery behaviour and security requirements must not be redesigned, weakened, bypassed or replaced unless the owner explicitly reopens the Login section.
- `create-account.html` is the approved public Create Student Account entry and currently hands the learner to the working registration form in `auth.html`. **Do not replace `auth.html` with a redirect while `create-account.html` depends on it.** Any future migration must first move the complete tested registration form and referral-claim behaviour to the new authoritative page before retiring `auth.html`. The old `auth.js` login/reset logic and malformed duplicate `reset-password. html` remain retired.
- Shared/global scripts that can alter Login/authentication must preserve this final state and require Login regression confirmation when changed.

### Create Student Account — FINAL OWNER-APPROVED STATE

The Create Student Account journey is owner-approved as the final Student registration structure and design as of 18 September 2026.

- `create-account.html` is the approved public entry point and `auth.html` is the current working Student registration form behind it. This dependency must not be redirected, removed or replaced unless the complete tested registration behaviour has first been migrated and explicitly approved.
- The approved required Student profile details are: **Name, Surname, Gender, Phone / WhatsApp, Email address, Confirm email, Password, Confirm password**, plus acceptance of the approved **Student Terms & Privacy** requirements.
- The approved password standard for new Student accounts is: **minimum 8 characters, at least one letter, at least one number and at least one special symbol**. Confirm Password must match. This rule applies to future password creation and does not invalidate existing account passwords.
- The owner-supplied FOA transparent master logo is the approved transparent brand asset for this registration page. Do not substitute the retired defective Results-template transparent asset on Create Student Account.
- Student Terms & Privacy must remain visible and acceptance must be required before account creation. The full Student Terms, Privacy, Payment and Refund Policies link must remain available.
- Successful account creation must create/maintain the approved Student profile and Student record, preserve policy acceptance recording where applicable, and continue to the approved onboarding/course-selection journey.
- **Course selection is not compulsory at the moment the Student account is created.** A Student account may exist before a course has been selected; the learner can continue the enrolment/course-selection journey later.
- When a valid Ambassador referral code is present for an eligible new Student account, the referral claim must continue to be tied to the authenticated Student account. Once securely attributed, the approved Ambassador attribution must not be overwritten by a later Ambassador code.
- A referral-link click alone is not authoritative attribution. The approved referral record is established through the eligible Student account-creation/claim process.
- The approved registration form must remain usable on desktop and mobile and must not loop between `create-account.html` and `auth.html`.
- Do not redesign, restyle, reorder, add, remove, rename or weaken registration fields, validation, Terms & Privacy, password security, logo presentation, referral handoff, profile creation or post-registration routing unless Aziwe Futhe explicitly reopens Create Student Account.
- Shared/global scripts that can alter registration, referral attribution, account creation or onboarding handoff must preserve this final state and require Create Student Account regression confirmation when changed.

### Enrollment Step 1 — Choose Your Course — FINAL OWNER-APPROVED STATE

Enrollment Step 1 on `onboarding.html` is owner-approved as the final **Choose Your Course** structure and behaviour as of 18 September 2026. This approval applies to Step 1 only; later enrollment steps remain subject to separate owner review and approval.

- The approved course source is the Academy's active course catalogue. At the approval checkpoint there are **35 active courses**, and Step 1 must continue to surface all active courses rather than silently omitting eligible catalogue entries.
- The approved browser shows **up to 10 courses per page**. Pagination must retain **Previous** and **Next** controls and accurate page/range status.
- Course cards use the approved responsive layout: up to **3 cards across on desktop**, fewer columns on smaller screens, while the 10-course page size remains unchanged.
- The approved search allows the learner to search the available course catalogue and clear the search without losing the integrity of the catalogue.
- Each approved course card retains its Academy branding/presentation and the current course information/actions, including course title, description preview / **View more**, duration, price, image/fallback presentation and **Select this course**.
- A selected course must remain visibly identifiable. The learner must be able to **Clear selection** and choose another course before continuing.
- **Continue** must use the learner's current selected course and must not silently continue with a different or stale selection.
- Step 1 must remain usable with the existing draft/progress behaviour so a valid course choice can be carried into the next enrollment stage without corrupting another learner's or another course's state.
- Search, pagination, selection, Clear Selection, View more, Continue, responsive card layout, branding, typography and Step 1 navigation are part of this final approved standard.
- Do not redesign, restyle, reorder, remove, rename, weaken or replace Step 1 behaviour unless Aziwe Futhe explicitly reopens Enrollment Step 1.
- Changes to later enrollment stages are **not** permission to disturb Step 1. Any shared `onboarding.html` or onboarding-script change must regression-check this approved Step 1 before merge.

### Enrollment Step 2 — Student Type — FINAL OWNER-APPROVED STATE

Enrollment Step 2 on `onboarding.html` is owner-approved as the final **Student Type** structure, verification logic and presentation as of 18 September 2026. This approval applies to Step 2 only; Steps 3–5 remain subject to separate owner review and approval.

- The approved Student Type choices are:
  - **First-time Funda Online Academy student** — no legacy evidence fields are required on Step 2 and the standard current course price applies.
  - **I completed this course before** — Legacy Upgrade path with a provisional **70% discount** only after certificate verification.
  - **I paid for this course but did not complete it** — Restart path with a provisional **50% discount** only after prior-record/evidence verification.
  - **I studied with Funda Online Academy before, but this is a different course** — Returning Student path with a provisional **25% discount** only after previous-study verification.
- Legacy/returning paths must require the **ID number used with the previous Funda Online Academy record**. The completed-course path requires the old FOA certificate. The incomplete path requires the prior payment date, the reason the learner did not complete, and old proof of payment. The returning-student path requires proof of previous FOA study.
- For the completed-course 70% path, the approved system reads the uploaded certificate and checks **ID number, Student name and course** before provisionally unlocking the discounted amount. The result is provisional only: final Academy/Admin audit remains required before course access is approved.
- For incomplete/returning paths, the approved system checks the learner's historical FOA record for the selected claim type and course context. If automatic matching fails, the learner may submit evidence for **manual verification** and must not proceed as though the discount were already approved.
- The approved legacy evidence file types remain **PDF, JPG or PNG**, with the current 5 MB limit.
- The approved security model remains account-bound: legacy claims are created/viewed by the authenticated learner for their own account, while Admin retains the review/management authority.
- **Back to Course Selection** and **Continue** are approved Step 2 controls and must keep their current navigation behaviour.
- Step 2 draft persistence is approved: Student Type, legacy ID, prior payment date, non-completion reason and navigation state may be restored for the authenticated learner. For security/browser limitations, an uploaded evidence file itself is not treated as permanently restored; the learner must reselect/re-verify evidence after returning when required.
- Step 2 must keep the current approved branding, typography, spacing, responsive presentation, wording and selected-state behaviour.
- Changes to Steps 3–5 are not permission to disturb Step 2. Any shared onboarding/legacy-verification change must regression-check this approved Step 2 before merge.
- Do not redesign, restyle, reorder, remove, rename, weaken or replace Step 2 options, evidence requirements, verification rules, provisional-discount rules, navigation, persistence or presentation unless Aziwe Futhe explicitly reopens Enrollment Step 2.

### Browse Courses — FINAL OWNER-APPROVED STATE

The Browse Courses page (`courses-public.html`) is owner-approved as the final public course-catalogue structure and design as of 18 September 2026.

- Do not redesign, restyle, reorder, add, remove, rename or rewrite Browse Courses sections, course cards, filters, navigation, FAQs, contact area, typography, colours, spacing or responsive structure unless Aziwe Futhe explicitly reopens Browse Courses for change.
- The public course-result-count summary remains hidden in the approved presentation.
- The approved primary sort presentation is **Most Popular**, with the approved control placement preserved.
- Course cards must continue to show the approved course information and route **View Course** to the correct course overview. Student login and account-creation routes must continue to lead to the correct secure Student journey.
- The approved FAQ answer for enrolment timing states that Funda Online Academy **accepts registrations every day**. Do not restore the retired “throughout the year” wording.
- The public contact section remains intentionally WhatsApp-focused. Do not add a public enquiry email form or another general-enquiry channel to this page unless the owner explicitly requests it.
- Course images must fail gracefully: a remote-image failure must show the approved course placeholder rather than a broken-image icon. Successful images must keep the approved presentation.
- The approved public navigation routes to the Academy Map, Employers, Ambassadors, Student Login, Create Student Account, course catalogue/course-selection pathway and related public destinations must remain intact.
- The current Academy Map public and private destination routing has been owner-tested and approved: registered-learner destinations route through Student Login; Staff/Admin destinations route through the shared secure Staff/Admin login; Ambassador and Employer destinations remain role-appropriate. Do not bypass or silently redirect these protected pathways.
- Shared/global scripts that execute on or alter Browse Courses must preserve this final state. A change elsewhere is not permission to disturb Browse Courses indirectly.
- Do not reintroduce legacy, retired, duplicated or cached Browse Courses content from older commits or previous overrides.
- A direct change to `courses-public.html` requires explicit Browse Courses owner approval in the pull request.

### Student Dashboard / Student Library typography

- `Source Sans 3` is currently a **limited trial** on the Student Dashboard and Student Library only.
- Do not expand that font system-wide, to Admin, Ambassador, public pages, or other portals without explicit owner approval.
- Do not treat the trial as approval to redesign spacing, sizes, colours, cards, navigation, or other UI.

### Student onboarding / enrolment

The current baseline includes the recent five-step onboarding direction. Preserve it unless specifically asked to change it:

- Five-step onboarding flow.
- Payment separated into Step 4 of 5.
- Onboarding progress/draft persistence and autosave.
- Influencer / Brand Ambassador as an enrolment-source option.
- Official bank-account and beneficiary-verification wording currently in production.
- Enrolment-submission confirmation email hook.
- Public “enrol anytime” messaging and related course FAQ behaviour.

### Ambassador system — FINAL OWNER-APPROVED STATE

The Ambassador programme and portal are owner-approved as the final working Ambassador standard as of 18 September 2026.

- The approved Ambassador journey is: **public programme → dedicated application + login creation + programme agreement → Academy review → approved / waitlisted / declined → activation → Ambassador Login → Ambassador Portal**. Do not replace, bypass or redesign this journey unless Aziwe Futhe explicitly reopens the Ambassador system.
- `ambassadors.html`, `ambassador-application.html`, `ambassador-login.html` and `ambassador-portal-v2.html` are protected Ambassador surfaces. Their approved design, wording, navigation, responsive behaviour, status handling and security boundaries must be preserved.
- The approved Ambassador Login uses the email/password created during application. **Forgot password** sends recovery to the registered email, uses the approved secure reset-password flow and returns the user to Ambassador Login. Logout returns to Ambassador Login.
- Pending, waitlisted and declined applicants remain in the approved status-only journey. Full referral, earnings, banking, marketing and operational tools remain restricted until the approved/activated state.
- The approved referral link leads to **Student account creation**. Referral ownership is established only when a new eligible Student account is created and securely claimed; a link click alone is not an earned referral or commission.
- Existing referral attribution is permanent and must not be overwritten by a later Ambassador code. Old/cached browser referral data must not claim an existing learner.
- Ambassador referral summaries remain privacy-limited. The approved display uses the Student's first name plus the first letter of the surname where available, does not expose Student email/phone/ID/payment/assessment/private-support data, and may show **Course not yet selected** until an enrolment exists.
- Unconfirmed referrals must remain **R0 / not yet earned**. Ambassador earnings shown in the portal must come only from Academy-confirmed approved/paid earning records under the existing eligibility checks.
- The approved compensation plan, rank progression, achievement/performance rules and direct-referral-only model must not be altered or converted into downlines, recruitment commissions or team overrides unless explicitly approved by the owner.
- The approved banking flow remains restricted to the Ambassador's own payout details, with Finance verification and masked account display. Do not expose stored full bank account numbers back to the portal.
- Support tickets, replies and **Your Voice** submissions remain private, traceable, account-bound Ambassador records. An Ambassador must not be able to read another Ambassador's tickets, submissions, earnings, payouts or account details.
- The approved marketing resources, announcements, programme rules, agreement record, profile, referrals, earnings, payment history, banking, rank progress, compensation plan and support areas are part of the final Ambassador Dashboard.
- Current server-side ownership/security controls for Ambassador applications, referrals, earnings, payouts, support records and notifications must not be weakened, bypassed or replaced with browser-only hiding.
- Historical Ambassador SQL migrations are retained as migration/audit history. They are not permission to restore superseded UI or behaviour.
- Shared/global files that affect Ambassador referral attribution, account creation, recovery, public programme links or portal access require an Ambassador regression check before merge.
- Do not reintroduce retired, superseded, duplicate or cached Ambassador behaviour from older commits. A file name containing an older version/audit label is not by itself evidence that the file is obsolete; remove it only after proving it is not part of the approved runtime.
- A direct change to an Ambassador programme/application/login/portal/admin-Ambassador file or Ambassador SQL requires explicit Ambassador owner approval in the pull request.

## Explicit anti-regression rules

The following patterns are not acceptable unless Aziwe explicitly asks for them:

- Restoring an older page layout because it looks cleaner or is easier to code.
- Reintroducing a control, count, wording, colour, or navigation item that had been intentionally removed or replaced.
- Expanding a trial UI decision to the rest of the academy.
- Replacing an approved working flow with a “newer” or more generic pattern without owner instruction.
- Using an unrelated feature file as the permanent home for another feature.
- Adding a new override script to fight an existing override without first identifying the source conflict.
- Deleting, redirecting, renaming, disabling or replacing something merely because it appears old, duplicated or “legacy” without first proving it is not an active dependency of an approved flow.
- Retiring a working dependency before the replacement has the complete tested behaviour and all direct/indirect callers have been moved safely.

## Architecture risks already identified — do not worsen them

These are known cleanup targets, not permission to alter them during unrelated tasks:

1. `supabase-config.js` currently acts as a broad global/page-specific script loader and therefore has a large blast radius.
2. `ambassador-referral-tracking.js` currently mixes Ambassador referral logic with Staff/Admin login protection and public-course FAQ loading.
3. Some UI corrections rely on reapplication/timers/observers. These should be consolidated carefully in dedicated cleanup work rather than layered with more overrides.

## Owner decision log

Add future protected decisions here in concise form, with the date and the owner request that established them. Do not remove older entries merely because code was refactored; mark them as superseded only when the owner explicitly changes the decision.

- **2026-09-18:** Enrollment Step 2 — Student Type approved by Aziwe Futhe as final: first-time, 70% completed-course Legacy Upgrade, 50% incomplete-course Restart and 25% returning-student paths; evidence/ID verification, provisional-discount safeguards, Back/Continue navigation, draft restoration and Step 2 presentation are protected; Steps 3–5 remain separately reviewable.
- **2026-09-18:** Enrollment Step 1 — Choose Your Course approved by Aziwe Futhe as final: all active courses surfaced (35 at approval checkpoint), 10-per-page pagination, responsive course cards, search, View more, Select/Clear Selection, Continue, branding and typography are protected; Steps 2–5 remain separately reviewable.
- **2026-09-18:** Create Student Account approved by Aziwe Futhe as the final Student registration standard: required profile details, Student Terms & Privacy acceptance, 8+ character strong-password rule, official transparent FOA logo, optional immediate course selection, secure Student-profile creation and permanent eligible Ambassador attribution are protected from unapproved change.
- **2026-09-18:** Cleanup safety rule added after the Create Student Account regression: “legacy” never means “safe to remove.” Every retirement/redirect must first prove the dependency is unused or fully migrated, including indirect callers, then pass the adjacent end-to-end journey without loops or dead ends.
- **2026-09-18:** Entire Ambassador system approved by Aziwe Futhe as the final Ambassador programme/portal standard: public programme, application/agreement, review/status, activation, login/recovery/logout, permanent account-creation referral attribution, privacy-limited referral summaries, confirmed earnings, ranks/compensation, banking, tickets/Your Voice, resources and dashboard behaviour are protected from unapproved change.
- **2026-09-18:** Create Student Account dependency clarified after urgent regression: `create-account.html` is the approved public entry and `auth.html` remains its current working registration form until a complete migration is explicitly approved. Never replace `auth.html` with a redirect while this dependency exists.
- **2026-09-18:** Login section approved by Aziwe Futhe as the final Academy authentication standard: Student, Staff/Admin and Ambassador are the only approved portal entry journeys; Staff/Admin requires email + password + Staff Access Code; approved recovery and navigation destinations are protected; retired `auth.js` and duplicate reset implementations must not return.
- **2026-09-18:** Browse Courses approved by Aziwe Futhe as the final public course-catalogue design, structure, FAQ/contact presentation and tested navigation standard. No further Browse Courses changes are permitted unless the owner explicitly reopens it; approved Academy Map destination routing must not be silently changed.
- **2026-09-18:** Home page approved by Aziwe Futhe as the final public Home-page design and structure. No further Home-page changes are permitted unless the owner explicitly reopens it. Protect direct and indirect Home-page behaviour from regressions and do not restore legacy/retired content.
- **2026-09-17:** Protect the approved mobile login order and public Courses-page control presentation from regression.
- **2026-09-17:** Keep the Source Sans 3 change limited to the Student Dashboard and Student Library trial until the owner decides whether to expand it.
- **2026-09-17:** Introduce a strict no-surprise-change protocol: change only what the owner requested and preserve unrelated approved behaviour.
