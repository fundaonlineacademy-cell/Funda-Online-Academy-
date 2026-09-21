# Funda Online Academy — Protected Approved State

Last established: 19 September 2026 (South Africa time)
Baseline commit: `0cac79fc96e2b5c8e58017d3abc7a79fac1d36c0`

This file exists to prevent regressions and the reintroduction of previously corrected or rejected behaviour.

## How to use this file

- Treat the baseline commit above as the current live technical checkpoint.
- A baseline is **not** permission to copy old code from earlier commits.
- Do not restore behaviour from an older commit merely because it previously existed.
- Preserve the decisions below unless Aziwe Futhe explicitly requests a change.
- If a new owner decision supersedes an item below, update this file in the same controlled change.

## Protected current decisions


### Admin My Dashboard — FINAL OWNER-APPROVED AND LOCKED (21 September 2026)

The owner physically reviewed **Admin → My Dashboard** after the final live-data corrections and explicitly approved it for lock. The approved functional checkpoint is `c8e24ceb7721b3d4c188a2816c907deb1c696fdc`.

- **My Dashboard is a change-controlled protected Admin surface.** No layout, wording, card order, KPI definition, data source, live-sync behaviour, reporting link, responsive behaviour, typography, Academy Identity presentation, House Rules presentation, Executive Calendar card, CEO Action Snapshot, Daily Operations card or Business Health/Department/Alert presentation may be changed unless Aziwe Futhe explicitly reopens that exact Dashboard area.
- The approved order remains: **Business Health Overview → Department Status → Daily Operations → Recent Audits & Alerts → CEO Action Snapshot → Executive Calendar & Tasks → Admin & Staff House Rules → compact Academy Identity**, followed by the permanent Admin footer outside the tab workspace.
- Business Health and Business Stats must continue to read the governed Admin executive/Finance snapshot. Do not restore parallel Dashboard-side finance arithmetic, hard-coded course/Student totals, future/voided-expense counting, certificate-row completion calculation or rounded-away cents.
- Approved live behaviour includes the authenticated Admin Realtime change channel for Dashboard source tables, focus/pageshow reconciliation, non-destructive manual refresh and the 10-minute automatic refresh as fallback. Realtime/database events may refresh displayed values, but must not alter the approved Dashboard structure.
- Active course, Student, enrolment, payment, current posted expense, support, communication, academic-result, issued-certificate, governance-action, Ambassador, calendar and consultation information must remain database-driven. Do not replace live counts with manually entered numbers.
- Course Completion remains based on actual passed Student/course results; issued certificates remain a separate measure.
- CEO Action Snapshot continues to use the **Africa/Johannesburg** calendar date for today/due/overdue classification.
- **Download Executive Summary** continues to explicitly open the Executive Summary report.
- Daily Operations retains the approved six-card layout and fail-safe behaviour: a required-source failure must not silently become a false zero.
- House Rules retain the approved readable sizing and narrow-screen wrapping.
- Desktop and mobile/tablet responsiveness are part of the lock.
- Any future work in **Management & Governance or another Admin tab is out of scope for My Dashboard**. Shared files/loaders may be edited only when necessary for the explicitly reopened area and only if My Dashboard is regression-checked and remains behaviourally unchanged.
- Feedback or a newly discovered defect is a change request, not automatic permission to modify the locked Dashboard. The owner must explicitly approve the Dashboard correction before implementation.


### Student Portal — FINAL OWNER-APPROVED AND LOCKED

The complete Student Portal remains owner-approved and locked. After explicit owner reopening of Payment / Enrollment Step 4 on **19 September 2026**, the payment-plan policy was amended and re-locked at functional checkpoint `3c7b091cd3e8cface5d80e1895fc353fb1699a95`. All other Student Portal areas remain protected and unchanged by that amendment.

- The Student Portal is now a **change-controlled protected surface**. No Student Portal code, content, layout, navigation, wording, styling, data presentation, workflow, assessment behaviour, results behaviour, payment behaviour, support/contact presentation, calendar behaviour, course-study experience or shared Student-facing runtime may be changed unless Aziwe Futhe explicitly approves that specific change.
- Approval is required even for changes presented as cleanup, polish, refactoring, responsiveness, consistency, accessibility, bug fixing, student feedback, performance work or shared/global-script maintenance when they can alter the approved Student experience.
- Student feedback may be collected after this lock, but feedback is a **change request**, not authority to modify the approved portal. The owner must explicitly reopen the affected Student Portal area before implementation.
- The approved Student Portal includes the Student Dashboard shell/navigation and all currently available Student tabs/surfaces, including Dashboard, Student Orientation, My Courses, My Progress, Assessments, My Results, Payments & Balance, My Calendar & Reminders, Communication Centre, Academic & Student Support, consultations/support, Career & Workplace Support, Certificates, Your Voice, Study Materials/Digital Library as currently presented, and all other current Student-facing dashboard destinations.
- The approved learning journey also includes the Student course-study/lesson experience and module-assessment experience. Course progression, locking/unlocking, assessment gating, attempts, recorded results and completion behaviour must not be altered without explicit owner approval.
- **My Courses** remains distinct from **My Progress**. My Courses is the enrolled-course entry surface; My Progress is the dedicated completion/roadmap/outstanding-requirements view.
- **Assessments** remain part of the course learning sequence. The Assessment Centre explains the course-specific assessment procedure and requirements; it must not duplicate or move assessments out of their approved course/module context.
- **My Results** retains the approved separation between live **Provisional Results** and formally issued **Official Results**. Provisional Results are view-only, compact/table-based and non-downloadable; official Statements of Results remain separately controlled and formally issued.
- **My Calendar & Reminders** retains the approved professional monthly planner, South African public-holiday display, selected-day details, Upcoming Schedule and personal reminder create/edit/delete behaviour.
- **Communication Centre** retains the approved professional inbox pattern: Unread / Important / All Messages summary, search, category filtering, Important/Pinned messages, compact inbox rows, message-detail opening, learner-specific read-state behaviour and View older messages.
- The approved Student-facing support directory uses only role/function mailboxes intended for learner contact. Current approved contacts are:
  - Student & Technical Support — `support@fundaonlineacademy.co.za`
  - Admissions & Enrolment — `admissions@fundaonlineacademy.co.za`
  - Academic Support — `academicsupport@fundaonlineacademy.co.za`
  - Assessments — `assessments@fundaonlineacademy.co.za`
  - Finance & Payments — `finance@fundaonlineacademy.co.za`
  - Certificates — `certificate@fundaonlineacademy.co.za`
  - General Enquiries — `info@fundaonlineacademy.co.za`
- Private/internal/executive mailboxes must not be exposed merely because they exist. Executive/CEO, named staff, webmaster, internal academic administration, marketing, partnership, Ambassador or other operational mailboxes remain private unless the owner explicitly approves a specific public/Student-facing use.
- The approved Student Portal font is **Source Sans 3** throughout the Student Dashboard, tabs, Student pages, course-study/lesson pages and module-assessment pages. Do not reintroduce Times New Roman, Inter, Arial-only or another primary typeface without explicit owner approval.
- Existing navy/gold Academy branding, responsive behaviour and accessibility/readability choices are part of the locked presentation.
- No new Student sidebar tab may be added, removed, renamed or reordered without explicit owner approval.
- Shared/global scripts that execute on Student-facing pages must preserve this locked state. A change for another portal or public surface is not permission to alter Student Portal behaviour indirectly.
- Do not restore legacy, superseded, duplicate or previously rejected Student Portal code from older commits or cached implementations.
- Any approved future Student Portal change must identify the exact reopened surface, preserve all unaffected locked areas, run relevant regression checks, and update this approved-state record in the same controlled change.

### Employer & Industry Partnerships — OWNER-APPROVED FINALISATION (21 September 2026)

The owner explicitly reopened **Employer & Industry Partnerships** for a focused finalisation pass. The approved scope is limited to preserving the existing employer-enquiry, opportunity, learner opt-in, learner-interest, Graduate Employment Pipeline and Partner Activation & Governance workflows; improving Admin-side readability while retaining Source Sans 3 and the established design; and making the Employer & Industry Partnerships Admin section restore correctly after a browser refresh and refresh its own data in place. The existing central `supabase-config.js` loader already activates the Employer Admin modules and the Student `student-employer-opportunities.js` component, so duplicate script loading must not be added. The Student Career & Workplace layout, consent language, employer-opportunity privacy rules and all unrelated Student/Admin areas remain unchanged.

### Marketing & Admissions — OWNER-APPROVED FINALISATION (20 September 2026)

The owner explicitly reopened the Admin **Marketing & Admissions** tab for a focused finalisation pass. The approved scope is limited to: improving Admin-side readability while retaining Source Sans 3 and the established design; completing the saved-campaign lifecycle with Edit, Draft, consent-based Email Send Now, Email Schedule/Cancel and external-channel Mark Published controls; adding a compact Admin Admissions lead tracker for contact/source/course-interest/status/notes; and linking campaign activity to the existing campaign-event register so delivery counts and status are visible. Scheduled email campaigns may automatically send only to active opted-in marketing subscribers. Student profiles must never be treated as marketing consent by default. The locked Student Portal, Finance, enrolment/payment rules, Communication Centre and unrelated Admin areas remain unchanged.

### Student Support & CRM — OWNER-APPROVED FINALISATION (20 September 2026)

The owner explicitly reopened the Admin **Student Support & CRM** tab for a focused finalisation pass. The approved scope is limited to loading the existing protected Student Support Command Centre in Admin, improving Admin-side readability while retaining Source Sans 3 and the established design, superseding the obsolete Admin ticket-creation view that conflicts with the current screenshot-required Student ticket rules, and adding a compact Admin-only CRM context inside ticket detail (student contact, enrolment/course context and support-history counts). The locked Student Support ticket submission/reply experience, screenshot requirement, Student Portal design, Finance data, enrolment rules and all unrelated portal behaviour remain unchanged.

### Communication Hub — OWNER-APPROVED FINALISATION (20 September 2026)

The owner explicitly reopened the Admin **Communication Hub** for a focused finalisation pass. The approved scope is limited to: improving Admin-side readability while retaining Source Sans 3 and the existing design; correcting **Everyone in Funda** recipient tracking so entitled Student/staff recipients receive the same protected portal communication; completing automatic email dispatch for scheduled communications; and adding Admin controls to edit/publish/cancel saved Draft/Scheduled communications plus retry a failed requested email. The existing Student Communication Centre design, navigation, inbox presentation, search/filtering, read-state behaviour and all unrelated Student Portal areas remain locked and unchanged.

### Home page — FINAL OWNER-APPROVED STATE

The Home page (`index.html`) is owner-approved as the final public Home-page structure and design as of 18 September 2026.

- Do not redesign, restyle, reorder, add, remove, rename or rewrite Home-page sections, navigation, CTAs, course-card controls, Academy Identity, Head of Academics message, footer, contact details, typography, colours, spacing or responsive structure unless Aziwe Futhe explicitly reopens the Home page for change.
- The approved Home-page course-card behaviour is: the card body/image/title/price is not a navigation target; **View Course** opens the course overview; **Enroll Now** opens Student account creation and preserves an Ambassador referral code when present.
- The approved General Enquiries address is `info@fundaonlineacademy.co.za`; do not restore the retired `infor@fundaonlineacademy.co.za` typo.
- **Owner-approved Home FAQ amendment — 19 September 2026:** the Home page now includes a compact General FAQs section covering registration fee, enrol-anytime availability, fully-online learning, physical-campus clarification, registered-business status, browsing courses without an account, and official general contact channels. This amendment reopens only the Home FAQ content; all other Home-page sections and behaviour remain locked and unchanged.
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

### Enrollment Step 3 — Student Registration / Complete Your Details — FINAL OWNER-APPROVED STATE

Enrollment Step 3 on `onboarding.html` is owner-approved as the final **Student Registration / Complete Your Details** structure, validation and presentation as of 18 September 2026. This approval applies to Step 3 only; Steps 4–5 remain subject to separate owner review and approval.

- Step 3 must continue to use the authenticated learner's existing FOA profile and Student record where available, pre-filling known information instead of creating a duplicate Student identity.
- The registered **Email Address** remains read-only in Step 3. Enrollment must remain tied to the authenticated account rather than allowing the learner to substitute another account email during this step.
- The approved required details before continuing to Payment are: **Full Name, Mobile / WhatsApp, Gender, Identification Type, Date of Birth, Nationality, Residential Address, City / Town, Province, and Where Did You Hear About Us**.
- The approved identity paths are **South African ID** or **Passport / Foreign ID**.
- A South African ID must remain exactly **13 digits**, pass the Academy's South African ID validity check, and produce a Date of Birth that agrees with the form before the learner can continue.
- A Passport / Foreign ID must remain required when that identity type is selected and must meet the current minimum validity check.
- The approved optional profile fields remain **Postal Code, Employment Status, Highest Education, Emergency Contact Name, and Emergency Contact Phone**. Do not make them compulsory or remove them without explicit owner approval.
- Existing Student details and current Step 3 edits must continue to save to the authenticated learner's Student record, with shared identity/profile fields synchronised through the existing approved mechanism.
- **Back to Student Type** and **Continue to Payment** are approved Step 3 controls and must keep their tested navigation behaviour.
- Step 3 draft persistence/autosave is approved. Entered details and navigation state may be restored for the authenticated learner, subject to the existing handling of sensitive identity values.
- The current approved Step 3 branding, typography, spacing, responsive layout, field labels and presentation must remain unchanged unless the owner explicitly reopens Step 3.
- Changes to Steps 4–5 are not permission to disturb Step 3. Any shared onboarding/registration/draft change must regression-check this approved Step 3 before merge.
- Do not redesign, restyle, reorder, remove, rename, weaken or replace Step 3 fields, required/optional status, identity validation, profile-prefill/save behaviour, navigation, persistence or presentation unless Aziwe Futhe explicitly reopens Enrollment Step 3.

### Enrollment Step 4 — Payment — FINAL OWNER-APPROVED STATE

Enrollment Step 4 on `onboarding.html` is owner-approved as the final **Payment** structure, payment-plan behaviour, proof requirements and presentation as of 18 September 2026. This approval applies to Step 4 only; Step 5 remains subject to separate owner review and approval.

- The approved Payment step must display the Academy's current official banking details from the active payment settings and must instruct learners not to pay until official banking details are shown.
- The approved payment methods remain **EFT / Bank Transfer** and **Bank Deposit**. Cash payments are not accepted.
- **Owner-approved payment-plan amendment — 19 September 2026:** a payable course amount of **R1,300 or less** remains full-payment-only.
- A payable course amount **above R1,300** with a course duration of **at least 4 weeks** qualifies for **2 instalments**.
- A payable course amount of **R2,000 or more** with a course duration of **at least 8 weeks** qualifies for **3 instalments**.
- A course shorter than 4 weeks remains full-payment-only even when its payable amount is above R1,300.
- Payment-plan eligibility continues to use the learner's current payable enrolment amount, preserving existing approved discount/legacy pricing behaviour.
- When instalments are available, the learner must still retain the option to **Pay full course fee**. Instalments are an option, not a requirement.
- The system must continue to calculate the amount currently due. **Amount Paid Now** remains read-only and must correspond to the selected full-payment or instalment option.
- The amount required by the system must be paid **exactly**. For full payment, proof must show the exact full required amount. For an instalment option, proof must show the exact instalment amount due now. If Admissions & Finance verifies that the amount paid does not match the required amount, the enrollment application is rejected under the approved payment rule.
- The approved payment reference remains required so Admissions & Finance can match the payment to the learner/application.
- **Proof of Payment** remains compulsory and may be uploaded only as **PDF, JPG or PNG**, with a maximum file size of **5 MB**.
- Proof of payment and payment details remain subject to **Admissions & Finance verification** before course access is approved.
- **Back to Student Registration** and **Continue to Declaration** are approved Step 4 controls and must keep their tested navigation behaviour.
- The current approved Step 4 banking presentation, payment rules, payment option control, schedule display, amount-due presentation, proof-upload area, branding, typography, spacing and responsive layout must remain unchanged unless Aziwe Futhe explicitly reopens Step 4.
- Changes to Step 5 are not permission to disturb Step 4. Any shared onboarding/payment change must regression-check this approved Step 4 before merge.
- Do not redesign, restyle, reorder, remove, rename, weaken or replace Step 4 payment eligibility, instalment/full-payment choices, amount calculation, exact-payment rule, banking presentation, payment reference, proof requirements, verification boundary, navigation or presentation unless Aziwe Futhe explicitly reopens Enrollment Step 4.

### Browse Courses — FINAL OWNER-APPROVED STATE

The Browse Courses page (`courses-public.html`) is owner-approved as the final public course-catalogue structure and design as of 18 September 2026.

- Do not redesign, restyle, reorder, add, remove, rename or rewrite Browse Courses sections, course cards, filters, navigation, FAQs, contact area, typography, colours, spacing or responsive structure unless Aziwe Futhe explicitly reopens Browse Courses for change.
- The public course-result-count summary remains hidden in the approved presentation.
- The approved primary sort presentation is **Most Popular**, with the approved control placement preserved.
- Course cards must continue to show the approved course information and route **View Course** to the correct course overview. Student login and account-creation routes must continue to lead to the correct secure Student journey.
- The approved FAQ answer for enrolment timing states that Funda Online Academy **accepts registrations every day**. Do not restore the retired “throughout the year” wording.
- **Owner-approved FAQ amendment — 19 September 2026:** the public FAQ now also explains the approved payment-plan thresholds, full-payment option, exact instalment amount rule and accepted payment methods. This amendment reopens the FAQ content only; the rest of Browse Courses remains locked and unchanged.
- The public payment FAQ wording reviewed and approved by the owner on 19 September 2026 uses the clearer phrase **course fee or payable amount** while preserving the approved instalment thresholds and payment rules.
- The public contact section remains intentionally WhatsApp-focused. Do not add a public enquiry email form or another general-enquiry channel to this page unless the owner explicitly requests it.
- Course images must fail gracefully: a remote-image failure must show the approved course placeholder rather than a broken-image icon. Successful images must keep the approved presentation.
- The approved public navigation routes to the Academy Map, Employers, Ambassadors, Student Login, Create Student Account, course catalogue/course-selection pathway and related public destinations must remain intact.
- The current Academy Map public and private destination routing has been owner-tested and approved: registered-learner destinations route through Student Login; Staff/Admin destinations route through the shared secure Staff/Admin login; Ambassador and Employer destinations remain role-appropriate. Do not bypass or silently redirect these protected pathways.
- Shared/global scripts that execute on or alter Browse Courses must preserve this final state. A change elsewhere is not permission to disturb Browse Courses indirectly.
- Do not reintroduce legacy, retired, duplicated or cached Browse Courses content from older commits or previous overrides.
- A direct change to `courses-public.html` requires explicit Browse Courses owner approval in the pull request.

### Approved portal typography

- `Source Sans 3` is the approved Student Portal typeface.
- **Owner-approved Admin typography amendment — 19 September 2026:** `Source Sans 3` is also the approved font for the complete Admin Command Center, including every department tab, navigation label, table, form control, dynamically rendered Admin module and CEO Account Control dialog.
- This Admin font approval changes typography only. It is not permission to redesign Admin spacing, sizes, colours, cards, navigation, workflows or data presentation.
- Do not expand this approval to the Ambassador Portal or other public/private surfaces without explicit owner approval for those surfaces.

### Student account-creation security — owner-approved 20 September 2026

- The unnamed audit/test account `audit_sec_1789818676_202348@gmail.com` was owner-directed for permanent deletion through CEO Account Control. It is now marked deleted, banned from sign-in and anonymised under the approved deletion model; retained tombstone records exist only for audit integrity.
- Live Student Growth must count **active Student profiles only**. Profiles marked `deleted` in CEO Account Control are excluded from the secure executive snapshot and therefore do not contribute to Student Growth.
- New Student profiles must have a non-blank full name and valid email. Reserved automation/test prefixes such as `audit_`, `security_`, `sec_`, `qa_`, `test_` and `demo_` are rejected for live Student accounts.
- Public Student registration now tags account provenance as `public_student_registration`.
- A minimal Admin-only `account_registration_audit` record is created for new auth accounts so future account-origin investigations have a traceable registration source/declared role/account type without relying on guesswork.
- This hardening must not prevent legitimate public Student registration through the approved account-creation form, nor change approved Student Portal content/layout.

### Admin automatic refresh standard — owner-approved 19 September 2026

- The Admin Command Center uses **one central 10-minute automatic data refresh** through `admin-auto-refresh-10min.js`.
- The previous recurring 30-second Finance/Payment Review/notification refreshes, 45-second Your Voice refresh, and 60-second Business Intelligence refresh are removed. Those modules now respond to the central Admin refresh event instead of running their own short data-refresh timers.
- Manual **Refresh** controls, refreshes immediately after a save/status change, and non-data startup/mount timers remain allowed because they are user-initiated or required only to attach the approved interface; they are not background data refreshes.
- Returning focus to the Admin page may still perform lightweight state checks where needed, but must not reintroduce a recurring sub-10-minute data refresh that replaces the content while the CEO is reading or working.
- Do not add any recurring Admin data refresh below 10 minutes without explicit owner approval.
- **Non-destructive refresh refinement — 20 September 2026:** automatic and manual Admin refreshes must preserve the currently visible workspace while fresh data is requested. The previous blocking live-data gate that hid My Dashboard and replaced it with **“Live Academy data could not refresh” / Retry** has been removed. Temporary connection/query failures keep the last successfully rendered information visible; modules retry on the next manual or approved 10-minute refresh instead of blanking the page.

### Admin My Dashboard — Daily Operations cards, owner-approved 20 September 2026

- **Business Health Overview, Department Status and Recent Audits & Alerts remain intact.**
- Between **Department Status** and **Recent Audits & Alerts**, My Dashboard now includes one compact **Daily Operations** area with six cards in a 3 × 2 desktop layout:
  1. **Quick Links** — direct shortcuts to existing Enrolments, Finance/Payment Proof Review, Student Support, Ambassador Programme, HR & Team and CEO Account Control workspaces. These are links only and do not duplicate departmental records.
  2. **System Summary** — attention-only counts for pending enrolments, payment proofs awaiting verification, open support tickets, Ambassador applications awaiting review and executive actions due/overdue.
  3. **Quick Reports** — shortcuts into the existing Funda Report Centre for Executive Summary, Enrolments, Payments, Student Support and Academic & Assessments reports.
  4. **Operational Activity** — a compact 7-day activity graph using enrolment, payment and support activity rather than duplicating the existing Business Health growth/performance cards.
  5. **This Week** — up to four open CEO/management actions due within the next seven days, linked back to Management & Governance rather than creating a separate notes/task system.
  6. **Calendar** — a compact current-month calendar with Today, South African public-holiday and Academy event/consultation indicators plus a link to the existing Executive Calendar & Tasks page.
- These cards refresh through the approved central Admin refresh flow; they do **not** introduce a new sub-10-minute recurring background data refresh.
- Responsive layout becomes 2 columns on medium screens and 1 column on small screens.
- **Readability refinement — 20 September 2026:** Daily Operations now follows the same readable Admin typography scale used in Business Health and Department Status. Primary labels are enlarged, secondary text is no longer micro-sized, System Summary counts are larger, and the CEO Action Snapshot uses the same readable scale. The Operational Activity graph and compact Calendar are placed in defined bordered/rounded visual panels with clearer labels and spacing so they read as intentional dashboard components rather than loose content.
- **Final My Dashboard consistency pass — 20 September 2026:** remaining small helper/status text in My Dashboard, Daily Operations and CEO Action Snapshot was increased to the established readable Admin scale. The legacy/base Admin fallback now also treats only genuine Student profiles as Students and excludes CEO-deleted tombstones, preventing temporary Student-count inconsistencies before/around enhanced dashboard rendering.
- **Stability refinement — 20 September 2026:** Daily Operations must not continuously rewrite its own card contents in response to its own DOM mutations. The dashboard now observes only replacement of the Admin workspace and refreshes card data only on initial load, explicit navigation/load, or the approved Admin refresh event. This prevents visible card jitter/flicker while the CEO is reading.
- **Card-balance refinement — 20 September 2026:** the lower Daily Operations row is visually balanced. **This Week** shows at most two due/overdue actions with a **View all actions** control into Management & Governance instead of allowing the card to stretch indefinitely. Operational Activity, This Week and Calendar use matching compact desktop card heights. The Calendar uses a slightly inset rounded inner panel, reduced vertical size and smaller day-cell height so it stays neat without dominating the row; responsive layouts return to natural height on smaller screens. Loaded card bodies also remove the temporary loading-layout class so content is not accidentally centred or pushed to the bottom.

### Executive Calendar holidays and Admin reminders — owner-approved 20 September 2026

- **Selected-date interaction repair — 20 September 2026:** month cells now carry stable date keys and use delegated click/keyboard handling, so navigating months or rendering holiday labels cannot break the right-side Selected Date details panel. Rapid date changes are request-safe; the newest selection wins.

- The Executive Calendar recognizes South African statutory public holidays, including **Good Friday**, **Family Day**, and the Public Holidays Act Sunday-observed Monday rule. Holidays are highlighted directly on the monthly calendar and appear in the Selected Date detail panel.
- Holiday rendering is now built directly into the Admin month-grid renderer: each recognised holiday date carries a visible **PUBLIC HOLIDAY · [holiday name]** label, including prior/future months when navigating the calendar (for example National Women's Day on 9 August and Heritage Day on 24 September). The Student Calendar remains unchanged by this Admin-only display rule.
- Calendar reminders/events now participate in the existing Admin notification-bell workflow. Newly created upcoming reminders can appear as unread Calendar notifications; when an active calendar item is within **24 hours**, a separate **DUE SOON** bell notification is generated so reading the original creation notification does not suppress the due reminder.
- Clicking a calendar notification in the Admin bell opens the existing **Executive Calendar & Tasks** workspace.
- The bell continues to use the approved event-driven/10-minute Admin refresh architecture; this change does **not** restore a 30-second polling loop.
- This is an in-app Admin bell notification. Email and browser-push reminder delivery remain disabled unless separately approved and implemented.

### Executive Calendar & Tasks — owner-approved presentation refinement 20 September 2026

- The existing Executive Calendar remains the authoritative calendar workspace and continues to show scheduled Academy events, meetings, reminders and learner consultations on their relevant dates.
- The page now uses the approved **Source Sans 3** Admin typography and a refined navy/gold Admin visual treatment without changing the underlying calendar/reminder workflows.
- The monthly Calendar is retained and visually strengthened as the main planning view. Date cells, weekday labels and event labels are more readable while the calendar remains compact.
- A **Selected Date** detail panel now appears beside/below the month calendar. Selecting a date shows that day's live meetings, reminders, Academy items and learner consultations without removing the calendar.
- Existing **Today**, **Next 7 Days**, **Upcoming**, **Calendar**, **Create Reminder**, reminder creation and event-cancellation behaviour remain available.
- The old wording that described this page as isolated from the Admin Command Center is retired because access now comes from My Dashboard.
- This refinement is Admin-only. The locked Student Calendar/Student Portal presentation is unchanged.

### Admin tab refresh stability — owner-approved 20 September 2026

- The Admin Command Center now preserves the currently open top-level Admin section across a browser refresh. The selected section is stored locally and mirrored in the Admin URL hash (for example `#management`), and the sidebar restores the matching active tab after reload instead of defaulting to My Dashboard.
- Internal Admin data refreshes continue to call the currently active section and must not force a return to My Dashboard.

### Management & Governance — owner-approved refinement 20 September 2026

- **Workplace Exposure Letter document style — 20 September 2026:** the official letter preview and downloaded PDF use **Times New Roman / Times**, with **12 pt body text**, black body ink, a stronger black subject heading, clean justified body paragraphs, and a compact no-signature closing. The CEO handwritten signature is intentionally not used. Closing remains **Aziwe Futhe · Founder & Chief Executive Officer · Funda Online Academy**.

- **Official Workplace Exposure Letter Builder — 20 September 2026:** the workplace-exposure section is now a learner-aware full-width builder beneath the Professional Graduate CV. Admin selects a learner and course, the system reads the learner/course records, auto-fills the learner name and course, uses the generation date by default, accepts host organisation/contact/branch details, generates a formal expanded letter, shows completion verification status, provides a live preview and downloads a finished PDF. The official transparent Funda Online Academy logo is loaded from the approved master asset and remains part of the letterhead. Permanent institutional details are Funda Online Academy, company registration **2023/830451/07**, **100% Online Academy — South Africa**, Tel **069 960 8590**, WhatsApp **069 960 8590**, **info@fundaonlineacademy.co.za**, **fundaonlineacademy.co.za**, and CEO **Aziwe Futhe**. The builder does not falsely claim course completion when Academy results/certificates do not support that claim.
- **Student workplace-exposure request refinement — 20 September 2026:** when a learner requests a Workplace Exposure Letter, the Student Career & Workplace Support form additionally captures the host organisation, optional attention/contact person and optional branch/location. These are stored with the request so Admin can load the request directly into the workplace-exposure builder. Other Student Career Support request types remain unchanged.

- **Learner CV Builder — 20 September 2026:** the Career & Workplace Support CV area is no longer a static example only. Admin can select an active learner, auto-fill name, phone, email and location from Academy records, choose the learner’s course, generate a course-aware professional profile/skills/training section, edit every field, preview the final CV live, and download a finished PDF. Open CV support requests can be loaded directly into the builder. The generated wording is status-aware so pending/active/completed training is not represented as completed unless the recorded enrolment status supports that claim. The Workplace Exposure Letter remains unchanged for a later dedicated review.
- **CV document typography — 20 September 2026:** the CV preview and downloaded PDF use **Times New Roman / Times**. Main CV body text is **11 pt** in the PDF with approximately **1.5 line spacing** for paragraph readability. Professional Profile text is cleanly justified. Section headings such as Professional Profile, Core Skills and Education & Training retain the navy treatment, while paragraph/body text is black. The Admin builder interface itself remains Source Sans 3.
- **Career & Workplace Support layout — 20 September 2026:** Professional Graduate CV and Official Workplace Exposure Letter are stacked vertically on Management & Governance. The CV appears first at full workspace width; Workplace Exposure sits underneath at full width. Do not place these two tools side-by-side on desktop unless explicitly re-approved.

- **Typography refinement — 20 September 2026:** Management & Governance, CEO Executive Action Centre, and Career & Workplace Support explicitly use the approved **Source Sans 3** Admin font. Meaningful interface text was raised to the established readable Admin scale; 8px/9px micro-text was removed from these Management sections, while form inputs remain comfortably readable and mobile-safe.

- **Vision** and **Mission** remain available in Management & Governance but are intentionally removed from the top Executive Governance hero. They now appear together in a compact **Academy Direction** section at the bottom of the Management workspace, immediately before the permanent Admin footer/Academy Details.
- **Learner Success · Career Services / Career & Workplace Support** must render only once. The management-side career-support loader now uses a single-flight guard and an atomic placement rule so concurrent mount events cannot create duplicate template sections.
- The existing two distinct master templates — **Professional Graduate CV** and **Official Workplace Exposure Letter** — remain separate approved templates. No database template records were deleted by this UI deduplication.
- Career & Workplace Support is inserted before Academy Direction so Academy Direction remains the final Management section before the permanent Admin footer.

### Executive Calendar access — owner-approved move 20 September 2026

- **Executive Calendar & Tasks** is no longer a permanent Admin sidebar item.
- Access to the existing `admin-calendar.html` workspace now lives on **Admin → My Dashboard**, positioned after **CEO Action Snapshot** and before **Admin & Staff House Rules**.
- This move changes navigation placement only. The Executive Calendar & Tasks page itself remains intact for the next review/improvement step.
- The compact Calendar preview inside Daily Operations remains unchanged.

### Admin My Dashboard — owner-approved amendment 19 September 2026

- On **Admin → My Dashboard**, the Academy Identity is now intentionally presented as a compact summary card rather than the full Vision/Mission/Values block.
- The compact card keeps the approved Academy Identity content available through **View Academy Identity**, which opens the complete Vision, Mission, Purpose, Core Values, Strategic Objectives and Commitment in a modal.
- This amendment changes only the Admin My Dashboard presentation of Academy Identity. The shared Academy Identity content and its presentation on Student, Ambassador, Staff and public surfaces remain unchanged.
- The existing compact **Admin & Staff House Rules** card remains unchanged and the Academy Identity compact card sits with that dashboard-governance area.
- **Owner-approved permanent Admin footer amendment — 20 September 2026:** the Academy Details/footer is permanent across **all Admin tabs**, not only My Dashboard. It sits below the tab workspace and shows the registered business name, company registration **2023/830451/07**, **International CPD Accredited Trainer**, WhatsApp **069 960 8590**, CEO professional email **aziwe@fundaonlineacademy.co.za**, and the Admin Command Center label. **Delivery Model** and **Learning Location** are intentionally omitted from the Admin footer because they are unnecessary internal CEO reference items. The lower strip shows **© 2026 Funda Online Academy. All rights reserved.**, **Terms & Conditions**, **Privacy Policy**, and **Policies & Legal** links. Terms and Privacy link to the existing sections of `policies.html`. No partner/company showcase is added yet; that may be added later only when actual approved partners exist.

### Student onboarding / enrolment

The current baseline includes the recent five-step onboarding direction. Preserve it unless specifically asked to change it:

- Five-step onboarding flow.
- Payment separated into Step 4 of 5.
- Onboarding progress/draft persistence and autosave.
- Influencer / Brand Ambassador as an enrolment-source option.
- Official bank-account and beneficiary-verification wording currently in production.
- Enrolment-submission confirmation email hook.
- Public “enrol anytime” messaging and related course FAQ behaviour.

### Enrolments & Courses — OWNER-APPROVED FINALISATION (21 September 2026)

The owner explicitly reopened **Enrolments & Courses** for a focused finalisation pass. The approved scope is limited to: improving Admin-side readability while retaining Source Sans 3 and the existing Command Centre design; requiring a clear rejection reason for every future rejected enrolment; recording future enrolment approval/rejection decisions in the central Admin audit trail at database level; and enforcing course title/price/duration/description/availability changes through the governed course-change workflow at database level. Course changes require a separate Admin reviewer from the requester, while the emergency override is server-restricted to the CEO account and requires a reason. Existing historical enrolment values, the rejected legacy record, verified-payment safeguards, Student payment workflow, course content, assessments and the 35-course catalogue remain unchanged.

### Ambassador Programme — OWNER-APPROVED FINALISATION (21 September 2026)

The owner explicitly reopened the Ambassador Programme for a focused finalisation pass. The approved scope is limited to: improving the Admin Ambassador Applications & Approval readability while retaining Source Sans 3 and the established design; correcting the Admin Ambassador workspace detector so Ambassador application controls mount only on the **Ambassador Programme** tab and never on Marketing; and completing formal agreement-version acceptance for approved Ambassadors. Existing historical/legacy agreement acceptance must remain preserved and must never be silently converted into acceptance of a later agreement version. A current agreement version requires the Ambassador's explicit in-portal acceptance, which is recorded against that exact version/hash. Existing Ambassador access is not removed merely because a later/current version still requires review unless separately re-approved. Referral attribution, earnings, ranks, compensation, banking, support, marketing resources, application/login flow and all other protected Ambassador behaviour remain unchanged.

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
- **Owner-approved deletion-sync amendment — 19 September 2026:** when the CEO permanently deletes a referred Student account, that referral is automatically disqualified from active Ambassador totals, any linked direct commission is reversed/excluded from confirmed earnings, and the deleted Student's revenue no longer contributes to rank/quota progress. The referral and reversed ledger entries remain Admin-visible for audit history. The Ambassador portal also re-checks current server-side eligibility before showing earnings, so a deleted Student cannot remain visible as an active/earning referral.
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

- **2026-09-18:** Enrollment Step 4 — Payment approved by Aziwe Futhe as final: official banking details, EFT/Bank Deposit, full-payment and eligible 2/3-instalment choices, always-available full-payment option, exact required-amount rule, required payment reference, PDF/JPG/PNG proof up to 5 MB, Admissions & Finance verification, Back/Continue navigation and Step 4 presentation are protected; Step 5 remains separately reviewable.
- **2026-09-18:** Enrollment Step 3 — Student Registration / Complete Your Details approved by Aziwe Futhe as final: existing-account profile prefill, required/optional Student details, SA ID/passport validation, read-only registered email, Student/profile saving, Back to Student Type, Continue to Payment, draft persistence and Step 3 presentation are protected; Steps 4–5 remain separately reviewable.
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


### Admin Management & Governance — FINAL OWNER-APPROVED AND LOCKED (21 September 2026)

The owner physically reviewed **Admin → Management & Governance**, identified the Executive Action Centre completion-jump instability during real daily CEO use, authorised the correction and explicitly instructed that the corrected Management & Governance workspace be locked. The approved functional checkpoint is `2eda8150de1254c2641b78d55cf819617a82134a`.

- **Management & Governance is a change-controlled protected Admin surface.** No layout, wording, register structure, governance lifecycle, CEO Executive Action Centre behaviour, Academy Direction presentation, reporting connection, Realtime behaviour, responsive handling or management-control workflow may be changed unless Aziwe Futhe explicitly reopens the affected area.
- The approved governance structure remains: **Executive Governance Centre → governance summary metrics → Executive Overview / Objectives / Policies / Risks / Actions / Decisions → CEO Executive Action Centre → completion history → Academy Direction**.
- Objectives, Policies, Risks, Actions and Decisions remain live lifecycle registers with View / Edit capability after creation. Do not restore create-once or legacy `admin_governance` behaviour.
- The retired legacy Management/Governance writer and fallback remain disabled. If the live governance module cannot initialise, Admin must show an explicit unavailable state rather than silently using obsolete governance arithmetic or storage.
- The CEO Executive Action Centre remains the governed workflow for daily, weekly, monthly, quarterly, annual and one-off executive responsibilities. Recurring completion must preserve completion history and advance the next due date without destroying the prior completion record.
- **Stability is part of the lock.** Completing, adding, editing or refreshing a governance action must not make the Management workspace jump up/down, tear out the Executive Action Centre, repeatedly redraw the section or move the CEO away from the working position. Governance refreshes preserve the existing Executive Action Centre element, update action counters/rows/history in place, coalesce duplicate Realtime events and suppress immediate local-event echoes.
- All six governance sources — `governance_objectives`, `governance_policies`, `governance_risks`, `governance_actions`, `governance_decisions` and `governance_action_history` — remain the live governance sources and remain published for Realtime subject to their Admin RLS controls.
- Evidence expected for an executive responsibility remains separate from the evidence actually recorded on completion.
- Executive action due/today/overdue classification continues to use the **Africa/Johannesburg** calendar date.
- Completion History continues to use the exact database count while retaining recent detail rows for display.
- The formal **Management & Governance** report continues to read the live governance registers and completion history, never the retired empty `admin_governance` table.
- Failed data refreshes preserve the last successful governance information and show an error; they must not convert an unavailable source into false zeroes.
- Governance tables retain safe horizontal handling on narrow screens and the approved Source Sans 3 Admin typography.
- Dynamic governance content is **not frozen** by this lock: legitimate actions, objectives, risks, policies, decisions, due dates, statuses and completion-history records must continue to change through the approved live workflows. The lock protects the system structure, definitions and behaviour — not the business records themselves.
- Work in Finance & Accounting or another Admin tab does **not** reopen Management & Governance. Shared Admin files may be edited only for an explicitly approved area and must regression-check this locked workspace when they can affect it.
- A newly discovered Management/Governance defect is a change request, not automatic permission to alter the locked workspace. Aziwe Futhe must explicitly approve the affected correction before implementation.



### Admin Finance & Accounting — FINAL OWNER-APPROVED AND LOCKED (21 September 2026)

The owner physically reviewed **Admin → Finance & Accounting** after the final reconciliation, receivables, reporting, readability and live-refresh corrections and explicitly approved it for lock. The approved Finance code checkpoint is `04fd55eddeaba73bb738bde9e6257ae06843fe5a`; the approved database state also includes the canonical Finance snapshot fields separating contractual receivables from current catalogue valuation.

- **Finance & Accounting is a change-controlled protected Admin surface.** No Finance layout, KPI meaning, contractual-receivables definition, catalogue-comparison logic, payment-review workflow, reconciliation workflow, Accountant Pack workflow, reporting connection, live-refresh behaviour, mobile presentation or typography may be changed unless Aziwe Futhe explicitly reopens the affected Finance area.
- Contracted approved tuition and outstanding approved receivables remain tied to the learner's approved enrolment/agreed amount. Current catalogue pricing remains a separate management-analysis value and must not silently rewrite an existing learner's debt.
- Rejected/declined enrolments must not contribute to approved outstanding receivables.
- Verified collections, current posted expenses, confirmed cash income and net cash result continue to come from the governed Finance calculation. Future/voided cashbook rows must not contaminate current operating totals.
- The Finance Control Centre, Finance Report Centre, Payment Proof Review and period/reconciliation calculations must remain aligned to the same canonical Finance rules; do not restore independent parallel Finance arithmetic.
- Finance reports continue to use the protected Finance period/snapshot RPCs. Finance & Accounting must open as the selected Finance report type.
- Reconciliation keeps validated date ranges, a required valid external statement total and a stored reconciliation difference. Accountant Pack keeps valid start/end period checks.
- Finance remains live through approved Realtime/manual/focus refresh behaviour. A failed refresh preserves the last good figures and displays an error instead of replacing healthy data with false zeroes.
- Payment approval/rejection remains Admin-authorized server-side, blocks double review and overpayment approval, and requires a meaningful rejection reason.
- The retired legacy Finance renderer/fallback remains disabled. If the canonical Finance Centre cannot initialise, Admin must show an explicit unavailable state rather than reverting to obsolete Finance arithmetic.
- Finance uses South African reporting dates in the Admin interface, preserves cents, retains readable Source Sans 3 sizing and responsive desktop/tablet/mobile behaviour.
- Dynamic financial records are not frozen by this lock. Legitimate payments, enrolments, course-price changes, cashbook entries, reconciliations and accountant periods must continue to change through approved workflows. The lock protects definitions, calculations, structure and behaviour.
- Work in Communication Hub or another Admin tab does **not** reopen Finance & Accounting. Shared Admin files touched for another approved area must regression-check Finance when they can affect it.
- A newly discovered Finance defect is a change request, not automatic permission to alter the locked Finance workspace. Aziwe Futhe must explicitly approve the affected correction before implementation.

