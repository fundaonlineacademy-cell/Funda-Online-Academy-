# Funda Online Academy — Protected Approved State

Last established: 18 September 2026 (South Africa time)
Baseline commit: `353fee3ac327b826479990b8c7d3f0cdbf39d0e1`

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
- On mobile/tablet layouts up to 1023px, the shared Login must keep the established order: **brand panel first, authentication panel second**.
- The approved Login design, wording, fields, role controls, destinations, recovery behaviour and security requirements must not be redesigned, weakened, bypassed or replaced unless the owner explicitly reopens the Login section.
- Legacy authentication implementations must not be restored. The old full `auth.html` registration implementation, old `auth.js` login/reset logic, and malformed duplicate `reset-password. html` are retired and must not be used as authoritative sources.
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

### Ambassador referrals

- Ambassador referral links are intended to lead into account creation/registration rather than bypassing the registration journey.
- Referral attribution must remain separated from Student account privileges.
- Existing referral behaviour must not be silently rewritten while working on Staff/Admin login or public-course content.

## Explicit anti-regression rules

The following patterns are not acceptable unless Aziwe explicitly asks for them:

- Restoring an older page layout because it looks cleaner or is easier to code.
- Reintroducing a control, count, wording, colour, or navigation item that had been intentionally removed or replaced.
- Expanding a trial UI decision to the rest of the academy.
- Replacing an approved working flow with a “newer” or more generic pattern without owner instruction.
- Using an unrelated feature file as the permanent home for another feature.
- Adding a new override script to fight an existing override without first identifying the source conflict.

## Architecture risks already identified — do not worsen them

These are known cleanup targets, not permission to alter them during unrelated tasks:

1. `supabase-config.js` currently acts as a broad global/page-specific script loader and therefore has a large blast radius.
2. `ambassador-referral-tracking.js` currently mixes Ambassador referral logic with Staff/Admin login protection and public-course FAQ loading.
3. Some UI corrections rely on reapplication/timers/observers. These should be consolidated carefully in dedicated cleanup work rather than layered with more overrides.

## Owner decision log

Add future protected decisions here in concise form, with the date and the owner request that established them. Do not remove older entries merely because code was refactored; mark them as superseded only when the owner explicitly changes the decision.

- **2026-09-18:** Login section approved by Aziwe Futhe as the final Academy authentication standard: Student, Staff/Admin and Ambassador are the only approved portal entry journeys; Staff/Admin requires email + password + Staff Access Code; approved recovery and navigation destinations are protected; legacy auth/reset implementations are retired.
- **2026-09-18:** Browse Courses approved by Aziwe Futhe as the final public course-catalogue design, structure, FAQ/contact presentation and tested navigation standard. No further Browse Courses changes are permitted unless the owner explicitly reopens it; approved Academy Map destination routing must not be silently changed.
- **2026-09-18:** Home page approved by Aziwe Futhe as the final public Home-page design and structure. No further Home-page changes are permitted unless the owner explicitly reopens it. Protect direct and indirect Home-page behaviour from regressions and do not restore legacy/retired content.
- **2026-09-17:** Protect the approved mobile login order and public Courses-page control presentation from regression.
- **2026-09-17:** Keep the Source Sans 3 change limited to the Student Dashboard and Student Library trial until the owner decides whether to expand it.
- **2026-09-17:** Introduce a strict no-surprise-change protocol: change only what the owner requested and preserve unrelated approved behaviour.
