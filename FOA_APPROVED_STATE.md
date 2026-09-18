# Funda Online Academy — Protected Approved State

Last established: 18 September 2026 (South Africa time)
Baseline commit: `52d571b5d87b1a2ecfe2291e43f54ae2c9a160ee`

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

- **2026-09-18:** Cleanup safety rule added after the Create Student Account regression: “legacy” never means “safe to remove.” Every retirement/redirect must first prove the dependency is unused or fully migrated, including indirect callers, then pass the adjacent end-to-end journey without loops or dead ends.
- **2026-09-18:** Entire Ambassador system approved by Aziwe Futhe as the final Ambassador programme/portal standard: public programme, application/agreement, review/status, activation, login/recovery/logout, permanent account-creation referral attribution, privacy-limited referral summaries, confirmed earnings, ranks/compensation, banking, tickets/Your Voice, resources and dashboard behaviour are protected from unapproved change.
- **2026-09-18:** Create Student Account dependency clarified after urgent regression: `create-account.html` is the approved public entry and `auth.html` remains its current working registration form until a complete migration is explicitly approved. Never replace `auth.html` with a redirect while this dependency exists.
- **2026-09-18:** Login section approved by Aziwe Futhe as the final Academy authentication standard: Student, Staff/Admin and Ambassador are the only approved portal entry journeys; Staff/Admin requires email + password + Staff Access Code; approved recovery and navigation destinations are protected; retired `auth.js` and duplicate reset implementations must not return.
- **2026-09-18:** Browse Courses approved by Aziwe Futhe as the final public course-catalogue design, structure, FAQ/contact presentation and tested navigation standard. No further Browse Courses changes are permitted unless the owner explicitly reopens it; approved Academy Map destination routing must not be silently changed.
- **2026-09-18:** Home page approved by Aziwe Futhe as the final public Home-page design and structure. No further Home-page changes are permitted unless the owner explicitly reopens it. Protect direct and indirect Home-page behaviour from regressions and do not restore legacy/retired content.
- **2026-09-17:** Protect the approved mobile login order and public Courses-page control presentation from regression.
- **2026-09-17:** Keep the Source Sans 3 change limited to the Student Dashboard and Student Library trial until the owner decides whether to expand it.
- **2026-09-17:** Introduce a strict no-surprise-change protocol: change only what the owner requested and preserve unrelated approved behaviour.
